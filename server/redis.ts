import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) throw new Error('REDIS_URL is required');

// Retry strategy: exponential backoff, give up after 5 attempts (~30s).
// Short enough to not hang serverless; long enough to survive brief network blips.
const retryStrategy = (times: number) => {
  if (times > 5) return null;            // stop retrying — let caller handle error
  return Math.min(times * 300, 3000);    // 300ms, 600ms, 900ms … 3000ms
};

// Publisher / general-purpose client — auto-connects on module load
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 2,
  enableReadyCheck: false,   // skip INFO check — faster ready state
  connectTimeout: 4000,
  retryStrategy,
  keepAlive: 30_000,         // TCP keepalive every 30s; detects silent drops fast
  lazyConnect: false,
});

// Dedicated subscriber client (blocked on subscribe, cannot run commands)
export const redisSub = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 2,
  lazyConnect: true,         // connect explicitly via connectRedis()
  connectTimeout: 4000,
  retryStrategy,
  keepAlive: 30_000,
});

redis.on('error', (err) => console.error('[redis] error:', err.message));
redis.on('reconnecting', () => console.log('[redis] reconnecting…'));
redis.on('ready', () => console.log('[redis] connected'));

redisSub.on('error', (err) => console.error('[redis-sub] error:', err.message));
redisSub.on('reconnecting', () => console.log('[redis-sub] reconnecting…'));
redisSub.on('ready', () => console.log('[redis-sub] connected'));

export const PUBSUB_CHANNEL = 'nic:realtime';

// ── Hard timeout wrapper ────────────────────────────────────────────────────
export function withRedisTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Redis command timed out after ${ms}ms`)), ms)
    )
  ]);
}

// ── Session helpers ────────────────────────────────────────────────────────
export const SESSION_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

export async function saveSession(sessionId: string, data: {
  userId: string;
  refreshTokenHash: string;
  userAgent?: string;
  expiresAt: string;
}) {
  const key = `session:${sessionId}`;
  await withRedisTimeout(redis.setex(key, SESSION_TTL, JSON.stringify(data)));
  await withRedisTimeout(redis.sadd(`user_sessions:${data.userId}`, sessionId));
  await withRedisTimeout(redis.expire(`user_sessions:${data.userId}`, SESSION_TTL));
}

export async function getSession(sessionId: string) {
  const raw = await withRedisTimeout(redis.get(`session:${sessionId}`));
  return raw ? JSON.parse(raw) as { userId: string; refreshTokenHash: string; userAgent?: string; expiresAt: string } : null;
}

export async function deleteSession(sessionId: string, userId?: string) {
  await withRedisTimeout(redis.del(`session:${sessionId}`));
  if (userId) await withRedisTimeout(redis.srem(`user_sessions:${userId}`, sessionId));
}

export async function deleteAllUserSessions(userId: string) {
  const ids = await withRedisTimeout(redis.smembers(`user_sessions:${userId}`));
  if (ids.length) {
    const keys = ids.map(id => `session:${id}`);
    await withRedisTimeout(redis.del(...keys));
  }
  await withRedisTimeout(redis.del(`user_sessions:${userId}`));
}

export async function getUserSessionIds(userId: string): Promise<string[]> {
  return withRedisTimeout(redis.smembers(`user_sessions:${userId}`));
}

// ── Rate limiting ──────────────────────────────────────────────────────────
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSecs: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const rKey = `ratelimit:${key}`;
  const count = await withRedisTimeout(redis.incr(rKey));
  if (count === 1) await withRedisTimeout(redis.expire(rKey, windowSecs));
  const ttl = await withRedisTimeout(redis.ttl(rKey));
  const remaining = Math.max(0, maxRequests - count);
  return { allowed: count <= maxRequests, remaining, resetIn: ttl };
}

// ── Cache helpers ──────────────────────────────────────────────────────────
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await withRedisTimeout(redis.get(`cache:${key}`));
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null; // degrade gracefully when Redis is unavailable
  }
}

export async function cacheSet(key: string, value: unknown, ttlSecs = 60) {
  try {
    await withRedisTimeout(redis.setex(`cache:${key}`, ttlSecs, JSON.stringify(value)));
  } catch { /* degrade gracefully */ }
}

export async function cacheDel(key: string) {
  try {
    await withRedisTimeout(redis.del(`cache:${key}`));
  } catch { /* degrade gracefully */ }
}

/**
 * Stale-while-revalidate: returns stale cache immediately while running
 * `fetcher` in the background to refresh. Background errors are swallowed.
 * @param key      Cache key (without "cache:" prefix)
 * @param ttlSecs  Fresh TTL; stale data is returned until this expires + staleSecs
 * @param staleSecs Extra seconds a stale value may still be served (default 60)
 * @param fetcher  Async function that returns fresh data
 */
export async function cacheGetOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSecs = 60,
  staleSecs = 60,
): Promise<T> {
  const fullKey = `cache:${key}`;
  const staleKey = `cache:stale:${key}`;

  // Try fresh cache first
  try {
    const raw = await withRedisTimeout(redis.get(fullKey));
    if (raw) return JSON.parse(raw) as T;
  } catch { /* fall through */ }

  // Try stale cache; revalidate in background
  try {
    const stale = await withRedisTimeout(redis.get(staleKey));
    if (stale) {
      // Revalidate asynchronously
      fetcher()
        .then(async (fresh) => {
          await withRedisTimeout(redis.setex(fullKey, ttlSecs, JSON.stringify(fresh)));
          await withRedisTimeout(redis.setex(staleKey, ttlSecs + staleSecs, JSON.stringify(fresh)));
        })
        .catch(() => {});
      return JSON.parse(stale) as T;
    }
  } catch { /* fall through */ }

  // Cold path — fetch fresh and populate both keys
  const data = await fetcher();
  try {
    await withRedisTimeout(redis.setex(fullKey, ttlSecs, JSON.stringify(data)));
    await withRedisTimeout(redis.setex(staleKey, ttlSecs + staleSecs, JSON.stringify(data)));
  } catch { /* degrade gracefully */ }
  return data;
}

// ── Publish event (used by eventBus) ──────────────────────────────────────
export async function publishEvent(event: Record<string, unknown>) {
  try {
    await withRedisTimeout(redis.publish(PUBSUB_CHANNEL, JSON.stringify(event)));
  } catch { /* degrade gracefully */ }
}

// ── Connect both clients ───────────────────────────────────────────────────
export async function connectRedis() {
  // redis auto-connects on module load; only explicitly connect redisSub here
  await redisSub.connect();
}
