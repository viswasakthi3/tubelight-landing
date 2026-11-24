'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { get } from '@/lib/client';
import { n, stamp } from '@/lib/format';
import { ErrorNote, Stat } from './bits';

export default function TrackingTab() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const controllerRef = useRef(null);
  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError('');
    try {
      const result = await get('diagnostics', { signal: controller.signal });
      if (!controller.signal.aborted) setData(result);
    } catch (err: any) {
      if (!controller.signal.aborted) { setError(err.message); setData(null); }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => { load(); return () => controllerRef.current?.abort(); }, [load]);
  const health = data?.nativeHealth;
  return <section aria-label="Tracking diagnostics">
    <div className="page-intro">
      <div><h1>Tracking diagnostics</h1><p>Check the backend this panel connects to, its schema and the newest recorded activity.</p></div>
      <button className="btn" onClick={load} disabled={loading}>{loading ? 'Checking…' : 'Refresh checks'}</button>
    </div>
    <ErrorNote error={error} onRetry={load} />
    {data && <>
      <div className={`notice ${data.state === 'ready' ? '' : 'bad'}`}>
        <strong>{data.state === 'ready' ? 'Tracking schema checks passed' : data.state === 'older-backend' ? 'Deployed backend is missing tracking diagnostics' : 'Backend migrations are incomplete'}</strong>
        <p>Connected backend: <code>{data.backendOrigin}</code> · checked {stamp(data.checkedAt)}. Credentials {data.credentialConfigured ? 'configured' : 'missing'}.</p>
        <p>Passing checks confirms schema/read coverage. It does not prove a particular installer contacted this backend or that analytics events were delivered.</p>
      </div>
      {data.coverageNote && <p className="metric-note">{data.coverageNote}</p>}
      {data.checks?.map(check => <div key={check.name} className={`notice ${check.ok ? '' : 'bad'}`}><strong>{check.name}: {check.ok ? 'available' : 'unavailable'}</strong><p>{check.detail}</p></div>)}
      {health && <>
        <div className="stat-grid">
          <Stat label="Tracked installations" value={n(health.counts?.devices)} />
          <Stat label="Registered accounts" value={n(health.counts?.accounts)} />
          <Stat label="Recorded generations" value={n(health.counts?.generations)} />
          <Stat label="Topics awaiting completion" value={n(health.counts?.startedTopics)} />
          <Stat label="Unsettled topics over 15 minutes" value={n(health.counts?.staleStartedTopics)} />
          <Stat label="Diagnostic contract" value={n(health.contractVersion)} />
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-head"><h2>Latest database activity</h2></div>
          <div className="table-wrap"><table><thead><tr><th>Signal</th><th>Most recent</th></tr></thead><tbody>
            <tr><td>Device seen</td><td>{stamp(health.latest?.deviceSeenAt)}</td></tr>
            <tr><td>Account created</td><td>{stamp(health.latest?.accountCreatedAt)}</td></tr>
            <tr><td>Generation recorded</td><td>{stamp(health.latest?.generationCreatedAt)}</td></tr>
            <tr><td>Install event</td><td>{stamp(health.latest?.installEventAt)}</td></tr>
          </tbody></table></div>
        </div>
        {!health.schema?.ready && <div className="notice bad">
          <strong>Missing schema objects</strong>
          <p>Tables: {health.schema?.missingTables?.join(', ') || 'none'}</p>
          <p>Columns: {health.schema?.missingColumns?.join(', ') || 'none'}</p>
          <p>Indexes: {health.schema?.missingIndexes?.join(', ') || 'none'}</p>
          <p>Invalid columns: {health.schema?.invalidColumns?.join(', ') || 'none'}</p>
          <p>Invalid indexes: {health.schema?.invalidIndexes?.join(', ') || 'none'}</p>
        </div>}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-head"><div><h2>Tracking write delivery</h2><p>Current backend process since {stamp(health.persistence?.startedAt)}. Counters reset on restart and do not prove historical delivery across replicas.</p></div></div>
          <div className="table-wrap"><table><thead><tr><th>Source</th><th>Successful writes</th><th>Failed writes</th><th>Last failure</th></tr></thead><tbody>
            {Object.entries(health.persistence?.sources || {}).map(([source, counters]: [string, any]) => <tr key={source}>
              <td>{source}</td><td>{n(counters?.successes)}</td><td style={{ color: counters?.failures ? 'var(--bad)' : 'inherit' }}>{n(counters?.failures)}</td><td>{stamp(counters?.lastFailureAt)}</td>
            </tr>)}
            {!Object.keys(health.persistence?.sources || {}).length && <tr><td colSpan={4}>No tracking writes observed by this process yet.</td></tr>}
          </tbody></table></div>
        </div>
      </>}
    </>}
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-head"><h2>Locate a missing user</h2></div>
      <div className="card-body"><ol>
        <li>Confirm the learner launched the app and completed a server-backed action. Downloading or installing alone does not register a device.</li>
        <li>Search Users with all installations and all registrations selected. Search the account email or the app’s installation ID.</li>
        <li>Search Video titles without hiding test installations. Anonymous runs have a platform/device label.</li>
        <li>Compare the app’s backend URL with the connected backend above. Different backends or databases produce different user lists.</li>
        <li>If the latest timestamps stay unchanged after a successful generation, inspect backend registration/history errors and verify the production migration and database connection.</li>
      </ol></div>
    </div>
  </section>;
}
