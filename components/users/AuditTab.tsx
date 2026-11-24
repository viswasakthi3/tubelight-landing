'use client';

import { useCallback, useEffect, useState } from 'react';
import { get } from '@/lib/client';
import { ago, credits, stamp } from '@/lib/format';
import { DeviceId, Empty, ErrorNote } from './bits';

/* What operators have changed.
 *
 * The one thing this panel writes to the database, and the reason it writes it: a limit
 * change used to leave no trace but the changed number, which cannot say who moved it,
 * when, or what it was before — and that is the question every support thread ends on.
 *
 * Read-only, and there is no delete. An audit log an operator can edit is not one.
 */

const LABELS = {
  set_limit: 'Changed a limit',
  reset_usage: 'Reset the meter',
  dev_revoke: 'Revoked dev mode',
  dev_unlock: 'Unlocked dev mode',
  dev_unlock_blocked_slots_full: 'Dev unlock blocked (slots full)',
  dev_exit: 'Exited dev mode',
  filter_model_surcharge: 'Filter model surcharge'
};

export default function AuditTab() {
  const [events, setEvents] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await get('events?limit=200');
      setEvents(result.events || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <ErrorNote error={error} onRetry={load} />

      <div className="toolbar">
        <span className="cell-faint">Every change made from this panel, newest first.</span>
        <div className="topbar-spacer" />
        <button className="btn small" onClick={load} disabled={loading}>
          {loading ? <span className="spinner" /> : null}
          <span>Refresh</span>
        </button>
      </div>

      <div className="card">
        {loading && !events ? (
          <div className="card-body">
            <div className="skeleton" style={{ height: 40 }} />
          </div>
        ) : !events?.length ? (
          <Empty title="Nothing has been changed yet.">
            Limit changes, meter resets and dev-mode revocations are recorded here as they happen.
          </Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>What</th>
                  <th>To whom</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id}>
                    <td className="cell-dim" title={stamp(event.created_at)}>
                      {ago(event.created_at)}
                    </td>
                    <td className="cell-strong">{event.actor || 'unknown'}</td>
                    <td>{LABELS[event.action] || event.action}</td>
                    <td>{event.target ? <DeviceId id={event.target} /> : '—'}</td>
                    <td className="cell-faint">
                      <Detail event={event} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* The before and after, as a sentence rather than as JSON. A raw diff is faster to write
   and slower to read, and this column is scanned rather than studied. */
function Detail({ event }) {
  const d = event.detail || {};

  if (event.action === 'set_limit' && d.before && d.after) {
    const parts = [];
    if (d.before.tier !== d.after.tier) parts.push(`${d.before.tier} → ${d.after.tier}`);
    if (d.before.customLimit !== d.after.customLimit) {
      parts.push(
        `ceiling ${d.before.customLimit === null ? 'plan' : credits(d.before.customLimit)} → ${
          d.after.customLimit === null ? 'plan' : credits(d.after.customLimit)
        }`
      );
    }
    if (d.before.isUnlimited !== d.after.isUnlimited) {
      parts.push(d.after.isUnlimited ? 'no ceiling on' : 'no ceiling off');
    }
    return parts.length ? parts.join(' · ') : 'no effective change';
  }

  if (event.action === 'reset_usage') {
    return `${credits(d.was)} credits cleared from ${d.period || 'the current period'}`;
  }

  if (event.action === 'dev_revoke') {
    return 'back to the free plan';
  }

  if (event.action === 'dev_unlock') {
    return `granted ${credits(d.limit || 150)} dev credits (${d.slots?.count ?? '?'}/${d.slots?.max ?? 10} slots in use)`;
  }

  if (event.action === 'dev_unlock_blocked_slots_full') {
    return `refused: maximum ${d.max || 10} developer accounts reached`;
  }

  if (event.action === 'dev_exit') {
    return `switched back to normal user mode (${credits(d.limit || 5)} credits)`;
  }

  if (event.action === 'filter_model_surcharge') {
    return `${d.profile || 'run'}: ${d.thinkingTier || 'lite'}/${d.imageTier || 'lite'} (+${credits(d.surcharge)} surcharge, total: ${credits(d.totalCost)}, remaining: ${credits(d.remaining)})`;
  }

  return d && Object.keys(d).length ? JSON.stringify(d) : '—';
}
