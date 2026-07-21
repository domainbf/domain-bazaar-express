// Lightweight client-side route/detail error & timing telemetry.
// Buffers events in-memory + localStorage so admins can review them
// across sessions from the /admin telemetry page.

export interface RouteTelemetryEvent {
  type: 'nav_click' | 'detail_fetch_ok' | 'detail_fetch_error' | 'chunk_load_error' | 'route_error';
  domain?: string;
  route?: string;
  durationMs?: number;
  reason?: string;
  ts: number;
}

const STORAGE_KEY = 'nicbn.route_telemetry.v1';
const MAX = 500;

const loadFromStorage = (): RouteTelemetryEvent[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(-MAX) : [];
  } catch {
    return [];
  }
};

const BUFFER: RouteTelemetryEvent[] = loadFromStorage();

const persist = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(BUFFER.slice(-MAX)));
  } catch { /* quota exceeded etc. */ }
};

export function reportRoute(evt: Omit<RouteTelemetryEvent, 'ts'>) {
  const record: RouteTelemetryEvent = { ...evt, ts: Date.now() };
  BUFFER.push(record);
  if (BUFFER.length > MAX) BUFFER.shift();
  const tag = `[route-telemetry:${evt.type}]`;
  if (evt.type.endsWith('_error')) {
    // eslint-disable-next-line no-console
    console.error(tag, record);
  } else {
    // eslint-disable-next-line no-console
    console.info(tag, record);
  }
  try { (window as any).__routeTelemetry = BUFFER; } catch { /* ignore */ }
  persist();
}

export function getRouteTelemetry(): RouteTelemetryEvent[] {
  return [...BUFFER];
}

export function clearRouteTelemetry() {
  BUFFER.length = 0;
  persist();
}

// Retry helper for React.lazy(() => import(...)) so a transient chunk
// load failure doesn't leave the user stuck on a spinner.
export function lazyRetry<T>(
  factory: () => Promise<T>,
  attempts = 3,
  delayMs = 600,
): () => Promise<T> {
  return async () => {
    let lastErr: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await factory();
      } catch (err) {
        lastErr = err;
        reportRoute({
          type: 'chunk_load_error',
          reason: (err as Error)?.message || 'unknown',
        });
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
      }
    }
    throw lastErr;
  };
}
