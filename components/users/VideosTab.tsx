'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { get } from '@/lib/client';
import { n, stamp } from '@/lib/format';
import { videoCreatorLabel } from '@/lib/video-titles';
import { DeviceId, Empty, ErrorNote, TableSkeleton } from './bits';

export default function VideosTab({ onSelect }) {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [registration, setRegistration] = useState('all');
  const [realOnly, setRealOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(query.trim()); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ q: search, registration, realOnly: realOnly ? '1' : '0', page: String(page), pageSize: '25' });
    try {
      const result = await get(`videos?${params}`, { signal: controller.signal });
      if (!controller.signal.aborted) setData(result);
    } catch (err: any) {
      if (!controller.signal.aborted) { setError(err.message); setData(null); }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [search, registration, realOnly, page]);

  useEffect(() => {
    load();
    return () => requestRef.current?.abort();
  }, [load]);

  return (
    <section aria-label="Video titles">
      <div className="page-intro">
        <div>
          <h1>Topics & video titles</h1>
          <p className="cell-dim">Topics across every installation, with or without an account. In-progress attempts, failures and produced videos are labelled by status.</p>
        </div>
        <button className="btn" onClick={load} disabled={loading}>Refresh</button>
      </div>
      <div className="notice">
        This list uses generation records, not files saved on a learner’s computer. Older runs without a recorded title show their topic; local-only and unrecorded runs cannot be recovered here.
      </div>
      <div className="toolbar">
        <input className="input" aria-label="Search video titles or creators" placeholder="Search title, topic, email or device…" value={query} onChange={e => setQuery(e.target.value)} />
        <select className="select" aria-label="Creator registration" value={registration} onChange={e => { setRegistration(e.target.value); setPage(1); }}>
          <option value="all">All creators</option>
          <option value="registered">Registered creators</option>
          <option value="anonymous">Unregistered creators</option>
        </select>
        <label className="cell-dim"><input type="checkbox" checked={realOnly} onChange={e => { setRealOnly(e.target.checked); setPage(1); }} /> Hide test installations</label>
      </div>
      <ErrorNote error={error} onRetry={load} />
      {data?.coverageNote && <div className="notice">{data.coverageNote}</div>}
      <div className="card">
        <div className="card-head"><h2>{loading ? 'Loading topics…' : error ? 'Topics unavailable' : `${n(data?.total ?? 0)} matching topic records`}</h2></div>
        {loading ? <div className="table-wrap"><table aria-label="Loading titles"><TableSkeleton cols={5} rows={8} /></table></div> : error ? <Empty title="Titles could not be loaded." /> : !data?.videos?.length ? <Empty title="No matching titles." /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Title / topic</th><th>Creator</th><th>Source</th><th>Status</th><th>Created</th></tr></thead>
              <tbody>{data.videos.map(video => (
                <tr key={`${video.source}:${video.id}`}>
                  <td style={{ maxWidth: 440, whiteSpace: 'normal', overflowWrap: 'anywhere' }}><strong>{video.title || video.preview || 'Untitled run'}</strong>{video.isTest && <span className="pill">test</span>}</td>
                  <td>
                    {video.deviceId ? <button className="btn small ghost" onClick={() => onSelect?.({ deviceId: video.deviceId, email: video.email, name: video.name })}>{video.creatorLabel || videoCreatorLabel(video)}</button> : <span>{video.creatorLabel || videoCreatorLabel(video)}</span>}
                    <div className="cell-faint">{video.registered ? 'Registered' : 'Unregistered'}{video.deviceId && <> · <DeviceId id={video.deviceId} /></>}</div>
                    {video.attribution === 'current-device-link' && <div className="cell-faint" title="Older records lack an account ID; this is the account currently linked to the device.">Account inferred from device</div>}
                  </td>
                  <td>{video.source}<div className="cell-faint">{video.mode}</div></td>
                  <td><span className="pill">{video.status || 'unknown'}</span></td>
                  <td>{stamp(video.createdAt)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <div className="card-foot" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn small" disabled={loading || !!error || page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span className="cell-dim">Page {page} of {Math.max(1, data?.pages || 1)}</span>
          <button className="btn small" disabled={loading || !!error || page >= (data?.pages || 1)} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>
    </section>
  );
}
