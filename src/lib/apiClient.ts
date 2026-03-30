// In dev: Vite proxies /api → localhost:3001
// In prod: VITE_API_URL points to deployed API server (e.g. https://api.nic.rw)
// Must start with http:// or https:// — bare hostnames like "api.nic.rw" are rejected.
const _rawApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const BASE = (_rawApiUrl && /^https?:\/\//i.test(_rawApiUrl))
  ? `${_rawApiUrl}/api`
  : '/api';

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

const TOKEN_KEY = 'nic_access_token';
const REFRESH_KEY = 'nic_refresh_token';

export function loadTokens() {
  accessToken = localStorage.getItem(TOKEN_KEY);
  refreshToken = localStorage.getItem(REFRESH_KEY);
}

export function saveTokens(at: string, rt: string) {
  accessToken = at;
  refreshToken = rt;
  localStorage.setItem(TOKEN_KEY, at);
  localStorage.setItem(REFRESH_KEY, rt);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function getAccessToken() { return accessToken; }
export function getRefreshToken() { return refreshToken; }

async function doRefresh(): Promise<boolean> {
  const rt = refreshToken || localStorage.getItem(REFRESH_KEY);
  if (!rt) return false;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) {
      clearTokens();
      return false;
    }
    const data = await res.json();
    saveTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  loadTokens();
  const headers = new Headers(init.headers || {});
  // Don't force JSON Content-Type for FormData — let the browser set multipart boundary
  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  let res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed && accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
      res = await fetch(`${BASE}${path}`, { ...init, headers });
    }
  }
  return res;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path, { method: 'GET' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

export async function apiDelete<T = unknown>(path: string): Promise<T> {
  const res = await apiFetch(path, { method: 'DELETE' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || `HTTP ${res.status}`);
  return data as T;
}
