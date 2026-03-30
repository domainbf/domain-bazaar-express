import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { initDb } from './db.js';
import { connectRedis } from './redis.js';
import { setupRedisBridge } from './eventBus.js';
import authRoutes from './routes/auth.js';
import realtimeRoutes from './routes/realtime.js';
import dataRoutes from './routes/data.js';
import uploadRoutes from './routes/upload.js';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-internal-secret'],
  exposeHeaders: ['Content-Type'],
}));

app.use('*', logger());

app.route('/api/auth', authRoutes);
app.route('/api/realtime', realtimeRoutes);
app.route('/api/data', dataRoutes);
app.route('/api/upload', uploadRoutes);

app.get('/api/health', async (c) => {
  const { redis } = await import('./redis.js');
  let redisOk = false;
  try { await redis.ping(); redisOk = true; } catch { /* ignore */ }
  return c.json({ ok: true, ts: new Date().toISOString(), redis: redisOk });
});

const PORT = parseInt(process.env.API_PORT || '3001');

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
}

main();
