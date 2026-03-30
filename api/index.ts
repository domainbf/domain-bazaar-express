import type { IncomingMessage, ServerResponse } from 'node:http';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { initDb } from '../server/db.js';
import { connectRedis } from '../server/redis.js';
import { setupRedisBridge } from '../server/eventBus.js';
import authRoutes from '../server/routes/auth.js';
import realtimeRoutes from '../server/routes/realtime.js';
import dataRoutes from '../server/routes/data.js';
import uploadRoutes from '../server/routes/upload.js';

const app = new Hono();

app.onError((err, c) => {
  console.error('[api] Unhandled route error:', err.message);
  return c.json({ error: '服务器内部错误，请稍后重试', detail: err.message }, 500);
});

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-internal-secret'],
  exposeHeaders: ['Content-Type'],
}));

app.route('/api/auth', authRoutes);
app.route('/api/realtime', realtimeRoutes);
app.route('/api/data', dataRoutes);
app.route('/api/upload', uploadRoutes);

app.get('/api/health', async (c) => {
  let redisOk = false;
  try {
    const { redis } = await import('../server/redis.js');
    await redis.ping();
    redisOk = true;
  } catch { }
  return c.json({ ok: true, ts: new Date().toISOString(), redis: redisOk });
});

// Fire-and-forget background init
let bgInitDone = false;
function bgInit() {
  if (bgInitDone) return;
  bgInitDone = true;
  Promise.allSettled([
    initDb().catch(e => console.warn('[api] initDb:', e.message)),
    connectRedis().then(() => setupRedisBridge()).catch(e => console.warn('[api] redis-sub:', e.message)),
  ]).then(() => console.log('[api] background init complete'));
}

// Read body from IncomingMessage as Buffer — handles Vercel's streaming correctly
function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // If body is already available (some runtimes pre-buffer it)
    if ((req as any).body) {
      const b = (req as any).body;
      if (Buffer.isBuffer(b)) return resolve(b);
      if (typeof b === 'string') return resolve(Buffer.from(b));
      if (typeof b === 'object') return resolve(Buffer.from(JSON.stringify(b)));
    }
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
    // Safety: if the stream is already ended (no more data), resolve empty
    if ((req as any).complete) resolve(Buffer.concat(chunks));
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  bgInit();

  // Build a proper URL from the request
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = (req.headers['host'] as string) || 'nic.rw';
  const url = `${proto}://${host}${req.url}`;

  // Read body upfront so it's available for all route handlers
  const body = await readBody(req);

  // Convert headers to a plain record
  const headers: Record<string, string> = {};
  const raw = req.headers;
  for (const [k, v] of Object.entries(raw)) {
    if (v !== undefined) headers[k] = Array.isArray(v) ? v.join(', ') : v;
  }

  // Build a Web API Request object for Hono
  const webReq = new Request(url, {
    method: req.method || 'GET',
    headers,
    body: body.length > 0 ? body : undefined,
  });

  // Call Hono's fetch handler
  const webRes = await app.fetch(webReq);

  // Write status and headers
  res.statusCode = webRes.status;
  webRes.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  // Write body
  const resBody = await webRes.arrayBuffer();
  res.end(Buffer.from(resBody));
}
