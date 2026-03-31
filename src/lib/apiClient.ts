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
const PERSIST_KEY = 'nic_remember_me';

// true  = localStorage  (survives browser close — "remember me")
// false = sessionStorage (cleared when tab/browser closes)
let persistent = localStorage.getItem(PERSIST_KEY) === 'true';

export function setPersistent(value: boolean) {
  persistent = value;
  if (value) {
    localStorage.setItem(PERSIST_KEY, 'true');
  } else {
    localStorage.removeItem(PERSIST_KEY);
  }
}

export function loadTokens() {
  const sessionAt = sessionStorage.getItem(TOKEN_KEY);
  const localAt = localStorage.getItem(TOKEN_KEY);

  if (sessionAt) {
    // Active session tokens take priority
    accessToken = sessionAt;
    refreshToken = sessionStorage.getItem(REFRESH_KEY);
  } else if (localAt) {
    // Tokens found in localStorage
    accessToken = localAt;
    refreshToken = localStorage.getItem(REFRESH_KEY);
    // Backward compat: tokens in localStorage without PERSIST_KEY means they were
    // saved before "remember me" was implemented — treat as persistent so
    // saveTokens() keeps them in localStorage instead of migrating to sessionStorage.
    if (localStorage.getItem(PERSIST_KEY) !== 'true') {
      persistent = true;
      localStorage.setItem(PERSIST_KEY, 'true');
    }
  } else {
    accessToken = null;
    refreshToken = null;
  }

  // Re-read persistent flag (may have been set above)
  persistent = localStorage.getItem(PERSIST_KEY) === 'true';
}

export function saveTokens(at: string, rt: string) {
  accessToken = at;
  refreshToken = rt;
  if (persistent) {
    localStorage.setItem(TOKEN_KEY, at);
    localStorage.setItem(REFRESH_KEY, rt);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, at);
    sessionStorage.setItem(REFRESH_KEY, rt);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(PERSIST_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  persistent = false;
}

export function getAccessToken() { return accessToken; }
export function getRefreshToken() { return refreshToken; }

async function doRefresh(): Promise<boolean> {
  const rt = refreshToken ||
    sessionStorage.getItem(REFRESH_KEY) ||
    localStorage.getItem(REFRESH_KEY);
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
