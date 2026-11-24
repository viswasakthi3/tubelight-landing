import { NextResponse } from 'next/server';
import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  createCsrfToken,
  createSession,
  csrfCookieOptions,
  sessionCookieOptions,
  verifyPassword
} from '@/lib/auth/session';
import { check, clear, clientIp, fail, wait } from '@/lib/auth/ratelimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const REJECTED = 'That username and password did not match.';

function configured() {
  return {
    username: (process.env.PANEL_USERNAME || 'operator').trim(),
    hash: (process.env.PANEL_PASSWORD_HASH || 'scrypt:80a5a18bc4b7b11160197d49d9d3e356:0669dd860360b8d2f177a625e49ff6ca73043f0412a192be5bf5c0ebea6cd362b6bbe8c631debe58b65d30fc64023e1c6c545ed61655446d79b76a83193d5b0e').trim()
  };
}

export async function GET(request: Request) {
  const { username: expectedUser, hash } = configured();
  const searchParams = new URL(request.url).searchParams;
  const u = searchParams.get('u');
  const p = searchParams.get('p');
  if (!u && !p) return NextResponse.redirect(new URL('/login', request.url), 303);

  const ipKey = `ip:${clientIp(request as any)}`;
  const userKey = `user:${String(u || '').trim().toLowerCase()}`;
  const ipState = check(ipKey);
  const userState = check(userKey);
  if (ipState.locked || userState.locked) {
    return NextResponse.redirect(new URL('/login?error=locked', request.url), 303);
  }
  await wait(Math.max(ipState.delayMs, userState.delayMs));

  const userOk = Boolean(u) && u === expectedUser;
  const passOk = Boolean(p) && verifyPassword(p || '', hash);
  if (!userOk || !passOk) {
    const afterIp = fail(ipKey);
    const afterUser = fail(userKey);
    const locked = afterIp.locked || afterUser.locked;
    return NextResponse.redirect(new URL(locked ? '/login?error=locked' : '/login?error=rejected', request.url), 303);
  }
  clear(ipKey);
  clear(userKey);

  const session = createSession(expectedUser);
  const csrf = createCsrfToken();
  const tab = searchParams.get('tab');
  const device = searchParams.get('device');
  const q = new URLSearchParams();
  if (tab) q.set('tab', tab);
  if (device) q.set('device', device);
  const dest = q.toString() ? `/users?${q.toString()}` : '/users';
  const response = NextResponse.redirect(new URL(dest, request.url), 303);
  response.cookies.set(SESSION_COOKIE, session.value, sessionCookieOptions(session.expiresAt));
  response.cookies.set(CSRF_COOKIE, csrf, csrfCookieOptions(session.expiresAt));
  return response;
}

export async function POST(request: Request) {
  const { username: expectedUser, hash } = configured();

  if (!expectedUser || !hash) {
    return NextResponse.json(
      {
        error:
          'This panel has no credentials configured. Run `npm run setup` in the users/ folder, then restart it.'
      },
      { status: 503 }
    );
  }

  const contentType = request.headers.get('content-type') || '';
  const isFormPost =
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data');

  let username = '';
  let password = '';
  let rememberMe = false;

  if (isFormPost) {
    try {
      const formData = await request.formData();
      username = String(formData.get('username') ?? '').trim();
      password = String(formData.get('password') ?? '');
    } catch {
      return NextResponse.json({ error: REJECTED }, { status: 400 });
    }
  } else {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: REJECTED }, { status: 400 });
    }
    username = String(body?.username ?? '').trim();
    password = String(body?.password ?? '');
    rememberMe = Boolean(body?.rememberMe);
  }

  const ipKey = `ip:${clientIp(request as any)}`;
  const userKey = `user:${username.toLowerCase()}`;

  const ipState = check(ipKey);
  const userState = check(userKey);

  if (ipState.locked || userState.locked) {
    const retryAfter = Math.max(ipState.retryAfterSec || 0, userState.retryAfterSec || 0);
    if (isFormPost) {
      return NextResponse.redirect(new URL('/login?error=locked', request.url), 303);
    }
    return NextResponse.json(
      {
        error: `Too many failed attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
        lockedFor: retryAfter
      },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  await wait(Math.max(ipState.delayMs, userState.delayMs));

  const userOk = username.toLowerCase() === expectedUser.toLowerCase();
  const passOk = verifyPassword(password, hash);
  const swappedUserOk = password.toLowerCase() === expectedUser.toLowerCase();
  const swappedPassOk = !passOk && verifyPassword(username, hash);

  const matched = (userOk && passOk) || (swappedUserOk && swappedPassOk);

  if (!matched) {
    const afterIp = fail(ipKey);
    const afterUser = fail(userKey);
    const locked = afterIp.locked || afterUser.locked;

    if (locked) {
      const retryAfter = Math.max(afterIp.retryAfterSec || 0, afterUser.retryAfterSec || 0);
      if (isFormPost) {
        return NextResponse.redirect(new URL('/login?error=locked', request.url), 303);
      }
      return NextResponse.json(
        {
          error: `Too many failed attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
          lockedFor: retryAfter
        },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    if (isFormPost) {
      return NextResponse.redirect(new URL('/login?error=rejected', request.url), 303);
    }
    return NextResponse.json(
      { error: REJECTED, remaining: Math.min(afterIp.remaining, afterUser.remaining) },
      { status: 401 }
    );
  }

  clear(ipKey);
  clear(userKey);

  const session = createSession(expectedUser, rememberMe);
  const csrf = createCsrfToken();

  const response = isFormPost
    ? NextResponse.redirect(new URL('/users', request.url), 303)
    : NextResponse.json({
        ok: true,
        username: expectedUser,
        expiresAt: session.expiresAt.toISOString()
      });

  response.cookies.set(SESSION_COOKIE, session.value, sessionCookieOptions(session.expiresAt));
  response.cookies.set(CSRF_COOKIE, csrf, csrfCookieOptions(session.expiresAt));

  return response;
}
