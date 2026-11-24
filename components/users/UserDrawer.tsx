'use client';

import { useEffect, useState } from 'react';
import { get } from '@/lib/client';
import { ago, credits, n, stamp, tierOf } from '@/lib/format';
import { DeviceId, ErrorNote, Meter, TierPill, Who } from './bits';
import LimitEditor from './LimitEditor';
import OnboardingSection from './OnboardingSection';

/* One installation, in full.
 *
 * Everything the server knows about a device, on one panel, in the order somebody
 * actually asks for it: who they are, what their meter says, then the history that
 * explains the meter, then the operator actions that have been taken against it.
 *
 * Fetched fresh every time it opens. There is no cache to go stale and no copy left
 * behind when it closes — the component unmounts and takes its state with it, which is
 * the whole of the "nothing is stored here" promise as it applies to a single person.
 */

function ProviderBadge({ provider }) {
  const p = String(provider || '').toLowerCase();
  let label = provider || 'Unknown';
  let className = 'pill plain';

  if (p.includes('flash-lite') || p.includes('flash_lite')) {
    label = 'Flash Lite';
    className = 'pill mode-1';
  } else if (p.includes('gemini') || p.includes('flash')) {
    label = 'Gemini 2.5 Flash';
    className = 'pill mode-3';
  } else if (p.includes('sarvam') || p.includes('saaras')) {
    label = 'Sarvam AI';
    className = 'pill warn';
  } else if (p.includes('deepgram') || p.includes('nova')) {
    label = 'Deepgram';
    className = 'pill ok';
  }

  return <span className={className} style={{ fontSize: 11 }}>{label}</span>;
}

export default function UserDrawer({ deviceId, onClose, onChanged, onSeeItems, onChatUser }) {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [showVoiceSearches, setShowVoiceSearches] = useState(false);
  const [voiceSearches, setVoiceSearches] = useState<any>(null);
  const [loadingVoiceSearches, setLoadingVoiceSearches] = useState(false);
  const [voiceSearchesError, setVoiceSearchesError] = useState('');

  useEffect(() => {
    let live = true;
    setUser(null);
    setError('');
    setShowVoiceSearches(false);
    setVoiceSearches(null);
    setVoiceSearchesError('');

    get(`user/${encodeURIComponent(deviceId)}`)
      .then(result => {
        if (!live) return;
        setUser(result.user);
        onChanged?.(result.user);
      })
      .catch(err => live && setError(err.message));

    return () => {
      live = false;
    };
  }, [deviceId, onChanged]);

  const quota = user?.quota;
  const maxPeriod = Math.max(1, ...(user?.periods || []).map(p => p.used));

  const toggleVoiceSearches = () => {
    const next = !showVoiceSearches;
    setShowVoiceSearches(next);
    if (next && voiceSearches === null && !loadingVoiceSearches) {
      setLoadingVoiceSearches(true);
      setVoiceSearchesError('');
      get(`user/${encodeURIComponent(deviceId)}/voice-searches`)
        .then(result => {
          setVoiceSearches(result.searches || []);
        })
        .catch(err => {
          setVoiceSearchesError(err.message || 'Failed to load voice searches.');
        })
        .finally(() => {
          setLoadingVoiceSearches(false);
        });
    }
  };

  const voiceCount = voiceSearches ? voiceSearches.length : (user?.learning?.voiceSearchesCount ?? null);

  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Installation detail">
        <div className="drawer-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>{user?.name || user?.email || 'Installation'}</h2>
            <DeviceId id={deviceId} />
          </div>
          {user && <TierPill tier={tierOf(user)} />}
          <button className="btn small ghost" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="drawer-body">
          <ErrorNote error={error} />

          {!user && !error ? (
            <>
              <div className="skeleton" style={{ height: 12, width: '60%' }} />
              <div className="skeleton" style={{ height: 12, width: '40%', marginTop: 10 }} />
              <div className="skeleton" style={{ height: 60, marginTop: 16 }} />
            </>
          ) : user ? (
            <>
              <div className="drawer-section">
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  <button className="btn primary" onClick={() => setEditing(true)}>
                    ⚡ Add credits / Change limit
                  </button>
                  <button className="btn" onClick={onSeeItems}>
                    See their items
                  </button>
                  {onChatUser && (
                    <button className="btn" onClick={onChatUser} title="Open chat with this user">
                      💬 Chat with user
                    </button>
                  )}
                </div>

                <h3>This period</h3>
                {quota ? (
                  <>
                    <Meter used={quota.used} limit={quota.limit} unlimited={quota.unlimited} />
                    <dl className="kv" style={{ marginTop: 12 }}>
                      <dt>Left</dt>
                      <dd>
                        {quota.unlimited ? 'no ceiling' : `${credits(quota.remaining)} credits`}
                        {quota.mix ? <span className="cell-faint"> — {quota.mix}</span> : null}
                      </dd>
                      <dt>Period</dt>
                      <dd>
                        {quota.day} → resets {stamp(quota.resetAt)}
                      </dd>
                      <dt>Plan gives</dt>
                      <dd>
                        {quota.monthly === null ? 'no ceiling' : `${credits(quota.monthly)} a ${quota.period}`}
                        {quota.firstPeriod && (
                          <span className="cell-faint"> — first period, on the welcome grant</span>
                        )}
                      </dd>
                      {quota.proUntil && (
                        <>
                          <dt>Pro until</dt>
                          <dd>{stamp(quota.proUntil)}</dd>
                        </>
                      )}
                    </dl>
                  </>
                ) : (
                  <span className="cell-faint">Could not read this device's quota.</span>
                )}
              </div>

              {(user.dailyFast || quota?.dailyFast) && (() => {
                const daily = user.dailyFast || quota.dailyFast;
                return <div className="drawer-section">
                  <h3>Daily free Fast video</h3>
                  <dl className="kv">
                    <dt>Eligibility</dt><dd><span className={`pill ${daily.eligible ? 'ok' : 'plain'}`}>{daily.eligible ? 'Eligible' : 'Not eligible'}</span></dd>
                    <dt>Reason</dt><dd>{String(daily.reason || 'unavailable').replace(/_/g, ' ')}</dd>
                    <dt>Today</dt><dd>{n(daily.used)} / {n(daily.limit)} used · {n(daily.remaining)} remaining</dd>
                    {daily.resetAt && <><dt>Resets</dt><dd>{stamp(daily.resetAt)}</dd></>}
                  </dl>
                  <p className="metric-note">Fast videos only, after the regular allowance is exhausted. Eligibility and the daily meter are separate from the monthly balance.</p>
                </div>;
              })()}

              <OnboardingSection summary={user.onboarding} events={user.onboardingEvents} />

              <div className="drawer-section">
                <h3>Who</h3>
                <dl className="kv">
                  <dt>Name</dt>
                  <dd>{user.name || <span className="cell-faint">not given</span>}</dd>
                  <dt>Email</dt>
                  <dd>{user.email || <span className="cell-faint">not given</span>}</dd>
                  <dt>Account</dt>
                  <dd>
                    {user.account ? (
                      <>
                        {user.account.username}
                        <span className="cell-faint"> · since {stamp(user.account.createdAt)}</span>
                      </>
                    ) : (
                      <span className="cell-faint">never signed in</span>
                    )}
                  </dd>
                  {user.age ? (
                    <>
                      <dt>Age</dt>
                      <dd>{user.age}</dd>
                    </>
                  ) : null}
                  {user.learningGoal ? (
                    <>
                      <dt>Here to learn</dt>
                      <dd>{user.learningGoal}</dd>
                    </>
                  ) : null}
                  <dt>Profile done</dt>
                  <dd>
                    {user.profileCompletedAt ? (
                      stamp(user.profileCompletedAt)
                    ) : (
                      <span className="cell-faint">not completed</span>
                    )}
                  </dd>
                </dl>
              </div>

              <div className="drawer-section">
                <h3>Installation</h3>
                <dl className="kv">
                  <dt>Platform</dt>
                  <dd>
                    {user.platform || <span className="cell-faint">unknown</span>}
                    {user.appVersion ? ` · v${user.appVersion}` : ''}
                  </dd>
                  <dt>First seen</dt>
                  <dd>{stamp(user.createdAt)}</dd>
                  <dt>Last seen</dt>
                  <dd>
                    {stamp(user.lastSeenAt)} <span className="cell-faint">({ago(user.lastSeenAt)})</span>
                  </dd>
                  <dt>Videos Made</dt>
                  <dd>
                    <b>{n(user.videosMade ?? user.runCount)} total</b>
                    <span className="cell-faint"> (completed / partial runs{user.clarityCount ? ` · ${n(user.clarityCount)} Clarity records` : ''})</span>
                    {user.lastRun ? <span className="cell-faint"> — last {ago(user.lastRun)}</span> : null}
                  </dd>
                  <dt>Hand-set ceiling</dt>
                  <dd>
                    {user.customLimit === null ? (
                      <span className="cell-faint">none — following the plan</span>
                    ) : (
                      `${credits(user.customLimit)} credits`
                    )}
                  </dd>
                  {user.boostedAt && (
                    <>
                      <dt>Last adjusted</dt>
                      <dd>{stamp(user.boostedAt)}</dd>
                    </>
                  )}
                </dl>
              </div>

              <div className="drawer-section">
                <h3>Learning Activity & Modes</h3>
                <dl className="kv">
                  <dt>Mode 1 · Fast</dt>
                  <dd>
                    <span className="pill mode-1" style={{ marginRight: 8 }}>Mode 1</span>
                    <b>{n(user.learning?.modes?.fast ?? 0)}</b> explanations
                  </dd>
                  <dt>Mode 2 · Mid</dt>
                  <dd>
                    <span className="pill mode-2" style={{ marginRight: 8 }}>Mode 2</span>
                    <b>{n(user.learning?.modes?.mid ?? 0)}</b> explanations
                  </dd>
                  <dt>Mode 3 · Rich</dt>
                  <dd>
                    <span className="pill mode-3" style={{ marginRight: 8 }}>Mode 3</span>
                    <b>{n(user.learning?.modes?.rich ?? 0)}</b> explanations
                  </dd>
                  <dt>Quick Search (Tab+Q)</dt>
                  <dd>
                    <div>
                      <b>{n(user.learning?.questions?.total ?? 0)} questions</b>
                      <span className="cell-faint">
                        {' '}({n(user.learning?.questions?.today ?? 0)} today · {n(user.learning?.questions?.last7d ?? 0)} this week)
                      </span>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <button
                        type="button"
                        className={`btn small ${showVoiceSearches ? 'active' : 'ghost'}`}
                        onClick={toggleVoiceSearches}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}
                      >
                        🎙️ Recorded Spoken Queries
                        <span className="pill plain" style={{ padding: '1px 6px', fontSize: 10.5, fontWeight: 600 }}>
                          {voiceCount != null ? voiceCount : 0}
                        </span>
                        <span style={{ fontSize: 9 }}>{showVoiceSearches ? '▲' : '▼'}</span>
                      </button>
                    </div>
                  </dd>
                  <dt>Saved Notes</dt>
                  <dd>
                    <b>{n(user.learning?.notesCount ?? 0)}</b> notes recorded
                  </dd>
                </dl>

                {showVoiceSearches && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        🎙️ Recorded Spoken Queries
                        <span className="pill plain" style={{ fontSize: 11, padding: '1px 6px' }}>
                          {voiceCount != null ? voiceCount : 0}
                        </span>
                      </h4>
                      {loadingVoiceSearches && <span className="cell-faint" style={{ fontSize: 11.5 }}>Loading…</span>}
                    </div>

                    {loadingVoiceSearches ? (
                      <div style={{ padding: '12px 0' }}>
                        <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 8 }} />
                        <div className="skeleton" style={{ height: 36, width: '100%' }} />
                      </div>
                    ) : voiceSearchesError ? (
                      <ErrorNote error={voiceSearchesError} />
                    ) : !voiceSearches || voiceSearches.length === 0 ? (
                      <div className="cell-faint" style={{ padding: '8px 0', fontSize: 12.5 }}>
                        No recorded spoken queries for this device yet.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {voiceSearches.map((search, idx) => (
                          <div className="item" key={search.id || idx}>
                            <div className="item-top" style={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span className="pill plain" style={{ fontWeight: 600, fontSize: 11 }}>
                                  #{search.queryNumber || (idx + 1)}
                                </span>
                                <ProviderBadge provider={search.provider} />
                                {search.durationSec != null && (
                                  <span className="cell-faint" style={{ fontSize: 11.5 }}>
                                    {search.durationSec}s
                                  </span>
                                )}
                              </div>
                              <div className="item-meta">
                                <span title={stamp(search.createdAt)}>{ago(search.createdAt)}</span>
                              </div>
                            </div>

                            {search.transcript ? (
                              <div style={{ fontSize: 13, margin: '6px 0 8px', color: 'var(--text)', fontStyle: 'italic', wordBreak: 'break-word' }}>
                                "{search.transcript}"
                              </div>
                            ) : (
                              <div className="cell-faint" style={{ fontSize: 12, margin: '6px 0 8px' }}>
                                (No transcript captured)
                              </div>
                            )}

                            <div style={{ marginTop: 6 }}>
                              <audio
                                controls
                                src={`/api/admin/voice-searches/${encodeURIComponent(search.id)}/audio`}
                                preload="none"
                                style={{ width: '100%', height: 32, borderRadius: 4 }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {user.periods?.length > 1 && (
                <div className="drawer-section">
                  <h3>Credits, period by period</h3>
                  {/* Oldest on the left, which is the direction time is read in — the
                      backend returns newest-first because that is the useful order for a
                      LIMIT, and reversing it is this component's business. */}
                  <div className="bars" style={{ height: 70 }}>
                    {[...user.periods].reverse().map(period => (
                      <div className="bar-col" key={period.key}>
                        <div className="bar-tip">
                          {period.key} · {credits(period.used)} credits
                        </div>
                        <div
                          className="bar-ok"
                          style={{ height: `${(period.used / maxPeriod) * 100}%`, minHeight: 2 }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="bar-axis">
                    <span>{[...user.periods].reverse()[0]?.key}</span>
                    <span>{user.periods[0]?.key}</span>
                  </div>
                </div>
              )}

              {user.requests?.length > 0 && (
                <div className="drawer-section">
                  <h3>What they have asked for</h3>
                  {user.requests.map(request => (
                    <div className="item" key={request.id}>
                      <div className="item-top">
                        <span className="pill plain">{request.type}</span>
                        <span className="item-title">{request.title}</span>
                        <span className={`pill ${request.status === 'open' ? 'warn' : 'ok'}`}>
                          {request.status}
                        </span>
                      </div>
                      <div className="item-meta">
                        <span>{ago(request.created_at)}</span>
                        <span className="dot">{n(request.upvotes)} upvotes</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {user.adminEvents?.length > 0 && (
                <div className="drawer-section">
                  <h3>Changes made to this installation</h3>
                  <dl className="kv">
                    {user.adminEvents.map(event => (
                      <span key={event.id} style={{ display: 'contents' }}>
                        <dt title={stamp(event.created_at)}>{ago(event.created_at)}</dt>
                        <dd>
                          <strong>{event.actor || 'unknown'}</strong> — {event.action.replace(/_/g, ' ')}
                        </dd>
                      </span>
                    ))}
                  </dl>
                </div>
              )}
            </>
          ) : null}
        </div>
      </aside>

      {editing && user && (
        <LimitEditor
          user={user}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            /* Refetch rather than patching what is on screen: the number that comes back
               is often not the number that was typed — a Pro floor, a fresh period — and
               guessing at it here would show something the backend disagrees with. */
            get(`user/${encodeURIComponent(deviceId)}`)
              .then(result => {
                setUser(result.user);
                onChanged?.(result.user);
              })
              .catch(() => {});
          }}
        />
      )}
    </>
  );
}
