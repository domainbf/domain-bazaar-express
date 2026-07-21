// Lightweight client-side route/detail error & timing telemetry.
// Buffers events in-memory + localStorage so admins can review them
// across sessions from the /admin telemetry page.

export type RouteTelemetryType =
  | 'nav_click'
  | 'detail_fetch_ok'
  | 'detail_fetch_error'
  | 'chunk_load_error'
  | 'chunk_load_retry'
  | 'chunk_load_giveup'
  | 'unhandled_rejection'
  | 'route_error';

export interface RouteTelemetryEvent {
  type: RouteTelemetryType;
  domain?: string;
  route?: string;
  durationMs?: number;
  reason?: string;
  userAgent?: string;
  attempt?: number;
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
  const record: RouteTelemetryEvent = {
    ...evt,
    ts: Date.now(),
    userAgent: evt.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : undefined),
    route: evt.route ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
  };
  BUFFER.push(record);
  if (BUFFER.length > MAX) BUFFER.shift();
  const tag = `[route-telemetry:${evt.type}]`;
  if (evt.type.endsWith('_error') || evt.type === 'unhandled_rejection' || evt.type === 'chunk_load_giveup') {
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

// Retry helper for React.lazy(() => import(...)) with exponential backoff.
// On terminal failure emits a chunk_load_giveup event so the admin panel
// can surface the offending route + UA.
export function lazyRetry<T>(
  factory: () => Promise<T>,
  attempts = 4,
  baseDelayMs = 400,
): () => Promise<T> {
  return async () => {
    let lastErr: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await factory();
      } catch (err) {
        lastErr = err;
        reportRoute({
          type: i === attempts - 1 ? 'chunk_load_giveup' : 'chunk_load_retry',
          reason: (err as Error)?.message || 'unknown',
          attempt: i + 1,
        });
        if (i === attempts - 1) break;
        // Exponential backoff with jitter: 400ms, 800ms, 1600ms…
        const delay = baseDelayMs * 2 ** i + Math.random() * 200;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw lastErr;
  };
}
