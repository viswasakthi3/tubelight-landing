'use client';

import { useCallback, useEffect, useState } from 'react';
import { get } from '@/lib/client';
import { ago, credits, ms, n, percent, shortDay } from '@/lib/format';
import { DeviceId, Empty, ErrorNote, RankList, Stat } from './bits';

const RANGES = [7, 14, 30, 90];

export default function OverviewTab({ onPickDevice }: { onPickDevice: (device: any) => void }) {
  const [overview, setOverview] = useState<any>(null);
  const [breakdowns, setBreakdowns] = useState<any>(null);
  const [days, setDays] = useState<number>(30);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError('');
      try {
        const [o, b] = await Promise.allSettled([
          get('overview', { signal }),
          get(`breakdowns?days=${days}`, { signal })
        ]);

        if (signal?.aborted) return;

        if (o.status === 'fulfilled') setOverview(o.value.overview);
        else { setOverview(null); setError(o.reason?.message || 'Could not read the overview.'); }

        if (b.status === 'fulfilled') setBreakdowns(b.value.breakdowns);
        else { setBreakdowns(null); setError(prev => [prev, b.reason?.message || 'Could not read activity breakdowns.'].filter(Boolean).join(' ')); }

        setRefreshedAt(o.status === 'fulfilled' && b.status === 'fulfilled' ? new Date().toISOString() : null);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [days]
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  if (loading && !overview) {
    return (
      <div className="stat-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div className="stat" key={i}>
            <div className="skeleton" style={{ width: '55%', height: 10 }} />
            <div className="skeleton" style={{ width: '40%', height: 24, marginTop: 10 }} />
          </div>
        ))}
      </div>
    );
  }

  const o = overview;
  const maxDaily = Math.max(1, ...(breakdowns?.daily || []).map(d => d.runs));

  return (
    <div>
      <ErrorNote error={error} onRetry={() => load()} />

      <div className="page-intro">
        <div><h1>User metrics</h1><p>Track installations, account registration, video activity and data coverage.</p></div>
        <span className="pill plain">Operator overview</span>
      </div>

      <div className="toolbar">
        <div className="seg">
          {RANGES.map(r => (
            <button key={r} aria-pressed={days === r} onClick={() => setDays(r)}>
              {r}d
            </button>
          ))}
        </div>
        <div className="topbar-spacer" />
        <span className="cell-faint">
          {refreshedAt ? `read ${ago(refreshedAt)}` : ''}
        </span>
        <button className="btn small" onClick={() => load()} disabled={loading}>
          {loading ? <span className="spinner" /> : null}
          <span>Refresh</span>
        </button>
      </div>

      {o && (
        <>
          {/* Main Actionable Metrics */}
          <div className="stat-grid" style={{ marginBottom: 16 }}>
            <Stat
              label="Active Users · 24h"
              value={n(o.devices.realActive24h ?? o.devices.active24h)}
              sub={`${n(o.devices.active24h)} installations connected`}
              tone="ok"
            />
            <Stat
              label="Video attempts · 24h"
              value={n(o.videos?.today ?? o.runs?.last24h)}
              sub={`in the last 24 hours`}
              tone="ok"
            />
            <Stat
              label="Videos produced"
              value={o.videos?.completedTotal != null ? n(o.videos.completedTotal) : '—'}
              sub={`${n(o.videos?.total ?? o.runs?.total)} attempts · includes partial outputs`}
            />
            <Stat
              label="Waitlist & Leads"
              value={n(o.waitlist?.total ?? 0)}
              sub="Waitlist and demand surveys"
              tone={o.waitlist?.total ? 'ok' : ''}
            />
            <Stat
              label="Total Users"
              value={n(o.devices.realTotal ?? o.accounts.total ?? o.devices.total)}
              sub={`${n(o.accounts.total)} registered accounts · ${n(o.devices.realTotal ?? o.devices.total)} real users`}
              tone="ok"
            />
            <Stat
              label="Accounts Registered"
              value={n(o.accounts.total)}
              sub={`${n(o.devices.signedIn)} devices connected`}
            />
            <Stat
              label="Latest recorded period spend"
              value={credits(o.credits.latestRecordedPeriods ?? o.credits.currentPeriod)}
              sub="May include expired periods; exact balances in Users"
            />
            <Stat
              label="Generation Health"
              value={percent(o.runs.successRate)}
              sub={`${n(o.runs.failed)} failures recorded`}
              tone={o.runs.successRate === null ? '' : o.runs.successRate >= 0.95 ? 'ok' : o.runs.successRate >= 0.85 ? 'warn' : 'bad'}
            />
          </div>

          {o.trackingHealth && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-head"><div><h2>Tracking health & identity</h2><p>Coverage checks explain differences between installs, registered accounts and creators.</p></div></div>
              <div className="card-body">
                <div className="stat-grid">
                  <Stat label="Video creator installations" value={n(o.creators?.total)} sub={`${n(o.creators?.registered)} registered · ${n(o.creators?.anonymous)} anonymous`} />
                  <Stat label="Unlinked accounts" value={n(o.trackingHealth.unlinkedAccounts)} sub="Visible in Users without device credit controls" tone={o.trackingHealth.unlinkedAccounts ? 'warn' : 'ok'} />
                  <Stat label="Rows missing device identity" value={n(o.trackingHealth.generationRowsWithoutDevice)} tone={o.trackingHealth.generationRowsWithoutDevice ? 'warn' : 'ok'} />
                  <Stat label="Rows missing titles" value={n(o.trackingHealth.generationRowsWithoutTitle)} tone={o.trackingHealth.generationRowsWithoutTitle ? 'warn' : 'ok'} />
                  <Stat label="First-install events" value={n(o.installs?.firstInstalls)} sub={`${n(o.installs?.reinstalls)} reinstalls · ${n(o.installs?.uninstalls)} uninstall events`} />
                  <Stat label="Analytics configuration" value={o.trackingHealth.posthogConfigured ? (o.trackingHealth.posthogEnabled ? 'Enabled' : 'Configured / off') : 'Unavailable'} sub={`Database: ${o.trackingHealth.dbConfigured ? 'configured' : 'unavailable'}`} tone={o.trackingHealth.dbConfigured ? 'ok' : 'bad'} />
                </div>
                <p className="metric-note">{o.trackingHealth.installDefinition}</p>
                <p className="metric-note">{o.trackingHealth.activityDefinition}</p>
                <p className="metric-note">{o.trackingHealth.identityDefinition}</p>
              </div>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 12,
              marginBottom: 12
            }}
          >
            {/* Explanations per day chart */}
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <div className="card-head">
                <div>
                  <h2>Generation attempts per day</h2>
                  <p>
                    Last {breakdowns?.days ?? days} days. Green is completed, red is failed.
                  </p>
                </div>
              </div>
              <div className="card-body">
                {breakdowns?.daily?.length ? (
                  <>
                    <div className="bars">
                      {breakdowns.daily.map(d => (
                        <div className="bar-col" key={d.day} title={`${shortDay(d.day)} — ${d.runs} runs`}>
                          <div className="bar-tip">
                            <strong>{shortDay(d.day)}</strong> · {n(d.runs)} runs
                            {d.failed ? ` · ${n(d.failed)} failed` : ''} · {n(d.devices)} devices
                          </div>
                          {d.failed > 0 && (
                            <div
                              className="bar-bad"
                              style={{ height: `${(d.failed / maxDaily) * 100}%` }}
                            />
                          )}
                          <div className="bar-ok" style={{ height: `${(d.ok / maxDaily) * 100}%` }} />
                        </div>
                      ))}
                    </div>
                    <div className="bar-axis">
                      <span>{shortDay(breakdowns.daily[0]?.day)}</span>
                      <span>{n(maxDaily)} peak</span>
                      <span>{shortDay(breakdowns.daily.at(-1)?.day)}</span>
                    </div>
                  </>
                ) : (
                  <Empty title="Nothing in this window." />
                )}
              </div>
            </div>

            {/* Live Recent Creations Feed */}
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <div className="card-head">
                <div>
                  <h2>Recent Video Creations</h2>
                  <p>Latest recorded generation attempts, including failures. Refresh to update.</p>
                </div>
              </div>
              <div className="card-body" style={{ padding: 12 }}>
                {!o.recentFeed?.length ? (
                  <Empty title="No recent creations." />
                ) : (
                  <div className="feed-list">
                    {o.recentFeed.map(feed => (
                      <div
                        className="feed-row"
                        key={feed.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => onPickDevice?.({ deviceId: feed.deviceId })}
                        title="Click to view this installation"
                      >
                        {feed.imageUrl ? (
                          <img src={feed.imageUrl} alt={feed.title} className="feed-img" />
                        ) : (
                          <div className="feed-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text-faint)' }}>
                            {feed.visualType || 'video'}
                          </div>
                        )}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span className="feed-title">{feed.title}</span>
                            <span className={`pill small ${feed.status === 'ok' ? 'ok' : 'bad'}`}>
                              {feed.status}
                            </span>
                          </div>
                          <div className="feed-meta">
                            <span>{feed.prompt ? feed.prompt.slice(0, 90) : 'Prompt processed'}</span>
                            <span>·</span>
                            <span>{ago(feed.createdAt)}</span>
                            <span>·</span>
                            <DeviceId id={feed.deviceId} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <div>
                  <h2>Explanation Modes</h2>
                  <p>Mode 1 (Fast), Mode 2 (Mid), Mode 3 (Rich).</p>
                </div>
              </div>
              <div className="card-body">
                <RankList rows={breakdowns?.modes || []} />
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <div>
                  <h2>Where it is used</h2>
                  <p>Which surface the run came from.</p>
                </div>
              </div>
              <div className="card-body">
                <RankList rows={breakdowns?.surfaces || []} />
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <div>
                  <h2>Busiest installations</h2>
                  <p>Click one to open it.</p>
                </div>
              </div>
              <div className="card-body" style={{ padding: '8px 10px' }}>
                {breakdowns?.topDevices?.length ? (
                  breakdowns.topDevices.map(d => (
                    <div
                      className="rank-row"
                      key={d.deviceId}
                      style={{ cursor: 'pointer' }}
                      onClick={() => onPickDevice?.({ deviceId: d.deviceId, email: d.email })}
                    >
                      <div className="rank-fill" style={{ width: `${(d.runs / (breakdowns.topDevices[0].runs || 1)) * 100}%` }} />
                      <span className="rank-name" style={{ textTransform: 'none', minWidth: 0 }}>
                        {d.email || <DeviceId id={d.deviceId} />}
                      </span>
                      <span className="rank-meta">
                        {n(d.runs)} · {ago(d.lastRun)}
                      </span>
                    </div>
                  ))
                ) : (
                  <Empty title="Nothing recorded yet." />
                )}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-head">
              <div>
                <h2>Learning & Search Telemetry</h2>
                <p>Telemetry for Tab+Q quick searches, user notes, and mode selections.</p>
              </div>
            </div>
            <div className="card-body">
              <div className="stat-grid" style={{ marginBottom: 0 }}>
                <Stat
                  label="Quick Searches Today"
                  value={n(o.questions?.today ?? 0)}
                  sub={`${n(o.questions?.last7d ?? 0)} past 7 days · ${n(o.questions?.total ?? 0)} total`}
                  tone={o.questions?.today ? 'ok' : ''}
                />
                <Stat
                  label="Mode 1 · Fast"
                  value={n(o.modes?.fast ?? 0)}
                  sub="Speedy 1-beat explanations"
                />
                <Stat
                  label="Mode 2 · Mid"
                  value={n(o.modes?.mid ?? 0)}
                  sub="Balanced explanations"
                />
                <Stat
                  label="Mode 3 · Rich"
                  value={n(o.modes?.rich ?? 0)}
                  sub="Deep multi-scene / clarity"
                />
                <Stat
                  label="User Notes Saved"
                  value={n(o.notes?.total ?? 0)}
                  sub="Persistent topic notes"
                  tone={o.notes?.total ? 'ok' : ''}
                />
                <Stat
                  label="Selected Text vs Topics"
                  value={`${n(o.runs.text)} / ${n(o.runs.topic)}`}
                  sub="highlighted text / typed topic"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <h2>Tiers & Details</h2>
                <p>Plan breakdowns and breakdown telemetry.</p>
              </div>
            </div>
            <div className="card-body">
              <div className="stat-grid" style={{ marginBottom: 0 }}>
                <Stat label="Free Tier" value={n(o.tiers.free)} sub="installations" />
                <Stat label="Pro Tier" value={n(o.tiers.pro)} sub={`${n(o.accounts.activePro)} active pro users`} />
                <Stat label="Dev Mode" value={n(o.tiers.dev)} sub="installations" />
                <Stat label="No Ceiling" value={n(o.devices.unlimited)} sub="unlimited devices" />
                <Stat label="Total Lifetime Credits" value={credits(o.credits.lifetime)} sub="all time spend" />
                <Stat label="Median Response Time" value={ms(o.runs.p50Ms)} sub={`p95 ${ms(o.runs.p95Ms)}`} />
                <Stat label="ClarityFrame Runs" value={n(o.clarity.total)} sub={`${n(o.clarity.rated)} rated`} />
                <Stat label="Topics vs Text" value={`${n(o.runs.topic)} / ${n(o.runs.text)}`} sub="typed topic / selection" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
