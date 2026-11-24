'use client';

import { CSRF_COOKIE } from '@/lib/auth/constants';

function csrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

export class PanelError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'PanelError';
    this.status = status;
  }
}

export async function get(path: string, { signal }: { signal?: AbortSignal } = {}) {
  const res = await fetch(`/api/admin/${path}`, { cache: 'no-store', signal });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new PanelError(data.error || `Request failed (${res.status}).`, res.status);
  return data;
}

export async function post(path: string, body?: any) {
  const res = await fetch(`/api/admin/${path}`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken()
    },
    body: JSON.stringify(body || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new PanelError(data.error || `Request failed (${res.status}).`, res.status);
  return data;
}

export async function signOut() {
  await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' }).catch(() => {});
  window.location.href = '/login';
}
