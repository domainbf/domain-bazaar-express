import type { QueryClient } from '@tanstack/react-query';

/**
 * Lightweight React Query cache persistence (localStorage).
 * Hydrates cached data synchronously at boot so returning visitors see
 * content instantly while a background revalidation runs.
 */

const STORAGE_KEY = 'rq-cache-v1';
const MAX_AGE = 24 * 60 * 60 * 1000; // 24h
const MAX_ENTRY_BYTES = 250_000;

// Only persist read-only, non-sensitive query families.
const PERSIST_PREFIXES = ['home-data', 'domains', 'site-settings', 'sold-domains'];

type PersistedEntry = { key: unknown[]; data: unknown; ts: number };

function isPersistable(key: readonly unknown[]): boolean {
  const head = String(key?.[0] ?? '');
  return PERSIST_PREFIXES.some((p) => head === p || head.startsWith(p));
}

export function hydrateQueryCache(queryClient: QueryClient) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const entries: PersistedEntry[] = JSON.parse(raw);
    const now = Date.now();
    for (const entry of entries) {
      if (!entry?.key || now - entry.ts > MAX_AGE) continue;
      if (queryClient.getQueryData(entry.key as any) !== undefined) continue;
      queryClient.setQueryData(entry.key as any, entry.data, { updatedAt: entry.ts });
    }
  } catch {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }
}

export function startQueryPersistence(queryClient: QueryClient) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    timer = null;
    try {
      const entries: PersistedEntry[] = [];
      for (const query of queryClient.getQueryCache().getAll()) {
        if (query.state.status !== 'success') continue;
        if (!isPersistable(query.queryKey)) continue;
        const serialized = JSON.stringify(query.state.data);
        if (!serialized || serialized.length > MAX_ENTRY_BYTES) continue;
        entries.push({
          key: query.queryKey as unknown[],
          data: query.state.data,
          ts: query.state.dataUpdatedAt || Date.now(),
        });
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
  };

  const schedule = () => {
    if (timer) return;
    timer = setTimeout(flush, 1500);
  };

  const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    if (event?.type === 'updated') schedule();
  });

  window.addEventListener('pagehide', flush);
  return () => {
    unsubscribe();
    window.removeEventListener('pagehide', flush);
  };
}

export function clearPersistedQueryCache() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
