import { BackendError, backendBase, backendConfigured, callAdmin } from './backend';

export async function readTrackingDiagnostics(read = callAdmin) {
  let backendOrigin = 'http://127.0.0.1:8787';
  try {
    backendOrigin = new URL(backendBase()).origin;
  } catch {}
  const base = { checkedAt: new Date().toISOString(), backendOrigin, credentialConfigured: backendConfigured() };
  try {
    const health = await read('tracking-health');
    return { ...base, state: health.schema?.ready ? 'ready' : 'migration-required', nativeHealth: health };
  } catch (err) {
    if (!(err instanceof BackendError) || err.status !== 404) throw err;
  }
  const [overview, videos] = await Promise.allSettled([
    read('overview'), read('videos?page=1&pageSize=1')
  ]);
  return {
    ...base, state: 'older-backend', nativeHealth: null,
    checks: [
      { name: 'Tracking diagnostic contract', ok: false, detail: 'Missing on deployed backend. Update the backend and apply migrations.' },
      { name: 'User metrics API', ok: overview.status === 'fulfilled', detail: overview.status === 'fulfilled' ? 'Responding' : overview.reason?.message || 'Unavailable' },
      { name: 'Global topics API', ok: videos.status === 'fulfilled', detail: videos.status === 'fulfilled' ? 'Responding' : videos.reason?.message || 'Unavailable' }
    ],
    coverageNote: 'Compatibility topic history can work while the deployed backend is older.'
  };
}
