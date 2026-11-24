import { BackendError, callAdmin } from './backend';
import { topicPreview, videoCreatorLabel } from './video-titles';

export async function loadVideoTitles(search = '', options = {}, read = callAdmin) {
  try {
    return await read(`videos${search}`, options);
  } catch (err) {
    if (!(err instanceof BackendError) || err.status !== 404) throw err;
  }

  const filters = new URLSearchParams(search);
  const size = Math.min(100, Math.max(1, Math.floor(Number(filters.get('pageSize')) || 25)));
  const page = Math.max(1, Math.floor(Number(filters.get('page')) || 1));
  const registration = filters.get('registration') || 'all';
  const realOnly = ['1', 'true'].includes(filters.get('realOnly') || '');
  const q = (filters.get('q') || '').trim().toLowerCase();
  const devices = new Map<string, any>();

  for (let userPage = 1; ; userPage += 1) {
    const result = await read(`user-list?page=${userPage}&pageSize=100&exact=0&realOnly=0`, options);
    if (!Array.isArray(result.users)) throw new BackendError('The backend returned an invalid installation list.');
    let added = 0;
    for (const user of result.users) {
      if (user.deviceId && !devices.has(user.deviceId)) { devices.set(user.deviceId, user); added += 1; }
    }
    const pages = Number(result.pages) || (Number.isFinite(Number(result.total)) ? Math.ceil(Number(result.total) / 100) : null);
    if (!result.users.length || (pages !== null ? userPage >= pages : result.users.length < 100)) break;
    if (!added) throw new BackendError('The backend did not advance installation pagination.');
  }

  const collected: any[] = [];
  const users = [...devices.values()];
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(4, users.length) }, async () => {
    while (cursor < users.length) {
      const user = users[cursor++];
      for (const kind of ['instant', 'clarity']) {
        const seen = new Set();
        for (let offset = 0; ; offset += 200) {
          const result = await read(`user/${encodeURIComponent(user.deviceId)}/items?kind=${kind}&limit=200&offset=${offset}`, options);
          if (!Array.isArray(result.items)) throw new BackendError('The backend returned invalid topic history.');
          let added = 0;
          for (const item of result.items) {
            if (!item.id || seen.has(item.id)) continue;
            seen.add(item.id);
            added += 1;
            const preview = topicPreview(item);
            const creator = videoCreatorLabel(user);
            collected.push({
              id: item.id,
              deviceId: user.deviceId,
              createdAt: item.createdAt,
              title: item.title || preview,
              preview,
              creator,
              account: user.account || null,
              email: user.email || null,
              username: user.username || null,
              systemName: user.name || null,
              status: item.status || 'completed',
              totalMs: item.totalMs ?? null,
              imageUrl: item.imageUrl || null,
              videoUrl: item.videoUrl || null,
              isTest: Boolean(user.isTest)
            });
          }
          if (result.items.length < 200 || !added) break;
        }
      }
    }
  }));

  let filtered = collected;
  if (realOnly) filtered = filtered.filter(v => !v.isTest);
  if (registration === 'registered') filtered = filtered.filter(v => Boolean(v.account || v.email));
  if (registration === 'anonymous') filtered = filtered.filter(v => !v.account && !v.email);
  if (q) filtered = filtered.filter(v => (v.title && v.title.toLowerCase().includes(q)) || (v.creator && v.creator.toLowerCase().includes(q)));

  filtered.sort((a, b) => Date.parse(b.createdAt || '') - Date.parse(a.createdAt || ''));
  const total = filtered.length;
  const paged = filtered.slice((page - 1) * size, page * size);

  return {
    ok: true,
    total,
    page,
    pageSize: size,
    pages: Math.ceil(total / size) || 1,
    videos: paged,
    compatibilityMode: true
  };
}
