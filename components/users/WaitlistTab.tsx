'use client';

import { useCallback, useEffect, useState } from 'react';
import { get } from '@/lib/client';
import { ago, n, stamp } from '@/lib/format';
import { Empty, ErrorNote, Stat } from './bits';

export default function WaitlistTab() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedEmail, setCopiedEmail] = useState<any>(null);

  const load = useCallback(async (signal?: any) => {
    setLoading(true);
    setError('');
    try {
      const q = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : '';
      const result = await get(`waitlist${q}`, { signal });
      setItems(result.items || []);
      setTotal(result.count || 0);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Could not load waitlist.');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      load(controller.signal);
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [load]);

  function copyEmail(email) {
    if (!email) return;
    navigator.clipboard?.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  }

  function downloadCsv() {
    if (!items.length) return;
    const headers = ['Email', 'Role', 'Source', 'Willing Price', 'Daily Usage', 'Notes / Top Feature', 'Date'];
    const rows = items.map(item => [
      item.email || '',
      item.role || '',
      item.source || '',
      item.willingPrice || '',
      item.dailyUsage || '',
      `"${(item.topFeature || '').replace(/"/g, '""')}"`,
      item.createdAt || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `t2u_waitlist_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const willingCount = items.filter(i => i.willingPrice && i.willingPrice !== 'Free only').length;

  return (
    <div>
      <ErrorNote error={error} onRetry={() => load()} />

      <div className="stat-grid" style={{ marginBottom: 16 }}>
        <Stat label="Total Leads / Waitlist" value={n(total)} sub="Survey and waitlist submissions" tone="ok" />
        <Stat label="Willing to Pay" value={n(willingCount)} sub="Selected paid pricing tier in survey" />
        <Stat label="Survey Respondents" value={n(items.filter(i => i.source === 'Demand Survey').length)} sub="Completed full demand survey" />
        <Stat label="Waitlist Signups" value={n(items.filter(i => i.source !== 'Demand Survey').length)} sub="Early access email leads" />
      </div>

      <div className="toolbar">
        <input
          type="search"
          className="input search"
          placeholder="Filter by email, name, or role…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="topbar-spacer" />
        <button className="btn small secondary" onClick={downloadCsv} disabled={!items.length}>
          Export CSV
        </button>
        <button className="btn small" onClick={() => load()} disabled={loading}>
          {loading ? <span className="spinner" /> : null}
          <span>Refresh</span>
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Source</th>
                <th>Willing Price</th>
                <th>Daily Usage</th>
                <th>Notes / Top Feature</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={7}>
                    <Empty title="No waitlist emails found" subtitle="No submissions match your query." />
                  </td>
                </tr>
              )}
              {items.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <strong style={{ color: 'var(--text)' }}>{item.email}</strong>
                      <button
                        className="btn ghost small"
                        style={{ padding: '2px 6px', fontSize: 11 }}
                        onClick={() => copyEmail(item.email)}
                        title="Copy email"
                      >
                        {copiedEmail === item.email ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className="pill small">{item.role || 'User'}</span>
                  </td>
                  <td>
                    <span className="cell-faint">{item.source}</span>
                  </td>
                  <td>
                    {item.willingPrice ? (
                      <span className="pill small ok">{item.willingPrice}</span>
                    ) : (
                      <span className="cell-faint">—</span>
                    )}
                  </td>
                  <td>
                    <span className="cell-faint">{item.dailyUsage || '—'}</span>
                  </td>
                  <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span title={item.topFeature || ''}>{item.topFeature || '—'}</span>
                  </td>
                  <td>
                    <span className="cell-faint" title={item.createdAt ? stamp(item.createdAt) : ''}>
                      {item.createdAt ? ago(item.createdAt) : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
