'use client';

import { useCallback, useEffect, useState } from 'react';
import { get, post } from '@/lib/client';
import { ago, credits, n, stamp } from '@/lib/format';
import { DeviceId, Empty, ErrorNote, Meter, Who } from './bits';

/* Who is in developer mode, and on whose account.
 *
 * Dev mode is a credit grant, so this tab is really an answer to "who is currently being
 * given credits, and did anybody authorise it". It used to be impossible to answer:
 * unlocking dev mode needed only the developer password, so a grant had no name attached
 * to it at all. It now requires a signed-in Tubelight account as well — the password
 * decides whether, the account records who — which is what fills the "Account" column
 * below. A row with no account is a grant made before that changed.
 */

export default function DevTab({ onSelect }) {
  const [devices, setDevices] = useState<any>(null);
  const [devCredits, setDevCredits] = useState<any>(null);
  const [devSlots, setDevSlots] = useState({ count: 0, max: 10, remaining: 10 });
  const [tabQMode, setTabQMode] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [result, settings] = await Promise.all([
        get('dev-devices'),
        get('settings').catch(() => null)
      ]);
      const list = result.devices || [];
      setDevices(list);
      setDevCredits(result.devCredits);
      setDevSlots({
        count: result.count ?? list.length,
        max: result.maxSlots ?? 10,
        remaining: result.slotsRemaining ?? Math.max(0, (result.maxSlots ?? 10) - (result.count ?? list.length))
      });
      if (settings?.tabQAccess) setTabQMode(settings.tabQAccess);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function revoke(deviceId, userId) {
    setBusy(true);
    try {
      await post('dev-revoke', { deviceId, userId });
      setConfirming(null);
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="notice info">
        <span>
          <strong>
            Developer mode is worth {devCredits === null ? '…' : `${credits(devCredits)} credits`} a
            period.
          </strong>{' '}
          Unlocking it needs two things: a signed-in Tubelight account <em>and</em> the developer
          username and password. The account is not a second authorisation — it is what puts a name
          on the grant, so it can be found again here. Change the figure with{' '}
          <code>DEV_CREDITS</code> in <code>t2u_backend/.env</code>.
        </span>
      </div>

      <div className={`notice ${tabQMode === 'all' ? 'ok' : 'info'}`} style={{ marginTop: 8 }}>
        <span>
          <strong>Tab+Q Shortcut Access:</strong>{' '}
          {tabQMode === 'all' ? (
            <>Currently set to <strong>Anyone / All People</strong>. Installations do not need developer mode credentials to use Tab+Q Quick Answers.</>
          ) : (
            <>Currently set to <strong>Dev Mode Only</strong>. Installations must unlock developer mode to use Tab+Q.</>
          )}{' '}
          You can toggle this policy anytime in the <strong>Users</strong> tab.
        </span>
      </div>

      {/* Developer Mode Limit & Slots Banner */}
      <div
        className="card"
        style={{
          marginTop: 12,
          marginBottom: 16,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          borderLeft: devSlots.remaining > 0 ? '4px solid #10b981' : '4px solid #ef4444'
        }}
      >
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>Developer Mode Slots:</span>
            <span
              className={`pill small ${devSlots.remaining > 0 ? 'tier-pro' : 'tier-dev'}`}
              style={{ fontWeight: 700, letterSpacing: '0.03em' }}
            >
              {devSlots.count} of {devSlots.max} Active ({devSlots.remaining} Available)
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
            {devSlots.remaining > 0
              ? `Server limit is capped at ${devSlots.max} developer accounts. There are ${devSlots.remaining} slot(s) free for team developers.`
              : `Limit of ${devSlots.max} developer accounts reached! Any new dev unlock attempts on the server will be refused until an existing developer is revoked below.`}
          </p>
        </div>
        <div>
          <span className="pill small" style={{ fontSize: 12, padding: '4px 8px' }}>
            Allowance: <strong>{credits(devCredits ?? 150)} credits</strong>
          </span>
        </div>
      </div>

      <ErrorNote error={error} onRetry={load} />

      <div className="toolbar">
        <span className="cell-faint">
          {devices ? `${devSlots.count} of ${devSlots.max} developer slots in use · limit ${devSlots.max}` : ''}
        </span>
        <div className="topbar-spacer" />
        <button className="btn small" onClick={load} disabled={loading}>
          {loading ? <span className="spinner" /> : null}
          <span>Refresh</span>
        </button>
      </div>

      {loading && !devices ? (
        <div className="card">
          <div className="card-body">
            <div className="skeleton" style={{ height: 40 }} />
          </div>
        </div>
      ) : !devices?.length ? (
        <div className="card">
          <Empty title="Nobody is in developer mode.">
            Dev mode is unlocked from inside the app — sign in, then enter the developer credentials
            in the Dev Access panel. Anyone who does will appear here.
          </Empty>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Device</th>
                  <th>Credits left this period</th>
                  <th>Videos Made</th>
                  <th>Unlocked</th>
                  <th>Last seen</th>
                  <th style={{ textAlign: 'right' }} />
                </tr>
              </thead>
              <tbody>
                {devices.map(device => (
                  <tr key={device.deviceId}>
                    <td>
                      {device.account ? (
                        <Who
                          user={{
                            name: device.account.name || device.account.username,
                            email: device.account.email || device.email
                          }}
                        />
                      ) : (
                        <span className="cell-faint" title="Unlocked before dev mode required an account">
                          no account on file
                        </span>
                      )}
                    </td>
                    <td>
                      <DeviceId id={device.deviceId} />
                      <div className="cell-faint">
                        {device.platform || 'unknown'}
                        {device.appVersion ? ` · v${device.appVersion}` : ''}
                      </div>
                    </td>
                    <td>
                      <Meter
                        used={device.quota?.used ?? device.used}
                        limit={device.quota?.limit}
                        unlimited={device.quota?.unlimited}
                      />
                    </td>
                    <td className="cell-strong">{n(device.runCount)}</td>
                    <td className="cell-dim" title={stamp(device.boostedAt)}>
                      {ago(device.boostedAt)}
                    </td>
                    <td className="cell-dim" title={stamp(device.lastSeenAt)}>
                      {ago(device.lastSeenAt)}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn small ghost"
                        onClick={() => onSelect({ deviceId: device.deviceId, email: device.email })}
                      >
                        Open
                      </button>{' '}
                      {confirming === device.deviceId ? (
                        <>
                          <button
                            className="btn small danger"
                            onClick={() => revoke(device.deviceId, device.account?.id)}
                            disabled={busy}
                          >
                            {busy ? <span className="spinner" /> : null}
                            <span>Confirm</span>
                          </button>{' '}
                          <button className="btn small ghost" onClick={() => setConfirming(null)}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button className="btn small danger" onClick={() => setConfirming(device.deviceId)}>
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pager">
            <span>
              Revoking puts an installation back on the free plan — the same thing the app's own
              "Exit Dev Mode" button does. Their spend so far is kept.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
