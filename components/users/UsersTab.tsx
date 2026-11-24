'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { get, post } from '@/lib/client';
import { ago, credits, n, tierOf } from '@/lib/format';
import { DeviceId, Empty, ErrorNote, Meter, OnboardingBadges, TableSkeleton, TierPill, Who } from './bits';
import LimitEditor from './LimitEditor';

/* Everybody, with what they have spent — and the place a limit gets changed.
 *
 * The list is device-centric because credits are counted against a device and most
 * installations have never signed in; an account-centric list would be six rows
 * describing a fraction of the usage. Where an account exists it is joined on, so a row
 * reads as "this machine, and the person at it if we know".
 */

const TIERS = [
  { id: '', label: 'All tiers' },
  { id: 'free', label: 'Free' },
  { id: 'pro', label: 'Pro' },
  { id: 'dev', label: 'Dev' },
  { id: 'unlimited', label: 'No ceiling' }
];

const SORTS = [
  { id: 'last_seen', label: 'Last seen' },
  { id: 'used', label: 'Credits used' },
  { id: 'runs', label: 'Explanations' },
  { id: 'created', label: 'Newest install' },
  { id: 'email', label: 'Email A–Z' }
];

export default function UsersTab({ selected, onSelect }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [tier, setTier] = useState('');
  const [sort, setSort] = useState('last_seen');
  const [realOnly, setRealOnly] = useState(true);
  const [registration, setRegistration] = useState('all');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<any>(null);

  const [tabQMode, setTabQMode] = useState('all');
  const [tabQBusy, setTabQBusy] = useState(false);
  const [tabQNotice, setTabQNotice] = useState('');
  const [settingsReady, setSettingsReady] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [creditPolicy, setCreditPolicy] = useState<any>(null);

  const [dailyFast, setDailyFast] = useState({ enabled: true, maxUsers: 100, dailyLimit: 1, countFrom: '2026-09-20', enrolledTotal: 0 });
  const [dailyFastBusy, setDailyFastBusy] = useState(false);
  const [dailyFastNotice, setDailyFastNotice] = useState('');

  const loadSettings = useCallback(async () => {
    setSettingsError('');
    try {
      const res = await get('settings');
      if (res?.tabQAccess) setTabQMode(res.tabQAccess);
      if (res?.dailyFast) setDailyFast(res.dailyFast);
      setCreditPolicy(res?.creditPolicy || null);
      setSettingsReady(true);
    } catch (err: any) {
      setSettingsError(err.message || 'Could not read live access and daily video settings.');
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleUpdateTabQMode(nextMode) {
    setTabQBusy(true);
    setTabQNotice('');
    try {
      const res = await post('settings', { tabQAccess: nextMode });
      setTabQMode(res.tabQAccess || nextMode);
      setTabQNotice(
        nextMode === 'all'
          ? 'Tab+Q access is now enabled for anyone / all people across all installations!'
          : 'Tab+Q access is now restricted to developer mode accounts.'
      );
      setTimeout(() => setTabQNotice(''), 4500);
    } catch (err: any) {
      setError(err.message || 'Could not update Tab+Q access setting.');
    } finally {
      setTabQBusy(false);
    }
  }

  async function handleUpdateDailyFast(patch) {
    setDailyFastBusy(true);
    setDailyFastNotice('');
    try {
      const next = { ...dailyFast, ...patch };
      const res = await post('settings', { dailyFast: next });
      if (res?.dailyFast) setDailyFast(res.dailyFast);
      setDailyFastNotice('Daily Fast Video settings saved!');
      setTimeout(() => setDailyFastNotice(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Could not update Daily Fast Video settings.');
    } finally {
      setDailyFastBusy(false);
    }
  }

  /* Typing does not fetch. 300ms is long enough that a normal typing speed produces one
     request for a whole word and short enough that the list does not feel stuck — and
     every in-flight request is aborted below anyway, so a fast typist cannot end up
     looking at the results for a query they have already replaced. */
  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  const controllerRef = useRef(null);

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError('');

    const params = new URLSearchParams({
      page: String(page),
      pageSize: '25',
      sort,
      realOnly: realOnly ? '1' : '0',
      registration
    });
    if (debounced) params.set('q', debounced);
    if (tier) params.set('tier', tier);

    try {
      const result = await get(`user-list?${params}`, { signal: controller.signal });
      if (!controller.signal.aborted) setData(result);
    } catch (err: any) {
      /* An abort is this component cancelling itself, not a failure — reporting it would
         flash an error every time somebody types a letter. */
      if (!controller.signal.aborted) { setData(null); setError(err.message); }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [debounced, tier, sort, realOnly, registration, page]);

  useEffect(() => {
    load();
    return () => controllerRef.current?.abort();
  }, [load]);

  const users = data?.users || [];

  return (
    <div>
      <ErrorNote error={error} onRetry={load} />
      <ErrorNote error={settingsError} onRetry={loadSettings} />

      <div className="page-intro">
        <div><h1>Users & installations</h1><p>Registered accounts, anonymous installations, usage and credit controls in one place.</p></div>
        <span className="pill plain">Live backend data</span>
      </div>
      <p className="metric-note">One person may use several installations. Accounts without a linked installation are included; credit controls apply to installations.</p>

      {creditPolicy && <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 15 }}>Free credit policy</h2>
        <p className="metric-note">{credits(creditPolicy.welcomeCredits)} credits in the first allowance period; {credits(creditPolicy.freeMonthlyCredits)} credits in subsequent {creditPolicy.period === 'day' ? 'daily' : 'monthly'} periods. The welcome amount replaces the regular allowance. {creditPolicy.period === 'day' ? 'Daily periods reset at local midnight.' : 'Monthly periods reset on the installation anniversary.'} Quota timezone: {creditPolicy.timezone || 'unavailable'}.</p>
        <p className="metric-note">Fast / Balanced / Rich cost {credits(creditPolicy.costs?.fast)} / {credits(creditPolicy.costs?.balanced)} / {credits(creditPolicy.costs?.rich)} credits before model surcharges or extended capacity.</p>
        <p className="metric-note">Daily Fast is a separate fallback after regular credits are exhausted. Registered users share the daily meter across devices. It does not accumulate into the regular balance.</p>
      </div>}

      <fieldset className="settings-controls" disabled={!settingsReady}>
      {!settingsReady && <p className="cell-dim">Access controls are unavailable until live settings load.</p>}
      {/* Tab+Q Shortcut Access Control Card */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', borderLeft: tabQMode === 'all' ? '4px solid #10b981' : '4px solid #f59e0b' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 13, letterSpacing: '0.01em' }}>Tab+Q Quick Answers Access:</span>
            <span className={`pill small ${tabQMode === 'all' ? 'tier-pro' : 'tier-dev'}`} style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {!settingsReady ? 'Unavailable' : tabQMode === 'all' ? 'Unlocked for Anyone / All People' : 'Dev Mode Only'}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
            {tabQMode === 'all'
              ? 'Anyone and all people using Tubelight can press Tab+Q to fact-check and get quick answers. No developer credentials needed.'
              : 'Tab+Q is restricted. Only developer mode accounts or explicitly granted installations can use the shortcut.'}
          </p>
          {tabQNotice && (
            <p style={{ margin: '6px 0 0 0', fontSize: 12, color: '#10b981', fontWeight: 500 }}>
              ✓ {tabQNotice}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className={`btn small ${tabQMode === 'all' ? 'primary' : 'ghost'}`}
            disabled={tabQBusy || tabQMode === 'all'}
            onClick={() => handleUpdateTabQMode('all')}
            title="Make Tab+Q access available to anyone or all people"
          >
            {tabQBusy && tabQMode !== 'all' ? <span className="spinner" /> : null}
            <span>Make Tab+Q Access for All</span>
          </button>
          <button
            type="button"
            className={`btn small ${tabQMode === 'dev_only' ? 'primary' : 'ghost'}`}
            disabled={tabQBusy || tabQMode === 'dev_only'}
            onClick={() => handleUpdateTabQMode('dev_only')}
            title="Restrict Tab+Q to Developer Mode only"
          >
            {tabQBusy && tabQMode !== 'dev_only' ? <span className="spinner" /> : null}
            <span>Restrict to Dev Only</span>
          </button>
        </div>
      </div>

      {/* Daily Free Fast Video Cohort Card */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', borderLeft: dailyFast.enabled ? '4px solid #6c4cf1' : '4px solid #94a3b8' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 13, letterSpacing: '0.01em' }}>Daily free Fast video fallback:</span>
            <span className={`pill small ${dailyFast.enabled ? 'tier-pro' : 'tier-free'}`} style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {!settingsReady ? 'Unavailable' : dailyFast.enabled ? 'Active' : 'Disabled'}
            </span>
            <span className="pill small" style={{ background: 'var(--raised)', color: 'var(--text-dim)', fontWeight: 600 }}>
              Cohort: {dailyFast.enrolledTotal || 0} / {dailyFast.maxUsers} accounts since {dailyFast.countFrom || '2026-09-20'}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
            Once regular credits run out, eligible users can make <strong>{dailyFast.dailyLimit} free Fast video(s) per day</strong> until the next refill. Balanced and Rich are excluded from this fallback. Eligibility covers the first {dailyFast.maxUsers} learner accounts created on or after {dailyFast.countFrom || '2026-09-20'}; prelaunch and staff accounts do not take a cohort place. Check each installation's detail for eligibility and overrides.
          </p>
          {dailyFastNotice && (
            <p style={{ margin: '6px 0 0 0', fontSize: 12, color: '#10b981', fontWeight: 500 }}>
              ✓ {dailyFastNotice}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
            <span>Cohort Cap:</span>
            <input
              type="number"
              className="input small"
              style={{ width: 75, padding: '4px 8px', fontSize: 12 }}
              value={dailyFast.maxUsers}
              min="0"
              max="10000"
              onChange={e => setDailyFast(prev => ({ ...prev, maxUsers: Number(e.target.value) || 0 }))}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
            <span>Count From:</span>
            <input
              type="date"
              className="input small"
              style={{ width: 140, padding: '4px 8px', fontSize: 12 }}
              value={dailyFast.countFrom || '2026-09-20'}
              onChange={e => setDailyFast(prev => ({ ...prev, countFrom: e.target.value }))}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
            <span>Fast videos/day:</span>
            <input
              type="number"
              className="input small"
              style={{ width: 60, padding: '4px 8px', fontSize: 12 }}
              value={dailyFast.dailyLimit}
              min="1"
              max="10"
              onChange={e => setDailyFast(prev => ({ ...prev, dailyLimit: Number(e.target.value) || 1 }))}
            />
          </label>
          <button
            type="button"
            className={`btn small ${dailyFast.enabled ? 'ghost' : 'primary'}`}
            disabled={dailyFastBusy}
            onClick={() => handleUpdateDailyFast({ enabled: !dailyFast.enabled, maxUsers: dailyFast.maxUsers, dailyLimit: dailyFast.dailyLimit, countFrom: dailyFast.countFrom })}
            title={dailyFast.enabled ? 'Disable daily fast videos' : 'Enable daily fast videos'}
          >
            {dailyFast.enabled ? 'Disable' : 'Enable'}
          </button>
          <button
            type="button"
            className="btn small primary"
            disabled={dailyFastBusy}
            onClick={() => handleUpdateDailyFast({ enabled: dailyFast.enabled, maxUsers: dailyFast.maxUsers, dailyLimit: dailyFast.dailyLimit, countFrom: dailyFast.countFrom })}
            title="Save custom cohort cap & daily limit"
          >
            {dailyFastBusy ? <span className="spinner" /> : null}
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      </fieldset>

      <div className="toolbar">
        <input
          className="input search"
          placeholder="Search by email, name, username or device id…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          spellCheck={false}
          aria-label="Search users and installations"
        />

        <select className="select" aria-label="Registration status" value={registration} onChange={e => { setRegistration(e.target.value); setPage(1); }}>
          <option value="all">All accounts & installs</option>
          <option value="registered">Registered accounts</option>
          <option value="anonymous">Anonymous installs</option>
        </select>

        <select className="select" value={tier} onChange={e => { setTier(e.target.value); setPage(1); }}>
          {TIERS.map(t => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>

        <select className="select" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
          {SORTS.map(s => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        <button
          className={`filter-pill ${realOnly ? 'active' : ''}`}
          onClick={() => { setRealOnly(r => !r); setPage(1); }}
          title={realOnly ? "Showing real users only. Click to show all including AI test runs." : "Showing all installs. Click to hide AI test runs."}
        >
          <span>{realOnly ? '✓ Total Real Users' : 'All Installs (incl. test)'}</span>
          {data && (
            <span className="pill small" style={{ marginLeft: 4, padding: '1px 6px', fontSize: 11 }}>
              {realOnly ? `${n(data.realCount ?? data.total)} users` : `${n(data.total)} total`}
            </span>
          )}
        </button>

        <div className="topbar-spacer" />

        <span className="cell-faint">
          {data ? `${n(data.total)} shown` : ''}
        </span>
        <button className="btn small" onClick={load} disabled={loading}>
          {loading ? <span className="spinner" /> : null}
          <span>Refresh</span>
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Who</th>
                <th>Device</th>
                <th>Tier</th>
                <th>Credits left this period</th>
                <th>Videos Made</th>
                <th title="Alt + E tutorial, then the Tab + Q and Tab + R tips — hover a badge for what it means">Onboarding</th>
                <th>Last seen</th>
                <th style={{ textAlign: 'right' }}>Limit</th>
              </tr>
            </thead>

            {loading && !data ? (
              <TableSkeleton rows={8} cols={8} />
            ) : (
              <tbody>
                {users.map(user => {
                  const quota = user.quota;
                  return (
                    <tr
                      key={user.rowId || user.deviceId || `account:${user.account?.id}`}
                      className={user.deviceId && selected?.deviceId === user.deviceId ? 'is-selected' : ''}
                      onClick={() => user.deviceId && onSelect(user)}
                      style={{ cursor: user.deviceId ? 'pointer' : 'default' }}
                    >
                      <td>
                        <Who user={user} />
                        <span className={`pill small ${user.registered || user.account ? 'ok' : 'plain'}`}>
                          {user.registered || user.account ? 'Registered' : 'Anonymous'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {user.deviceId ? <DeviceId id={user.deviceId} /> : <span className="cell-dim">No linked installation</span>}
                          {user.isOwn ? (
                            <span
                              className="pill small"
                              style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px', background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 600 }}
                              title="Our development / testing device"
                            >
                              our device
                            </span>
                          ) : user.isTest ? (
                            <span className="pill small warn" style={{ marginLeft: 6, fontSize: 10, padding: '1px 5px' }}>
                              test
                            </span>
                          ) : null}
                        </div>
                        <div className="cell-faint">
                          {user.platform || 'unknown'}
                          {user.appVersion ? ` · v${user.appVersion}` : ''}
                        </div>
                      </td>
                      <td>
                        <TierPill tier={tierOf(user)} />
                        {user.customLimit != null && (
                          <div className="cell-faint" title="A ceiling set by hand on this device">
                            set to {credits(user.customLimit)}
                          </div>
                        )}
                        {quota?.sarvamStt && (
                          <div className="cell-faint" style={{ fontSize: 11, marginTop: 2 }} title="Sarvam AI speech quota today">
                            Voice: {quota.sarvamStt.used}/{quota.sarvamStt.limit ?? '∞'} {quota.sarvamStt.remaining === 0 ? '(Deepgram)' : ''}
                          </div>
                        )}
                      </td>
                      <td>
                        {!user.deviceId ? <span className="cell-faint">No device quota</span> : quota ? (
                          <Meter used={quota.used} limit={quota.limit} unlimited={quota.unlimited} />
                        ) : user.limit !== null && user.limit !== undefined ? (
                          <Meter used={user.used} limit={user.limit} unlimited={user.isUnlimited} />
                        ) : (
                          <div>
                            <span className="cell-strong">{user.remaining != null ? `${credits(user.remaining)} left` : 'Quota unavailable'}</span>
                            <div className="cell-faint">({credits(user.used)} used)</div>
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="cell-strong">{n(user.videosMade ?? user.runCount)}</span>
                        {(user.runCount > 0 || user.clarityCount > 0) && (
                          <div className="cell-faint" style={{ fontSize: 11 }}>
                            Completed / partial runs{user.clarityCount > 0 ? ` · ${user.clarityCount} Clarity records` : ''}
                          </div>
                        )}
                      </td>
                      <td>
                        <OnboardingBadges onboarding={user.onboarding} />
                      </td>
                      <td className="cell-dim" title={user.lastSeenAt || ''}>
                        {ago(user.lastSeenAt)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn small"
                          disabled={!user.deviceId}
                          title={user.deviceId ? 'Change this installation’s limits' : 'Link an installation before changing credits'}
                          onClick={event => {
                            event.stopPropagation();
                            setEditing(user);
                          }}
                        >
                          Change
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {!users.length && (
                  <tr>
                    <td colSpan={8} style={{ padding: 0 }}>
                      <Empty title={error ? 'User data is unavailable.' : debounced ? 'Nobody matches that.' : 'No matching accounts or installations.'}>
                        {debounced
                          ? 'Search runs over email, name, username and device id.'
                          : realOnly ? 'Turn off the test-device filter to inspect every record.' : 'Try another registration or tier filter.'}
                      </Empty>
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </table>
        </div>

        {data && data.pages > 1 && (
          <div className="pager">
            <span>
              Page {data.page} of {data.pages} · {n(data.total)} accounts / installations
            </span>
            <span style={{ display: 'flex', gap: 6 }}>
              <button className="btn small" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                ← Previous
              </button>
              <button
                className="btn small"
                disabled={page >= data.pages}
                onClick={() => setPage(p => p + 1)}
              >
                Next →
              </button>
            </span>
          </div>
        )}
      </div>

      {editing && (
        <LimitEditor
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}
