// Lightweight client-side route/detail error & timing telemetry.
// Buffers events in-memory + logs structured payloads so they can be
// grepped from console logs / forwarded later.

export interface RouteTelemetryEvent {
  type: 'nav_click' | 'detail_fetch_ok' | 'detail_fetch_error' | 'chunk_load_error' | 'route_error';
  domain?: string;
  route?: string;
  durationMs?: number;
  reason?: string;
  ts: number;
}

const BUFFER: RouteTelemetryEvent[] = [];
const MAX = 100;

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
  try {
    (window as any).__routeTelemetry = BUFFER;
  } catch { /* ignore */ }
}

export function getRouteTelemetry(): RouteTelemetryEvent[] {
  return [...BUFFER];
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
