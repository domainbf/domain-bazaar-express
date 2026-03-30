import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { initDb } from './db.js';
import authRoutes from './routes/auth.js';
import realtimeRoutes from './routes/realtime.js';
import dataRoutes from './routes/data.js';

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

app.get('/api/health', (c) => c.json({ ok: true, ts: new Date().toISOString() }));

const PORT = parseInt(process.env.API_PORT || '3001');

async function main() {
  try {
    await initDb();
    console.log('[server] Turso DB initialised');
  } catch (err) {
    console.error('[server] DB init failed:', err);
  }

  serve({ fetch: app.fetch, port: PORT }, () => {
    console.log(`[server] API server running on port ${PORT}`);
  });
}

main();
