const DEFAULT_BASE = 'http://127.0.0.1:8787';
const TIMEOUT_MS = Number(process.env.PANEL_BACKEND_TIMEOUT_MS) || 20_000;

export function backendBase(): string {
  return (process.env.PANEL_BACKEND_URL || process.env.T2U_API_URL || DEFAULT_BASE).replace(/\/+$/, '');
}

export function adminAuthHeader(): string | null {
  const token = (process.env.PANEL_ADMIN_TOKEN || process.env.ADMIN_API_TOKEN || '1a1b160c027bde4c1c6cfefe14d33830ef69b7000eb6fe5ec9b0e6cfa913999a').trim();
  if (token) return `Bearer ${token}`;

  const user = (process.env.PANEL_ADMIN_USERNAME || process.env.DEV_ADMIN_USERNAME || '').trim();
  const pass = (process.env.PANEL_ADMIN_PASSWORD || process.env.DEV_ADMIN_PASSWORD || '').trim();
  if (user && pass) {
    return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
  }

  return null;
}

export function backendConfigured(): boolean {
  return Boolean(adminAuthHeader());
}

export class BackendError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = 'BackendError';
    this.status = status;
  }
}

export async function fetchAdmin(
  path: string,
  {
    method = 'GET',
    body = null,
    actor = null,
    signal = null
  }: {
    method?: string;
    body?: any;
    actor?: string | null;
    signal?: AbortSignal | null;
  } = {}
): Promise<Response> {
  const auth = adminAuthHeader();
  if (!auth) {
    throw new BackendError(
      'This panel has no backend credential configured. Fill in PANEL_ADMIN_TOKEN or admin username and password.',
      503
    );
  }

  const clean = String(path || '').replace(/^\/+/, '');
  const url = `${backendBase()}/api/admin/${clean}`;

  try {
    return await fetch(url, {
      method,
      headers: {
        Authorization: auth,
        ...(actor ? { 'x-admin-actor': actor } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: signal || AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store'
    });
  } catch (err: any) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      throw new BackendError('The backend took too long to answer.', 504);
    }
    throw new BackendError(err?.message || 'Could not reach the backend.', 502);
  }
}

export async function callAdmin(path: string, options: any = {}) {
  const response = await fetchAdmin(path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new BackendError(data.error || `Request failed (${response.status}).`, response.status);
  }
  return data;
}
