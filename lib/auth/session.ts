import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SESSION_HOURS = Number(process.env.PANEL_SESSION_HOURS) || 8;

export { SESSION_COOKIE, CSRF_COOKIE } from './constants';

const SCRYPT = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LEN = 64;

function secret(): string {
  const value = (process.env.PANEL_SESSION_SECRET || process.env.OWNER_COOKIE_SECRET || process.env.WEB_EXPLAIN_SECRET || 'LUcFuh0KpGGrzIU8Grj53cbeW9xFV1xlBn4i-FPpiwhzADEvLozjJnJNKBGMsjHR').trim();
  return value;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(String(password), salt, KEY_LEN, SCRYPT);
  return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = String(stored || '').split(':');
  const ok = parts.length === 3 && parts[0] === 'scrypt';

  const salt = ok ? Buffer.from(parts[1], 'hex') : Buffer.alloc(16);
  const expected = ok ? Buffer.from(parts[2], 'hex') : Buffer.alloc(KEY_LEN);

  let actual;
  try {
    actual = scryptSync(String(password ?? ''), salt, KEY_LEN, SCRYPT);
  } catch {
    return false;
  }

  if (actual.length !== expected.length) return false;
  const matched = timingSafeEqual(actual, expected);
  return ok && matched;
}

function b64url(buf: any): string {
  return Buffer.from(buf).toString('base64url');
}

function sign(payloadB64: string): string {
  return createHmac('sha256', secret()).update(payloadB64).digest('base64url');
}

const REMEMBER_ME_HOURS = 30 * 24;

export function createSession(username: string, rememberMe = false) {
  const hours = rememberMe ? REMEMBER_ME_HOURS : SESSION_HOURS;
  const now = Date.now();
  const payload = {
    u: String(username),
    iat: now,
    exp: now + hours * 3600 * 1000,
    n: randomBytes(9).toString('base64url')
  };
  const encoded = b64url(JSON.stringify(payload));
  return { value: `${encoded}.${sign(encoded)}`, expiresAt: new Date(payload.exp) };
}

export function readSession(cookieValue?: string | null) {
  if (!cookieValue || typeof cookieValue !== 'string') return null;

  const dot = cookieValue.lastIndexOf('.');
  if (dot <= 0) return null;

  const encoded = cookieValue.slice(0, dot);
  const provided = cookieValue.slice(dot + 1);

  let expected;
  try {
    expected = sign(encoded);
  } catch {
    return null;
  }

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (!payload?.u || !payload?.exp || Date.now() > Number(payload.exp)) return null;

  return {
    username: payload.u,
    issuedAt: new Date(payload.iat).toISOString(),
    expiresAt: new Date(payload.exp).toISOString()
  };
}

export function createCsrfToken(): string {
  return randomBytes(32).toString('base64url');
}

export function csrfMatches(cookieToken?: string | null, headerToken?: string | null): boolean {
  if (!cookieToken || !headerToken) return false;
  const a = Buffer.from(String(cookieToken));
  const b = Buffer.from(String(headerToken));
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}

export function sessionCookieOptions(expiresAt: Date): {
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  secure: boolean;
  path: string;
  expires: Date;
} {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.PANEL_SECURE_COOKIES === 'true',
    path: '/',
    expires: expiresAt
  };
}

export function csrfCookieOptions(expiresAt: Date): {
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  secure: boolean;
  path: string;
  expires: Date;
} {
  return {
    httpOnly: false,
    sameSite: 'strict',
    secure: process.env.PANEL_SECURE_COOKIES === 'true',
    path: '/',
    expires: expiresAt
  };
}
