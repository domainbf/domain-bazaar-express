import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { compress } from 'hono/compress';
import { createClient } from '@supabase/supabase-js';
import { initDb, db } from './db.js';
import { connectRedis, redis } from './redis.js';
import { setupRedisBridge } from './eventBus.js';
import authRoutes from './routes/auth.js';
import realtimeRoutes from './routes/realtime.js';
import dataRoutes from './routes/data.js';
import uploadRoutes from './routes/upload.js';

// Server-side Supabase client (anon key, read-only ping only)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://trqxaizkwuizuhlfmdup.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycXhhaXprd3VpenVobGZtZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2ODk1NzcsImV4cCI6MjA1MDI2NTU3N30.uv3FElLBTsCNr3Vg4PooW7h1o2ZlivAFGawFH-Zqxns';
const supabase = createClient(supabaseUrl, supabaseKey);

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

// ── Static file serving (production only) ──────────────────────────────────
const isProd = process.env.NODE_ENV === 'production';
if (isProd) {
  // Serve built assets from dist/
  app.use('/*', serveStatic({ root: './dist' }));
  // SPA fallback — all non-API, non-asset routes serve index.html
  app.get('*', serveStatic({ path: './dist/index.html' }));
}

// ── Health check (used by keep-alive + admin dashboard) ────────────────────
app.get('/api/health', async (c) => {
  let redisOk = false, dbOk = false, supabaseOk = false;
  let redisLatency = -1, dbLatency = -1, supabaseLatency = -1;

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

  const t2 = Date.now();
  try {
    const { error } = await supabase.from('site_settings').select('key').limit(1);
    supabaseOk = !error;
    supabaseLatency = Date.now() - t2;
  } catch { /* offline */ }

  return c.json({
    ok: redisOk && dbOk,
    ts: new Date().toISOString(),
    redis: redisOk,
    redisLatencyMs: redisLatency,
    db: dbOk,
    dbLatencyMs: dbLatency,
    supabase: supabaseOk,
    supabaseLatencyMs: supabaseLatency,
    uptime: Math.floor(process.uptime()),
  });
});

const PORT = parseInt(process.env.PORT || process.env.API_PORT || (isProd ? '5000' : '3001'));

// ── Keep-alive: prevents Turso / Redis / Supabase from sleeping ────────────
// All three are pinged every 5 hours — just enough to keep the projects
// active on their respective free tiers without wasting quota.
const KEEPALIVE_INTERVAL = 5 * 60 * 60 * 1000; // 5 hours
let keepAliveStarted = false;

function startKeepAlive() {
  if (keepAliveStarted) return;
  keepAliveStarted = true;

  // Turso ping
  setInterval(async () => {
    try {
      await db.execute('SELECT 1');
    } catch (e) {
      console.warn('[keepalive] Turso ping failed:', (e as Error).message);
    }
  }, KEEPALIVE_INTERVAL);

  // Redis ping
  setInterval(async () => {
    try {
      await redis.ping();
    } catch (e) {
      console.warn('[keepalive] Redis ping failed:', (e as Error).message);
    }
  }, KEEPALIVE_INTERVAL);

  // Supabase ping — lightweight SELECT from a public table
  setInterval(async () => {
    try {
      await supabase.from('site_settings').select('key').limit(1);
    } catch (e) {
      console.warn('[keepalive] Supabase ping failed:', (e as Error).message);
    }
  }, KEEPALIVE_INTERVAL);

  console.log('[keepalive] Turso + Redis + Supabase keep-alive started (every 5h)');
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

// ── Dev mode: proxy non-API requests → Vite dev server (port 5000) ─────────
// This lets the Replit preview (which hits port 3001) render the frontend.
if (!isProd) {
  app.all('*', async (c) => {
    const url = new URL(c.req.url);
    const target = `http://localhost:5000${url.pathname}${url.search}`;
    try {
      const res = await fetch(target, {
        method: c.req.method,
        headers: c.req.raw.headers,
        body: ['GET', 'HEAD'].includes(c.req.method) ? undefined : c.req.raw.body,
        // @ts-ignore — Node 18 fetch needs duplex for streaming bodies
        duplex: 'half',
      });
      return new Response(res.body, { status: res.status, headers: res.headers });
    } catch {
      return c.html('<p style="font-family:sans-serif;padding:2rem">Vite dev server starting on port 5000, please wait a moment and refresh…</p>', 502);
    }
  });
}

main();
