import { Hono } from 'hono';
import { verifyToken } from '../jwt.js';
import { bus, RealtimeEvent } from '../eventBus.js';

const app = new Hono();

// SSE stream - GET /api/realtime/stream?token=<access_token>&tables=notifications,messages
app.get('/stream', async (c) => {
  const token = c.req.query('token');
  const tablesParam = c.req.query('tables') || '';
  const tables = tablesParam ? tablesParam.split(',').map(t => t.trim()) : [];

  let userId: string | null = null;
  let isAdmin = false;

  if (token) {
    try {
      const payload = await verifyToken(token);
      if (payload.type === 'access') {
        userId = payload.sub;
        isAdmin = payload.is_admin;
      }
    } catch {
      // anonymous stream - still allowed but no user events
    }
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const send = (data: object) => {
    try {
      writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch { /* client disconnected */ }
  };

  // Send connection acknowledgment
  send({ type: 'connected', userId: userId || 'anonymous' });

  // Keep-alive ping every 25s
  const pingInterval = setInterval(() => {
    try {
      writer.write(encoder.encode(': ping\n\n'));
    } catch { clearInterval(pingInterval); }
  }, 25000);

  const handleEvent = (event: RealtimeEvent) => {
    if (tables.length > 0 && !tables.includes(event.table)) return;
    send({ type: 'db-change', ...event });
  };

  // Subscribe to relevant channels
  bus.on('db-change', handleEvent);
  if (userId) {
    bus.on(`user:${userId}`, handleEvent);
  }

  // Cleanup on disconnect
  c.req.raw.signal.addEventListener('abort', () => {
    clearInterval(pingInterval);
    bus.off('db-change', handleEvent);
    if (userId) bus.off(`user:${userId}`, handleEvent);
    writer.close().catch(() => {});
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
});

// POST /api/realtime/publish  (internal use or from edge functions)
app.post('/publish', async (c) => {
  const secret = c.req.header('x-internal-secret');
  if (secret !== process.env.JWT_SECRET) {
    return c.json({ error: 'forbidden' }, 403);
  }
  const event: RealtimeEvent = await c.req.json();
  bus.publish(event);
  return c.json({ ok: true });
});

export default app;
