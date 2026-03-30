import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-internal-secret'],
  exposeHeaders: ['Content-Type'],
}));

app.use('*', logger());

async function mountRoutes() {
  const [authRoutes, realtimeRoutes, dataRoutes, uploadRoutes] = await Promise.all([
    import('./routes/auth.js').then(m => m.default),
    import('./routes/realtime.js').then(m => m.default),
    import('./routes/data.js').then(m => m.default),
    import('./routes/upload.js').then(m => m.default),
  ]);
  app.route('/api/auth', authRoutes);
  app.route('/api/realtime', realtimeRoutes);
  app.route('/api/data', dataRoutes);
  app.route('/api/upload', uploadRoutes);
}

let initialised = false;
let initPromise: Promise<void> | null = null;

export async function initApp(): Promise<void> {
  if (initialised) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    await mountRoutes();
    initialised = true;
  })();
  return initPromise;
}

app.get('/api/health', async (c) => {
  let redisOk = false;
  try {
    const { redis } = await import('./redis.js');
    await redis.ping();
    redisOk = true;
  } catch { }
  return c.json({ ok: true, ts: new Date().toISOString(), redis: redisOk });
});

export default app;
