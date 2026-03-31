import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { compress } from 'hono/compress';
import { initDb, db } from './db.js';
import { connectRedis, redis } from './redis.js';
import { setupRedisBridge } from './eventBus.js';
import authRoutes from './routes/auth.js';
import realtimeRoutes from './routes/realtime.js';
import dataRoutes from './routes/data.js';
import uploadRoutes from './routes/upload.js';

const app = new Hono();

// ── Middleware ─────────────────────────────────────────────────────────────
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-internal-secret'],
  exposeHeaders: ['Content-Type'],
}));

app.use('*', compress());  // gzip/deflate all responses
app.use('*', logger());

// ── Routes ─────────────────────────────────────────────────────────────────
app.route('/api/auth', authRoutes);
app.route('/api/realtime', realtimeRoutes);
app.route('/api/data', dataRoutes);
app.route('/api/upload', uploadRoutes);

// ── Health check (used by keep-alive + admin dashboard) ────────────────────
app.get('/api/health', async (c) => {
  let redisOk = false;
  let dbOk = false;
  let redisLatency = -1;
  let dbLatency = -1;

  const t0 = Date.now();
  try {
    await redis.ping();
    redisOk = true;
    redisLatency = Date.now() - t0;
  } catch { /* offline */ }

  const t1 = Date.now();
  try {
    await db.execute('SELECT 1');
    dbOk = true;
    dbLatency = Date.now() - t1;
  } catch { /* offline */ }

  return c.json({
    ok: redisOk && dbOk,
    ts: new Date().toISOString(),
    redis: redisOk,
    redisLatencyMs: redisLatency,
    db: dbOk,
    dbLatencyMs: dbLatency,
    uptime: Math.floor(process.uptime()),
  });
});

const PORT = parseInt(process.env.API_PORT || '3001');

// ── Keep-alive: prevents Turso + Redis from sleeping ──────────────────────
// Turso free-tier idles after ~5 min; Redis Upstash idles after 30 days.
// We ping both on a schedule so cold-starts never affect real requests.
let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

function startKeepAlive() {
  if (keepAliveTimer) return;

  // Ping Turso every 4 minutes
  keepAliveTimer = setInterval(async () => {
    try {
      await db.execute('SELECT 1');
    } catch (e) {
      console.warn('[keepalive] Turso ping failed:', (e as Error).message);
    }
  }, 4 * 60 * 1000);

  // Ping Redis every 3 minutes (separate timer for fine-grained control)
  setInterval(async () => {
    try {
      await redis.ping();
    } catch (e) {
      console.warn('[keepalive] Redis ping failed:', (e as Error).message);
    }
  }, 3 * 60 * 1000);

  console.log('[keepalive] Turso+Redis keep-alive started (4min / 3min)');
}

// ── Startup ────────────────────────────────────────────────────────────────
async function main() {
  // 1. Init Turso schema
  try {
    await initDb();
    console.log('[server] Turso DB initialised');
  } catch (err) {
    console.error('[server] DB init failed:', err);
  }

  // 2. Connect Redis + start pub/sub bridge
  try {
    await connectRedis();
    await setupRedisBridge();
    console.log('[server] Redis connected');
  } catch (err) {
    console.error('[server] Redis connection failed (continuing without Redis):', err);
  }

  // 3. Start HTTP server
  serve({ fetch: app.fetch, port: PORT }, () => {
    console.log(`[server] API server running on port ${PORT}`);
  });

  // 4. Start keep-alive pings after 10s (let startup settle first)
  setTimeout(startKeepAlive, 10_000);
}

main();
