import { NextResponse } from 'next/server';
import { CSRF_COOKIE, SESSION_COOKIE } from '@/lib/auth/constants';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  for (const name of [SESSION_COOKIE, CSRF_COOKIE]) {
    response.cookies.set(name, '', { path: '/', expires: new Date(0), maxAge: 0 });
  }
  return response;
}
