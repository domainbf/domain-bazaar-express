import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) throw new Error('REDIS_URL is required');

// Fast-fail retry for serverless: give up after 2 retries (~4s total max)
const serverlessRetry = (times: number) => {
  if (times > 2) return null;
  return times * 300;
};

// Publisher / general-purpose client — auto-connects on module load
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 2,
  enableReadyCheck: false,  // skip INFO check — faster ready state
  connectTimeout: 3000,     // 3s per connection attempt; 3 total = ~9s max
  retryStrategy: serverlessRetry,
});

// Dedicated subscriber client (blocked on subscribe, cannot run commands)
export const redisSub = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 2,
  lazyConnect: true,
  connectTimeout: 3000,
  retryStrategy: serverlessRetry,
});

redis.on('error', (err) => console.error('[redis] error:', err.message));
redisSub.on('error', (err) => console.error('[redis-sub] error:', err.message));
redis.on('ready', () => console.log('[redis] connected'));
redisSub.on('ready', () => console.log('[redis-sub] connected'));

export const PUBSUB_CHANNEL = 'nic:realtime';

// ── Wrap any redis call with a hard timeout (ms) ───────────────────────────

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
  const raw = await withRedisTimeout(redis.get(`cache:${key}`));
  return raw ? JSON.parse(raw) as T : null;
}

export async function cacheSet(key: string, value: unknown, ttlSecs = 60) {
  await withRedisTimeout(redis.setex(`cache:${key}`, ttlSecs, JSON.stringify(value)));
}

export async function cacheDel(key: string) {
  await withRedisTimeout(redis.del(`cache:${key}`));
}

// ── Publish event (used by eventBus) ──────────────────────────────────────

export async function publishEvent(event: Record<string, unknown>) {
  await withRedisTimeout(redis.publish(PUBSUB_CHANNEL, JSON.stringify(event)));
}

// ── Connect both clients ───────────────────────────────────────────────────

export async function connectRedis() {
  // redis auto-connects on module load; only explicitly connect redisSub here
  await redisSub.connect();
}
