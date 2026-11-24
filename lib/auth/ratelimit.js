const attempts = new Map();

const MAX_ATTEMPTS = Number(process.env.PANEL_MAX_ATTEMPTS) || 5;
const LOCKOUT_MS = (Number(process.env.PANEL_LOCKOUT_MINUTES) || 15) * 60 * 1000;

const WINDOW_MS = 30 * 60 * 1000;

const MAX_KEYS = 10_000;

function sweep(now) {
  for (const [key, record] of attempts) {
    const expired = record.lockedUntil ? record.lockedUntil < now : record.first + WINDOW_MS < now;
    if (expired) attempts.delete(key);
  }
}

export function check(key) {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record) return { locked: false, remaining: MAX_ATTEMPTS, delayMs: 0 };

  if (record.lockedUntil && record.lockedUntil > now) {
    return {
      locked: true,
      remaining: 0,
      delayMs: 0,
      retryAfterSec: Math.ceil((record.lockedUntil - now) / 1000)
    };
  }

  if ((record.lockedUntil && record.lockedUntil <= now) || record.first + WINDOW_MS < now) {
    attempts.delete(key);
    return { locked: false, remaining: MAX_ATTEMPTS, delayMs: 0 };
  }

  return {
    locked: false,
    remaining: Math.max(0, MAX_ATTEMPTS - record.count),
    delayMs: backoffFor(record.count)
  };
}

function backoffFor(count) {
  if (count < 2) return 0;
  return Math.min(8000, 2 ** (count - 2) * 1000);
}

export function fail(key) {
  const now = Date.now();
  if (attempts.size > MAX_KEYS) sweep(now);

  const prev = attempts.get(key);
  const fresh = !prev || prev.first + WINDOW_MS < now;
  const count = (fresh ? 0 : prev.count) + 1;
  const first = fresh ? now : prev.first;

  if (count >= MAX_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_MS;
    attempts.set(key, { count, first, lockedUntil });
    return {
      locked: true,
      remaining: 0,
      delayMs: 0,
      retryAfterSec: Math.ceil(LOCKOUT_MS / 1000)
    };
  }

  attempts.set(key, { count, first, lockedUntil: null });
  return { locked: false, remaining: MAX_ATTEMPTS - count, delayMs: backoffFor(count) };
}

export function clear(key) {
  attempts.delete(key);
}

export function wait(ms) {
  return ms > 0 ? new Promise(resolve => setTimeout(resolve, ms)) : Promise.resolve();
}

export function clientIp(request) {
  if (process.env.PANEL_TRUST_PROXY !== 'true') return 'local';

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();

  return 'local';
}
