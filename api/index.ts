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

// ── Background init (fire-and-forget per cold start) ──────────────────────
let bgInitDone = false;
function bgInit() {
  if (bgInitDone) return;
  bgInitDone = true;
  Promise.allSettled([
    initDb().catch(e => console.warn('[api] initDb:', e.message)),
    connectRedis().then(() => setupRedisBridge()).catch(e => console.warn('[api] redis-sub:', e.message)),
  ]).then(() => console.log('[api] background init complete'));
}

// ── Read request body into a Buffer ───────────────────────────────────────
function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
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
    if ((req as any).complete) resolve(Buffer.concat(chunks));
  });
}

// ── Pipe a Web ReadableStream → Node ServerResponse (for SSE) ─────────────
async function pipeStream(readable: ReadableStream<Uint8Array>, req: IncomingMessage, res: ServerResponse) {
  const reader = readable.getReader();
  let cancelled = false;

  const cancel = () => {
    cancelled = true;
    reader.cancel().catch(() => {});
  };

  req.on('close', cancel);
  req.on('error', cancel);

  try {
    while (!cancelled) {
      const { done, value } = await reader.read();
      if (done || cancelled) break;
      if (!res.writable) break;
      // write() returns false when the internal buffer is full → wait for drain
      const ok = res.write(Buffer.from(value));
      if (!ok) await new Promise<void>(r => res.once('drain', r));
    }
  } catch {
    // client disconnected or stream error — normal for SSE
  } finally {
    req.off('close', cancel);
    req.off('error', cancel);
    if (!res.writableEnded) res.end();
  }
}

// ── Main Vercel handler ────────────────────────────────────────────────────
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  bgInit();

  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host  = (req.headers['host'] as string) || 'nic.rw';
  const url   = `${proto}://${host}${req.url}`;

  const body = await readBody(req);

  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (v !== undefined) headers[k] = Array.isArray(v) ? v.join(', ') : v;
  }

  const webReq = new Request(url, {
    method: req.method || 'GET',
    headers,
    body: body.length > 0 ? body : undefined,
  });

  const webRes = await app.fetch(webReq);

  // Write HTTP status + response headers
  res.statusCode = webRes.status;
  webRes.headers.forEach((value, key) => res.setHeader(key, value));

  const isSSE = (webRes.headers.get('content-type') || '').includes('text/event-stream');

  if (isSSE && webRes.body) {
    // Flush headers to the client immediately so the SSE connection is established
    // before any event data arrives (critical for EventSource reconnect logic).
    res.flushHeaders();
    await pipeStream(webRes.body, req, res);
    return;
  }

  // Normal (non-streaming) response — buffer and send
  const resBody = await webRes.arrayBuffer();
  res.end(Buffer.from(resBody));
}
