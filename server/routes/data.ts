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

// Bust ALL domain_listings list caches (called after any mutation)
async function invalidateDomainListCache(id?: string) {
  const redis = (await import('../redis.js')).redis;
  const patterns = ['domain_listings:*'];
  for (const p of patterns) {
    const keys = await redis.keys(p);
    for (const k of keys) await redis.del(k);
  }
  if (id) await cacheDel(`domain_listing:${id}`);
}

// ---- Domain Listings ----
app.get('/domain-listings', async (c) => {
  const status = c.req.query('status') || 'available';
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

app.get('/domain-listings/by-name/:name', async (c) => {
  const name = c.req.param('name');
  const r = await db.execute({ sql: 'SELECT id, owner_id FROM domain_listings WHERE name = ? LIMIT 1', args: [name] });
  if (!r.rows[0]) return c.json({ error: '未找到' }, 404);
  return c.json(rowToObj(r.rows[0]));
});

app.get('/domain-listings/:id', async (c) => {
  const id = c.req.param('id');
  const cacheKey = `domain_listing:${id}`;
  const cached = await cacheGet<unknown>(cacheKey);
  if (cached) return c.json(cached);
  const r = await db.execute({ sql: 'SELECT * FROM domain_listings WHERE id = ?', args: [id] });
  if (!r.rows[0]) return c.json({ error: '未找到' }, 404);
  const row = rowToObj(r.rows[0]);
  await cacheSet(cacheKey, row, 120);
  return c.json(row);
});

// GET /api/data/domain-listings/:id/detail — enriched view with analytics, owner, price history, similar
app.get('/domain-listings/:id/detail', async (c) => {
  const idParam = c.req.param('id');
  // Resolve by UUID or by name
  const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
  const r = isUUID
    ? await db.execute({ sql: 'SELECT * FROM domain_listings WHERE id = ?', args: [idParam] })
    : await db.execute({ sql: 'SELECT * FROM domain_listings WHERE name = ? COLLATE NOCASE', args: [idParam] });
  if (!r.rows[0]) return c.json({ error: '未找到' }, 404);
  const domain = rowToObj(r.rows[0]);

  const [analyticsRes, priceHistRes, similarRes, ownerRes] = await Promise.all([
    db.execute({ sql: 'SELECT views, favorites, offers FROM domain_analytics WHERE domain_id = ? LIMIT 1', args: [domain.id] }),
    db.execute({ sql: 'SELECT * FROM domain_price_history WHERE domain_id = ? ORDER BY created_at ASC LIMIT 50', args: [domain.id] }),
    db.execute({ sql: "SELECT * FROM domain_listings WHERE status = 'available' AND id != ? LIMIT 6", args: [domain.id] }),
    domain.owner_id
      ? db.execute({ sql: 'SELECT id, username, full_name, avatar_url, bio, seller_rating, seller_verified FROM profiles WHERE id = ? LIMIT 1', args: [domain.owner_id] })
      : Promise.resolve({ rows: [] }),
  ]);

  const analytics = analyticsRes.rows[0] ? rowToObj(analyticsRes.rows[0]) : { views: 0, favorites: 0, offers: 0 };
  const priceHistory = priceHistRes.rows.map(rowToObj);
  const similarDomains = similarRes.rows.map(rowToObj);
  const owner = ownerRes.rows[0] ? rowToObj(ownerRes.rows[0]) : null;

  return c.json({ domain: { ...domain, ...analytics, owner }, priceHistory, similarDomains });
});

// POST /api/data/domain-listings — create a new listing
app.post('/domain-listings', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const body = await c.req.json();
  const { v4: uuidv4 } = await import('uuid');
  const id = uuidv4();
  const t = now();
  // Map API field aliases to actual column names
  const fieldMap: Record<string, string> = { domain_name: 'name' };
  const allowed = ['name', 'domain_name', 'price', 'category', 'description',
    'currency', 'highlight', 'is_verified'];
  const statusVal = (body.status as string | undefined) || 'available';
  const cols = ['id', 'owner_id', 'status', 'created_at'];
  const vals: unknown[] = [id, sub, statusVal, t];
  for (const k of allowed) {
    if (k in body) {
      const col = fieldMap[k] || k;
      if (!cols.includes(col)) {
        cols.push(col);
        const v = body[k];
        vals.push(typeof v === 'object' ? JSON.stringify(v) : v);
      }
    }
  }
  await db.execute({
    sql: `INSERT INTO domain_listings (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
    args: vals
  });
  await invalidateDomainListCache();
  const newRow = rowToObj((await db.execute({ sql: 'SELECT * FROM domain_listings WHERE id = ?', args: [id] })).rows[0]);
  bus.publish({ table: 'domain_listings', eventType: 'INSERT', new: newRow, userId: sub });
  return c.json(newRow, 201);
});

// PATCH /api/data/domain-listings/:id — update a listing (owner or admin only)
app.patch('/domain-listings/:id', requireAuth, async (c) => {
  const { sub, is_admin } = getAuth(c);
  const id = c.req.param('id');
  const check = await db.execute({ sql: 'SELECT owner_id FROM domain_listings WHERE id = ?', args: [id] });
  if (!check.rows[0]) return c.json({ error: '未找到' }, 404);
  if (!is_admin && check.rows[0].owner_id !== sub) return c.json({ error: '无权限' }, 403);
  const body = await c.req.json();
  const allowed = ['name', 'price', 'status', 'description', 'category', 'currency',
    'highlight', 'is_verified', 'verification_status'];
  const updates: string[] = [];
  const args: unknown[] = [];
  for (const k of allowed) {
    if (k in body) {
      updates.push(`${k} = ?`);
      const v = body[k];
      args.push(typeof v === 'object' ? JSON.stringify(v) : v);
    }
  }
  if (updates.length === 0) return c.json({ error: '无可更新字段' }, 400);
  args.push(id);
  await db.execute({ sql: `UPDATE domain_listings SET ${updates.join(', ')} WHERE id = ?`, args });
  await invalidateDomainListCache(id);
  const updated = rowToObj((await db.execute({ sql: 'SELECT * FROM domain_listings WHERE id = ?', args: [id] })).rows[0]);
  bus.publish({ table: 'domain_listings', eventType: 'UPDATE', new: updated, userId: sub });
  return c.json(updated);
});

// DELETE /api/data/domain-listings/:id — remove a listing (owner or admin only)
app.delete('/domain-listings/:id', requireAuth, async (c) => {
  const { sub, is_admin } = getAuth(c);
  const id = c.req.param('id');
  const check = await db.execute({ sql: 'SELECT owner_id FROM domain_listings WHERE id = ?', args: [id] });
  if (!check.rows[0]) return c.json({ error: '未找到' }, 404);
  if (!is_admin && check.rows[0].owner_id !== sub) return c.json({ error: '无权限' }, 403);
  await db.execute({ sql: 'DELETE FROM domain_listings WHERE id = ?', args: [id] });
  await invalidateDomainListCache(id);
  bus.publish({ table: 'domain_listings', eventType: 'DELETE', old: { id }, userId: sub });
  return c.json({ success: true });
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
  const cached = await cacheGet<Record<string, unknown>>('site_settings');
  if (cached) return c.json(cached);
  const r = await db.execute({ sql: 'SELECT key, value FROM site_settings', args: [] });
  const data: Record<string, unknown> = {};
  for (const row of r.rows) {
    data[row.key as string] = parseJson(row.value);
  }
  await cacheSet('site_settings', data, 300); // 5 min cache
  return c.json(data);
});

// ---- Wallet ----
app.get('/wallet', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const r = await db.execute({ sql: 'SELECT * FROM payment_transactions WHERE user_id = ? ORDER BY created_at DESC', args: [sub] });
  return c.json(r.rows.map(rowToObj));
});

// ---- Admin: update site settings ----
app.patch('/site-settings', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const body = await c.req.json();
  let updatedCount = 0;
  for (const [k, v] of Object.entries(body)) {
    const val = typeof v === 'object' ? JSON.stringify(v) : String(v ?? '');
    await db.execute({
      sql: 'UPDATE site_settings SET value = ?, updated_at = ? WHERE key = ?',
      args: [val, now(), k]
    });
    updatedCount++;
  }
  if (updatedCount === 0) return c.json({ error: '无可更新字段' }, 400);
  await cacheDel('site_settings');
  const r = await db.execute({ sql: 'SELECT key, value FROM site_settings', args: [] });
  const fresh: Record<string, unknown> = {};
  for (const row of r.rows) fresh[row.key as string] = parseJson(row.value);
  bus.publish({ table: 'site_settings', eventType: 'UPDATE', new: fresh });
  return c.json(fresh);
});

// ---- Domain Offers ----
app.get('/domain-offers', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const role = c.req.query('role'); // 'buyer' | 'seller' | omit for both
  let sql = 'SELECT do.*, dl.name as domain_name FROM domain_offers do LEFT JOIN domain_listings dl ON do.domain_id = dl.id WHERE ';
  const args: unknown[] = [];
  if (role === 'buyer') {
    sql += 'do.buyer_id = ?';
    args.push(sub);
  } else if (role === 'seller') {
    sql += 'do.seller_id = ?';
    args.push(sub);
  } else {
    sql += '(do.buyer_id = ? OR do.seller_id = ?)';
    args.push(sub, sub);
  }
  sql += ' ORDER BY do.created_at DESC';
  const r = await db.execute({ sql, args });
  return c.json(r.rows.map(rowToObj));
});

app.post('/domain-offers', async (c) => {
  const { v4: uuidv4 } = await import('uuid');
  const body = await c.req.json();
  const { domainId, sellerId, buyerId, amount, email, message, captchaToken } = body;
  if (!domainId || !sellerId || !amount || !email) {
    return c.json({ error: '缺少必要字段' }, 400);
  }
  const id = uuidv4();
  await db.execute({
    sql: `INSERT INTO domain_offers (id, domain_id, buyer_id, seller_id, amount, status, message, contact_email, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
    args: [id, domainId, buyerId || null, sellerId, parseFloat(amount), message || null, email, now(), now()]
  });
  const inserted = await db.execute({ sql: 'SELECT * FROM domain_offers WHERE id = ?', args: [id] });
  return c.json({ success: true, offer: rowToObj(inserted.rows[0]) }, 201);
});

app.patch('/domain-offers/:id', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const offerId = c.req.param('id');
  const body = await c.req.json();
  const allowed = ['status', 'amount', 'message'];
  const updates: string[] = [];
  const args: unknown[] = [];
  for (const k of allowed) {
    if (k in body) {
      updates.push(`${k} = ?`);
      args.push(body[k]);
    }
  }
  if (updates.length === 0) return c.json({ error: '无可更新字段' }, 400);
  updates.push('updated_at = ?');
  args.push(now(), offerId);
  await db.execute({
    sql: `UPDATE domain_offers SET ${updates.join(', ')} WHERE id = ? AND (buyer_id = ? OR seller_id = ?)`,
    args: [...args, sub, sub]
  });
  const r = await db.execute({ sql: 'SELECT * FROM domain_offers WHERE id = ?', args: [offerId] });
  return c.json({ offer: rowToObj(r.rows[0]) });
});

// ---- Favorites ----
app.get('/favorites', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const r = await db.execute({
    sql: 'SELECT uf.*, dl.name as domain_name FROM user_favorites uf LEFT JOIN domain_listings dl ON uf.domain_id = dl.id WHERE uf.user_id = ? ORDER BY uf.created_at DESC',
    args: [sub]
  });
  return c.json(r.rows.map(rowToObj));
});

app.post('/favorites', requireAuth, async (c) => {
  const { v4: uuidv4 } = await import('uuid');
  const { sub } = getAuth(c);
  const { domainId } = await c.req.json();
  if (!domainId) return c.json({ error: '缺少 domainId' }, 400);
  const existing = await db.execute({
    sql: 'SELECT id FROM user_favorites WHERE user_id = ? AND domain_id = ?',
    args: [sub, domainId]
  });
  if (existing.rows[0]) return c.json({ id: existing.rows[0].id, already: true });
  const id = uuidv4();
  await db.execute({
    sql: 'INSERT INTO user_favorites (id, user_id, domain_id, created_at) VALUES (?, ?, ?, ?)',
    args: [id, sub, domainId, now()]
  });
  return c.json({ id }, 201);
});

app.delete('/favorites/:domainId', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const domainId = c.req.param('domainId');
  await db.execute({
    sql: 'DELETE FROM user_favorites WHERE user_id = ? AND domain_id = ?',
    args: [sub, domainId]
  });
  return c.json({ success: true });
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
