import { Hono } from 'hono';
import { db } from '../db.js';
import { requireAuth, getAuth } from '../middleware/auth.js';
import { bus } from '../eventBus.js';
import { cacheGet, cacheSet, cacheDel } from '../redis.js';

const app = new Hono();

function now() { return new Date().toISOString(); }
function parseJson(v: unknown) {
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return v; }
  }
  return v;
}
function rowToObj(row: Record<string, unknown>): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    obj[k] = parseJson(v);
  }
  return obj;
}

// Generic helper to build query response
async function queryTable(table: string, where?: string, args?: unknown[]) {
  const sql = where
    ? `SELECT * FROM ${table} WHERE ${where}`
    : `SELECT * FROM ${table}`;
  const r = await db.execute({ sql, args: args || [] });
  return r.rows.map(rowToObj);
}

// ---- Domain Listings ----
app.get('/domain-listings', async (c) => {
  const status = c.req.query('status') || 'active';
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  const cacheKey = `domain_listings:${status}:${limit}:${offset}`;
  const cached = await cacheGet<unknown[]>(cacheKey);
  if (cached) return c.json(cached);
  const r = await db.execute({
    sql: 'SELECT * FROM domain_listings WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    args: [status, limit, offset]
  });
  const rows = r.rows.map(rowToObj);
  await cacheSet(cacheKey, rows, 60); // 1 min cache
  return c.json(rows);
});

app.get('/domain-listings/:id', async (c) => {
  const r = await db.execute({ sql: 'SELECT * FROM domain_listings WHERE id = ?', args: [c.req.param('id')] });
  if (!r.rows[0]) return c.json({ error: '未找到' }, 404);
  return c.json(rowToObj(r.rows[0]));
});

// ---- User domains ----
app.get('/my-domains', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const r = await db.execute({ sql: 'SELECT * FROM domain_listings WHERE owner_id = ? ORDER BY created_at DESC', args: [sub] });
  return c.json(r.rows.map(rowToObj));
});

// ---- Notifications ----
app.get('/notifications', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const r = await db.execute({
    sql: 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
    args: [sub]
  });
  return c.json(r.rows.map(rowToObj));
});

app.patch('/notifications/:id/read', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  await db.execute({
    sql: 'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    args: [c.req.param('id'), sub]
  });
  return c.json({ success: true });
});

app.post('/notifications/read-all', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  await db.execute({ sql: 'UPDATE notifications SET is_read = 1 WHERE user_id = ?', args: [sub] });
  return c.json({ success: true });
});

// ---- Messages ----
app.get('/messages', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const r = await db.execute({
    sql: 'SELECT * FROM messages WHERE sender_id = ? OR receiver_id = ? ORDER BY created_at DESC',
    args: [sub, sub]
  });
  return c.json(r.rows.map(rowToObj));
});

// ---- Transactions ----
app.get('/transactions', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const r = await db.execute({
    sql: 'SELECT * FROM transactions WHERE buyer_id = ? OR seller_id = ? ORDER BY created_at DESC',
    args: [sub, sub]
  });
  return c.json(r.rows.map(rowToObj));
});

// ---- Site Settings (public read, heavily cached) ----
app.get('/site-settings', async (c) => {
  const cached = await cacheGet<unknown>('site_settings');
  if (cached) return c.json(cached);
  const r = await db.execute({ sql: 'SELECT * FROM site_settings LIMIT 1', args: [] });
  const data = r.rows[0] ? rowToObj(r.rows[0]) : {};
  await cacheSet('site_settings', data, 300); // 5 min cache
  return c.json(data);
});

// ---- Wallet ----
app.get('/wallet', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const r = await db.execute({ sql: 'SELECT * FROM payment_transactions WHERE user_id = ? ORDER BY created_at DESC', args: [sub] });
  return c.json(r.rows.map(rowToObj));
});

// ---- Admin: publish realtime event ----
app.post('/admin/publish-event', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const event = await c.req.json();
  bus.publish(event);
  return c.json({ ok: true });
});

export default app;
