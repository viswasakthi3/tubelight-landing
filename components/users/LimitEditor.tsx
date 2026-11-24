'use client';

import { useEffect, useState } from 'react';
import { post } from '@/lib/client';
import { credits } from '@/lib/format';
import { Who } from './bits';

/* Full control over an installation's credits, ceiling, plan, and spend.
 *
 * Allows operators to:
 * 1. Quick-boost credits (+10, +25, +50, +100, custom +N)
 * 2. Set an exact target balance ("give them 50 credits remaining")
 * 3. Set a custom recurring ceiling or toggle unlimited access
 * 4. Switch plans (Free, Pro, Dev)
 * 5. Granularly refund spent credits (Fast -1, Balanced -2, Rich -3, custom, or reset all)
 */

const TIERS = [
  { id: 'free', label: 'Free', note: 'Standard monthly allowance.' },
  { id: 'pro', label: 'Pro', note: 'Pro allowance floor. Setting a ceiling above it gives extra credits.' },
  { id: 'dev', label: 'Dev', note: 'Developer mode allowance. Normally set from inside the app.' }
];

export default function LimitEditor({ user, onClose, onSaved }) {
  const quota = user.quota;

  const currentUsed = Number(quota?.used) || 0;
  const currentLimit = quota?.unlimited ? null : (quota?.limit != null ? Number(quota.limit) : null);
  const currentRemaining = quota?.unlimited
    ? null
    : (quota?.remaining != null
        ? Number(quota.remaining)
        : Math.max(0, (currentLimit || 0) - currentUsed));

  const [tier, setTier] = useState(user.deviceTier || user.tier || 'free');
  const [limit, setLimit] = useState(user.customLimit == null ? '' : String(user.customLimit));
  const [unlimited, setUnlimited] = useState(Boolean(user.isUnlimited));
  const [tabqAccess, setTabqAccess] = useState(user.tabqAccess || '');
  const [dailyFastAccess, setDailyFastAccess] = useState(user.dailyFastAccess || '');
  const sarvam = quota?.sarvamStt;
  const initialSarvamLimit = sarvam?.customLimit !== null && sarvam?.customLimit !== undefined
    ? String(sarvam.customLimit)
    : (user.sarvamLimit !== null && user.sarvamLimit !== undefined ? String(user.sarvamLimit) : '');
  const [sarvamLimit, setSarvamLimit] = useState(initialSarvamLimit);
  const [customAdd, setCustomAdd] = useState('');
  const [targetRemaining, setTargetRemaining] = useState('');
  const [refundCustom, setRefundCustom] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [actionNotice, setActionNotice] = useState('');

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape' && !busy) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const tierChanged = tier !== (user.deviceTier || user.tier || 'free');
  const becomingPro = tierChanged && tier === 'pro';

  const parsedLimit = limit.trim() === '' ? null : Number(limit);

  // Quick Add: increases ceiling by amount
  function handleQuickAdd(amount) {
    const numAmt = Number(amount);
    if (!Number.isFinite(numAmt) || numAmt <= 0) return;
    const base = parsedLimit !== null ? parsedLimit : (currentLimit || (tier === 'pro' ? 50 : 5));
    const next = Math.round((base + numAmt) * 100) / 100;
    setLimit(String(next));
    setUnlimited(false);
    setActionNotice(`+${numAmt} credits added to ceiling (now ${next}). Click Save below to apply.`);
  }

  // Set Target: sets ceiling so remaining becomes desired amount
  function handleSetTarget() {
    const target = Number(targetRemaining);
    if (!Number.isFinite(target) || target < 0) return;
    const needed = Math.round((currentUsed + target) * 100) / 100;
    setLimit(String(needed));
    setUnlimited(false);
    setActionNotice(`Ceiling set to ${needed} so user has ${target} credits left. Click Save below to apply.`);
  }

  // Granular Refund: deducts spent credits
  async function handleRefund(amount) {
    const amt = Math.min(currentUsed, Math.max(0, Number(amount) || 0));
    if (amt <= 0) return;

    setBusy(true);
    setError('');
    setActionNotice('');
    try {
      const res = await post('adjust-usage', { deviceId: user.deviceId, delta: -amt });
      setResult({
        message: `Refunded ${credits(amt)} credits. Spent is now ${credits(res.used)}, remaining is ${credits(res.quota?.remaining)} credits.`,
        quota: res.quota
      });
      setTimeout(onSaved, 1200);
    } catch (err: any) {
      setError(err.message || 'Could not refund credits.');
      setBusy(false);
    }
  }

  // Clear all spent credits
  async function resetUsage() {
    setBusy(true);
    setError('');
    setActionNotice('');
    try {
      const done = await post('reset-usage', { deviceId: user.deviceId });
      setResult({
        message: `Reset spend to zero. This installation now has ${credits(done.quota?.remaining || done.quota?.limit)} credits available.`,
        quota: done.quota
      });
      setTimeout(onSaved, 1200);
    } catch (err: any) {
      setError(err.message || 'Could not reset usage.');
      setBusy(false);
    }
  }

  // Clear all spent Sarvam speeches for today
  async function resetSarvamMeter() {
    setBusy(true);
    setError('');
    setActionNotice('');
    try {
      const done = await post('reset-sarvam-usage', { deviceId: user.deviceId });
      setResult({
        message: `Reset daily Sarvam voice usage to 0. User now has ${done.sarvamQuota?.remaining ?? (done.sarvamQuota?.limit || 10)} speeches left today.`
      });
      setTimeout(onSaved, 1200);
    } catch (err: any) {
      setError(err.message || 'Could not reset voice usage.');
      setBusy(false);
    }
  }

  // Clear daily fast video usage for today
  async function resetDailyFastMeter() {
    setBusy(true);
    setError('');
    setActionNotice('');
    try {
      const done = await post('reset-daily-fast', { deviceId: user.deviceId });
      setResult({
        message: `Reset daily fast video usage to 0 for today. User now has ${done.status?.remaining ?? 1} fast videos left today.`
      });
      setTimeout(onSaved, 1200);
    } catch (err: any) {
      setError(err.message || 'Could not reset daily fast video usage.');
      setBusy(false);
    }
  }

  // Save changes
  async function save() {
    setBusy(true);
    setError('');
    setActionNotice('');

    try {
      const payload = {
        deviceId: user.deviceId,
        tier,
        isUnlimited: unlimited,
        customLimit: limit.trim() === '' ? null : Number(limit),
        tabqAccess: tabqAccess || null,
        sarvamSttLimit: sarvamLimit.trim() === '' ? null : Number(sarvamLimit),
        dailyFastAccess: dailyFastAccess || null
      };

      const saved = await post('device-limit', payload);
      setResult({
        message: `Saved. Installation is now ${saved.quota?.tier || tier} with ${saved.quota?.unlimited ? 'no ceiling' : `${credits(saved.quota?.limit)} credits`}, ${credits(saved.quota?.remaining)} left.`,
        quota: saved.quota
      });
      setTimeout(onSaved, 1200);
    } catch (err: any) {
      setError(err.message || 'Could not save limit.');
      setBusy(false);
    }
  }

  return (
    <>
      <div className="drawer-scrim" onClick={() => !busy && onClose()} />
      <div className="drawer" style={{ width: 'min(520px, 100vw)' }} role="dialog" aria-modal="true">
        <div className="drawer-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>Credit &amp; Limit Control</h2>
            <Who user={user} />
          </div>
          <button className="btn small ghost" onClick={onClose} disabled={busy}>
            ✕
          </button>
        </div>

        <div className="drawer-body">
          {result ? (
            <div className="notice ok">
              <span>
                <strong>Done!</strong> {result.message}
              </span>
            </div>
          ) : (
            <>
              {error && <div className="notice bad">{error}</div>}
              {actionNotice && <div className="notice warn">{actionNotice}</div>}

              {/* Current Status */}
              <div className="drawer-section">
                <h3>Right now</h3>
                <dl className="kv">
                  <dt>Plan</dt>
                  <dd>
                    <strong>{user.deviceTier || 'free'}</strong>
                  </dd>
                  <dt>Balance</dt>
                  <dd>
                    {quota?.unlimited ? (
                      <span className="cell-strong">No ceiling</span>
                    ) : (
                      <>
                        <b style={{ color: 'var(--accent)' }}>{credits(currentRemaining)} left</b>
                        <span className="cell-faint"> of {credits(quota?.limit)} credits</span>
                      </>
                    )}
                  </dd>
                  <dt>Spent this period</dt>
                  <dd>{credits(currentUsed)} credits</dd>
                  <dt>Hand-set ceiling</dt>
                  <dd>
                    {user.customLimit === null ? (
                      <span className="cell-faint">none — following plan</span>
                    ) : (
                      `${credits(user.customLimit)} credits`
                    )}
                  </dd>
                </dl>
              </div>

              {/* Quick Increase / Add Credits */}
              <div className="drawer-section" style={{ background: 'var(--surface)', padding: 12, borderRadius: 'var(--radius)' }}>
                <h3 style={{ marginTop: 0 }}>⚡ Increase Credits Instantly</h3>
                <p className="cell-faint" style={{ marginTop: 0, marginBottom: 8 }}>
                  Click a preset to expand their credit ceiling immediately:
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {[10, 25, 50, 100].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      className="btn small"
                      onClick={() => handleQuickAdd(amt)}
                      disabled={busy || unlimited}
                    >
                      +{amt} credits
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    className="input"
                    style={{ width: 110 }}
                    type="number"
                    min="1"
                    placeholder="Custom +"
                    value={customAdd}
                    onChange={e => setCustomAdd(e.target.value.replace(/[^\d.]/g, ''))}
                    disabled={busy || unlimited}
                  />
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => {
                      if (customAdd) {
                        handleQuickAdd(Number(customAdd));
                        setCustomAdd('');
                      }
                    }}
                    disabled={busy || unlimited || !customAdd}
                  >
                    Add Credits
                  </button>
                </div>

                <div style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                  <span className="cell-faint" style={{ fontSize: 12 }}>Or set exact balance to have remaining:</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                    <input
                      className="input"
                      style={{ width: 140 }}
                      type="number"
                      min="0"
                      placeholder="e.g. 50 remaining"
                      value={targetRemaining}
                      onChange={e => setTargetRemaining(e.target.value.replace(/[^\d.]/g, ''))}
                      disabled={busy || unlimited}
                    />
                    <button
                      type="button"
                      className="btn small"
                      onClick={handleSetTarget}
                      disabled={busy || unlimited || targetRemaining === ''}
                    >
                      Set Balance
                    </button>
                  </div>
                </div>
              </div>

              {/* Ceiling & Plan */}
              <div className="drawer-section">
                <h3>Ceiling (Recurring credits a month)</h3>
                <div className="field" style={{ marginBottom: 8 }}>
                  <input
                    id="lim"
                    className="input"
                    style={{ width: '100%' }}
                    inputMode="decimal"
                    placeholder="Leave blank to follow the plan"
                    value={limit}
                    onChange={e => {
                      setLimit(e.target.value.replace(/[^\d.]/g, ''));
                      setActionNotice('');
                    }}
                    disabled={busy || unlimited}
                  />
                </div>

                <p className="cell-faint" style={{ margin: '0 0 8px', fontSize: 12 }}>
                  Blank means &quot;follow the plan&quot;. On Pro and Dev, this is a floor.
                </p>

                <label
                  style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={unlimited}
                    onChange={e => {
                      setUnlimited(e.target.checked);
                      setActionNotice('');
                    }}
                    disabled={busy}
                  />
                  <span>
                    No ceiling at all
                    <span className="cell-faint"> — unmetered access, usage still counted.</span>
                  </span>
                </label>
              </div>

              {/* Plan Switcher */}
              <div className="drawer-section">
                <h3>Plan</h3>
                <div className="seg" style={{ width: '100%' }}>
                  {TIERS.map(t => (
                    <button
                      key={t.id}
                      style={{ flex: 1 }}
                      aria-pressed={tier === t.id}
                      onClick={() => {
                        setTier(t.id);
                        setActionNotice('');
                      }}
                      disabled={busy}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <p className="cell-faint" style={{ marginTop: 7, marginBottom: 0, fontSize: 12 }}>
                  {TIERS.find(t => t.id === tier)?.note}
                </p>

                {becomingPro && (
                  <div className="notice warn" style={{ marginTop: 10, marginBottom: 0 }}>
                    <span>
                      Switching to Pro starts a <strong>fresh billing month</strong> — credits spent
                      so far stop counting and the period resets from today.
                    </span>
                  </div>
                )}
              </div>

              {/* Tab+Q Shortcut Access */}
              <div className="drawer-section">
                <h3>Tab+Q Quick Answers Access</h3>
                <p className="cell-faint" style={{ margin: '0 0 8px', fontSize: 12 }}>
                  Override whether this installation can use the Tab+Q shortcut and corner quick-answer panel.
                </p>
                <select
                  className="select"
                  value={tabqAccess}
                  onChange={e => setTabqAccess(e.target.value)}
                  style={{ width: '100%' }}
                  disabled={busy}
                >
                  <option value="">Default (Follow Global Policy)</option>
                  <option value="allow">Grant Explicitly (Always Allowed)</option>
                  <option value="deny">Restrict Explicitly (Denied)</option>
                </select>
              </div>

              {/* Daily Free Fast Video Allowance (Post-15 Credits) */}
              <div className="drawer-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h3 style={{ margin: 0 }}>Daily free Fast video fallback</h3>
                  {user.dailyFast && (
                    <span className={`pill small ${user.dailyFast.eligible ? 'tier-pro' : 'tier-free'}`}>
                      {{
                        cohort_enrolled: `Cohort #${user.dailyFast.rank || '—'}`,
                        prelaunch: 'Pre-launch account (not counted)',
                        staff: 'Staff account (not counted)',
                        override_allowed: 'Allowed by override',
                        override_denied: 'Denied by override',
                        no_account: 'No account',
                        cohort_full: `Outside cohort (#${user.dailyFast.rank || '—'})`,
                        disabled: 'Switched off'
                      }[user.dailyFast.reason] || (user.dailyFast.eligible ? 'Eligible' : 'Not eligible')}
                    </span>
                  )}
                </div>
                <p className="cell-faint" style={{ margin: '0 0 8px', fontSize: 12 }}>
                  After regular credits are exhausted, eligible users can make up to {user.dailyFast?.limit ?? 'the configured number of'} free Fast video(s) per day. This is a separate daily meter.
                </p>

                {user.dailyFast && (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 13 }}>
                      Today: <strong>{user.dailyFast.used} / {user.dailyFast.limit} used</strong>
                      <span className="cell-faint"> ({user.dailyFast.remaining} left today)</span>
                    </div>
                    {user.dailyFast.used > 0 && (
                      <button
                        type="button"
                        className="btn small ghost"
                        onClick={resetDailyFastMeter}
                        disabled={busy}
                        style={{ fontSize: 11, padding: '2px 8px' }}
                      >
                        Reset Today's Usage
                      </button>
                    )}
                  </div>
                )}

                <select
                  className="select"
                  value={dailyFastAccess}
                  onChange={e => setDailyFastAccess(e.target.value)}
                  style={{ width: '100%' }}
                  disabled={busy}
                >
                  <option value="">Default (First 100 accounts since launch)</option>
                  <option value="allow">Always Allow (Grant perk even outside cohort)</option>
                  <option value="deny">Explicitly Deny (Revoke daily fast perk)</option>
                </select>
              </div>

              {/* Sarvam AI Speech-to-Text Voice Limit */}
              <div className="drawer-section">
                <h3>Sarvam AI Voice Limit (STT)</h3>
                <p className="cell-faint" style={{ margin: '0 0 8px', fontSize: 12 }}>
                  10 voice notes a day (20 on Pro), each up to 3 minutes. Past the day's limit, speech-to-text automatically falls back to Deepgram Nova-3.
                </p>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 13 }}>
                    Today: <strong style={{ color: (sarvam?.remaining ?? 10) > 0 ? 'var(--accent)' : '#f59e0b' }}>
                      {sarvam?.used ?? 0} / {sarvam?.limit ?? 10} used
                    </strong>
                    <span className="cell-faint"> ({sarvam?.remaining ?? 10} remaining)</span>
                  </div>
                  {sarvam?.totalLifetime != null && (
                    <div className="cell-faint" style={{ fontSize: 12 }}>
                      • {sarvam.totalLifetime} lifetime speeches
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                  <input
                    className="input"
                    style={{ width: 140 }}
                    type="number"
                    min="0"
                    placeholder="Default (5/day)"
                    value={sarvamLimit}
                    onChange={e => {
                      setSarvamLimit(e.target.value.replace(/[^\d]/g, ''));
                      setActionNotice('');
                    }}
                    disabled={busy}
                  />
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => {
                      setSarvamLimit('10');
                      setActionNotice('Sarvam daily limit set to 10/day. Click Save below to apply.');
                    }}
                    disabled={busy}
                    title="Set limit to 10 per day"
                  >
                    10 / day
                  </button>
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => {
                      setSarvamLimit('20');
                      setActionNotice('Sarvam daily limit set to 20/day. Click Save below to apply.');
                    }}
                    disabled={busy}
                    title="Set limit to 20 per day"
                  >
                    20 / day
                  </button>
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => {
                      setSarvamLimit('');
                      setActionNotice('Sarvam daily limit cleared (will follow the plan: 10/day free, 20/day Pro). Click Save below to apply.');
                    }}
                    disabled={busy}
                    title="Reset to the plan default (10/day free, 20/day Pro)"
                  >
                    Clear (Default)
                  </button>
                </div>

                {Boolean(sarvam?.used > 0) && (
                  <button
                    type="button"
                    className="btn small"
                    style={{ marginTop: 4 }}
                    onClick={resetSarvamMeter}
                    disabled={busy}
                    title="Reset today's voice speech count back to 0"
                  >
                    Reset Today's Voice Meter ({sarvam.used} → 0)
                  </button>
                )}
              </div>

              {/* Spend Refund & Clear */}
              <div className="drawer-section" style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                <h3>Spend &amp; Refunds</h3>
                <p className="cell-faint" style={{ marginTop: 0, marginBottom: 8 }}>
                  {currentUsed > 0 ? (
                    <>
                      User has spent <strong>{credits(currentUsed)} credits</strong> this period.
                      Refund spent credits below:
                    </>
                  ) : (
                    'No credits spent this period.'
                  )}
                </p>

                {currentUsed > 0 && (
                  <>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => handleRefund(1)}
                        disabled={busy}
                        title="Refund 1 credit (Fast sheet)"
                      >
                        Refund 1 (Fast)
                      </button>
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => handleRefund(2)}
                        disabled={busy}
                        title="Refund 2 credits (Balanced frames)"
                      >
                        Refund 2 (Balanced)
                      </button>
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => handleRefund(3)}
                        disabled={busy}
                        title="Refund 3 credits (Rich narrated deck)"
                      >
                        Refund 3 (Rich)
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
                      <input
                        className="input"
                        style={{ width: 110 }}
                        type="number"
                        min="0.5"
                        step="0.5"
                        max={currentUsed}
                        placeholder="Amount"
                        value={refundCustom}
                        onChange={e => setRefundCustom(e.target.value.replace(/[^\d.]/g, ''))}
                        disabled={busy}
                      />
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => {
                          if (refundCustom) {
                            handleRefund(Number(refundCustom));
                            setRefundCustom('');
                          }
                        }}
                        disabled={busy || !refundCustom}
                      >
                        Refund Credits
                      </button>
                    </div>

                    <button className="btn small" onClick={resetUsage} disabled={busy}>
                      Reset all {credits(currentUsed)} spent credits to zero
                    </button>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn primary" onClick={save} disabled={busy} style={{ flex: 1 }}>
                  {busy ? <span className="spinner" /> : null}
                  <span>Save Changes</span>
                </button>
                <button className="btn" onClick={onClose} disabled={busy}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
