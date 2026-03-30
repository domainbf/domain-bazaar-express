import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) throw new Error('REDIS_URL is required');

// Publisher / general-purpose client
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableReadyCheck: true,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

// Dedicated subscriber client (blocked on subscribe, cannot run commands)
export const redisSub = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redis.on('error', (err) => console.error('[redis] error:', err.message));
redisSub.on('error', (err) => console.error('[redis-sub] error:', err.message));
redis.on('ready', () => console.log('[redis] connected'));
redisSub.on('ready', () => console.log('[redis-sub] connected'));

export const PUBSUB_CHANNEL = 'nic:realtime';

// ── Session helpers ────────────────────────────────────────────────────────

export const SESSION_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

export async function saveSession(sessionId: string, data: {
  userId: string;
  refreshTokenHash: string;
  userAgent?: string;
  expiresAt: string;
}) {
  const key = `session:${sessionId}`;
  await redis.setex(key, SESSION_TTL, JSON.stringify(data));
  // Track sessions per user for bulk invalidation
  await redis.sadd(`user_sessions:${data.userId}`, sessionId);
  await redis.expire(`user_sessions:${data.userId}`, SESSION_TTL);
}

export async function getSession(sessionId: string) {
  const raw = await redis.get(`session:${sessionId}`);
  return raw ? JSON.parse(raw) as { userId: string; refreshTokenHash: string; userAgent?: string; expiresAt: string } : null;
}

export async function deleteSession(sessionId: string, userId?: string) {
  await redis.del(`session:${sessionId}`);
  if (userId) await redis.srem(`user_sessions:${userId}`, sessionId);
}

export async function deleteAllUserSessions(userId: string) {
  const ids = await redis.smembers(`user_sessions:${userId}`);
  if (ids.length) {
    const keys = ids.map(id => `session:${id}`);
    await redis.del(...keys);
  }
  await redis.del(`user_sessions:${userId}`);
}

export async function getUserSessionIds(userId: string): Promise<string[]> {
  return redis.smembers(`user_sessions:${userId}`);
}

// ── Rate limiting ──────────────────────────────────────────────────────────

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSecs: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const rKey = `ratelimit:${key}`;
  const count = await redis.incr(rKey);
  if (count === 1) await redis.expire(rKey, windowSecs);
  const ttl = await redis.ttl(rKey);
  const remaining = Math.max(0, maxRequests - count);
  return { allowed: count <= maxRequests, remaining, resetIn: ttl };
}

// ── Cache helpers ──────────────────────────────────────────────────────────

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await redis.get(`cache:${key}`);
  return raw ? JSON.parse(raw) as T : null;
}

export async function cacheSet(key: string, value: unknown, ttlSecs = 60) {
  await redis.setex(`cache:${key}`, ttlSecs, JSON.stringify(value));
}

export async function cacheDel(key: string) {
  await redis.del(`cache:${key}`);
}

// ── Publish event (used by eventBus) ──────────────────────────────────────

export async function publishEvent(event: Record<string, unknown>) {
  await redis.publish(PUBSUB_CHANNEL, JSON.stringify(event));
}

// ── Connect both clients ───────────────────────────────────────────────────

export async function connectRedis() {
  await Promise.all([redis.connect(), redisSub.connect()]);
}
