/* How numbers, dates and states are written on screen.
 *
 * In one file because consistency is the whole point: a panel that writes "2 h ago" in
 * one column and "2 hours ago" in the next makes the reader check whether they mean the
 * same thing. Every one of these is pure, so they are safe in a server component too.
 */

/** 1234 → "1,234". Nulls become an em dash rather than "0" — they are different facts. */
export function n(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString('en-US');
}

/* Credits, which are fractional: "14.5", not "14.50" and not "15". Trailing zeros make
   an allowance look like a price, which is the same reasoning as the backend's
   `formatCredits`. */
export function credits(value) {
  if (value === null || value === undefined) return '—';
  const rounded = Math.round(Number(value) * 100) / 100;
  return Number.isFinite(rounded) ? String(rounded) : '—';
}

/** 0.9637 → "96%". Null stays null-looking, because "no runs yet" is not "0% worked". */
export function percent(value, places = 0) {
  if (value === null || value === undefined) return '—';
  return `${(Number(value) * 100).toFixed(places)}%`;
}

/** Milliseconds at the scale a human reads them: "840ms", "9.5s", "1m 50s". */
export function ms(value) {
  if (value === null || value === undefined) return '—';
  const v = Number(value);
  if (!Number.isFinite(v)) return '—';
  if (v < 1000) return `${Math.round(v)}ms`;
  if (v < 60_000) return `${(v / 1000).toFixed(1)}s`;
  const mins = Math.floor(v / 60_000);
  return `${mins}m ${Math.round((v % 60_000) / 1000)}s`;
}

/* "3m ago", "2h ago", "5d ago" — and an actual date past a fortnight, where "23d ago"
   stops being something anybody can place. */
export function ago(iso) {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '—';

  const diff = Date.now() - then;
  if (diff < 0) return 'just now';

  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days <= 14) return `${days}d ago`;

  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** The full thing, for a tooltip or a detail row. */
export function stamp(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/** "2026-08-31" → "31 Aug". */
export function shortDay(key) {
  if (!key) return '';
  const date = new Date(`${key}T00:00:00`);
  if (!Number.isFinite(date.getTime())) return key;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/* The label under a tier pill. `unlimited` is not a tier in the database — it is a
   boolean beside one — but to a reader it is the most important thing about the row, so
   it wins. */
export function tierOf(user) {
  if (user?.isUnlimited) return 'unlimited';
  return user?.tier || 'free';
}

/** A device id, shortened but still recognisable: first 8 and last 4. */
export function shortId(id) {
  const value = String(id || '');
  return value.length <= 16 ? value : `${value.slice(0, 8)}…${value.slice(-4)}`;
}

/* How full a meter is, and whether that is worth a colour. Amber past 75%, red past 90%
   — a bar that is red at 60% cries wolf and stops being read. */
export function meterState(used, limit) {
  if (!limit || limit <= 0) return { pct: 0, tone: '' };
  const pct = Math.min(100, (Number(used) / Number(limit)) * 100);
  if (pct >= 90) return { pct, tone: 'is-bad' };
  if (pct >= 75) return { pct, tone: 'is-warn' };
  return { pct, tone: '' };
}
