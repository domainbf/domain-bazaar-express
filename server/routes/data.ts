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
    : await db.execute({ sql: 'SELECT * FROM domain_listings WHERE LOWER(name) = LOWER(?)', args: [idParam] });
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
  const domainList = r.rows.map(rowToObj);
  if (domainList.length === 0) return c.json([]);
  const ids = domainList.map(d => d.id as string);
  const placeholders = ids.map(() => '?').join(',');
  const analyticsRes = await db.execute({ sql: `SELECT domain_id, views, favorites, offers FROM domain_analytics WHERE domain_id IN (${placeholders})`, args: ids }).catch(() => ({ rows: [] }));
  const analyticsMap = new Map(analyticsRes.rows.map(r => [rowToObj(r).domain_id as string, rowToObj(r)]));
  return c.json(domainList.map(d => ({
    ...d,
    views: (analyticsMap.get(d.id as string) as any)?.views ?? 0,
    favorites: (analyticsMap.get(d.id as string) as any)?.favorites ?? 0,
    offers: (analyticsMap.get(d.id as string) as any)?.offers ?? 0,
  })));
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

// ---- Admin: full site settings (with all columns) ----
app.get('/admin/site-settings', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const r = await db.execute({ sql: 'SELECT * FROM site_settings ORDER BY section, key', args: [] });
  return c.json(r.rows.map(rowToObj));
});

// ---- Admin: create new site setting ----
app.post('/admin/site-settings', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const { key, value, description, section, type } = await c.req.json();
  if (!key) return c.json({ error: '缺少key字段' }, 400);
  const id = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO site_settings (id, key, value, description, section, type, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET value=excluded.value, description=excluded.description, section=excluded.section, type=excluded.type, updated_at=excluded.updated_at`,
    args: [id, key, value ?? '', description ?? '', section ?? 'general', type ?? 'text', now(), now()]
  });
  await cacheDel('site_settings');
  const r = await db.execute({ sql: 'SELECT * FROM site_settings WHERE key = ?', args: [key] });
  return c.json(rowToObj(r.rows[0]));
});

// ---- Admin: delete site setting by key ----
app.delete('/admin/site-settings/:key', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const key = c.req.param('key');
  await db.execute({ sql: 'DELETE FROM site_settings WHERE key = ?', args: [key] });
  await cacheDel('site_settings');
  return c.json({ ok: true });
});

// ---- Admin: update site settings (upsert by key) ----
app.patch('/site-settings', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const body = await c.req.json();
  let updatedCount = 0;
  for (const [k, v] of Object.entries(body)) {
    const val = typeof v === 'object' ? JSON.stringify(v) : String(v ?? '');
    await db.execute({
      sql: `INSERT INTO site_settings (key, value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      args: [k, val, now()]
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

// ---- Profiles ----
app.get('/profiles/:id', async (c) => {
  const profileId = c.req.param('id');
  // Try custom_url first, then id
  let profileRow: Record<string, unknown> | null = null;
  const byUrl = await db.execute({ sql: 'SELECT * FROM profiles WHERE custom_url = ? LIMIT 1', args: [profileId] });
  if (byUrl.rows.length > 0) {
    profileRow = rowToObj(byUrl.rows[0]);
  } else {
    const byId = await db.execute({ sql: 'SELECT * FROM profiles WHERE id = ? LIMIT 1', args: [profileId] });
    if (byId.rows.length > 0) profileRow = rowToObj(byId.rows[0]);
  }
  if (!profileRow) return c.json({ error: '用户不存在' }, 404);
  const ownerId = profileRow.id as string;
  // Fetch domains
  const domainsRes = await db.execute({ sql: "SELECT * FROM domain_listings WHERE owner_id = ? AND status = 'available' ORDER BY created_at DESC", args: [ownerId] });
  const domains = domainsRes.rows.map(rowToObj);
  // Fetch analytics for total views
  let totalViews = 0;
  if (domains.length > 0) {
    const ids = domains.map((d) => d.id as string);
    const placeholders = ids.map(() => '?').join(',');
    const analyticsRes = await db.execute({ sql: `SELECT views FROM domain_analytics WHERE domain_id IN (${placeholders})`, args: ids });
    totalViews = analyticsRes.rows.reduce((sum, r) => sum + (Number(r.views) || 0), 0);
  }
  // Completed transactions as seller
  const txRes = await db.execute({ sql: "SELECT COUNT(*) as cnt FROM transactions WHERE seller_id = ? AND status = 'completed'", args: [ownerId] });
  const completedDeals = Number((rowToObj(txRes.rows[0]) as any).cnt) || 0;
  return c.json({ profile: profileRow, domains, stats: { totalListings: domains.length, totalViews, completedDeals } });
});

// ---- Messages: mark read ----
app.patch('/messages/:id/read', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  await db.execute({ sql: 'UPDATE messages SET is_read = 1 WHERE id = ? AND receiver_id = ?', args: [c.req.param('id'), sub] });
  return c.json({ success: true });
});

// ---- Messages: send ----
app.post('/messages', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const body = await c.req.json();
  const { receiver_id, content, domain_id, offer_id, transaction_id } = body;
  if (!receiver_id || !content?.trim()) return c.json({ error: '缺少必要参数' }, 400);
  const id = uuidv4();
  await db.execute({
    sql: 'INSERT INTO messages (id, sender_id, receiver_id, content, is_read, domain_id, offer_id, transaction_id, created_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)',
    args: [id, sub, receiver_id, content.trim(), domain_id ?? null, offer_id ?? null, transaction_id ?? null, now()]
  });
  // Create notification for receiver
  try {
    const notifId = uuidv4();
    await db.execute({
      sql: 'INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)',
      args: [notifId, receiver_id, 'new_message', '新消息', `您收到一条新消息`, now()]
    });
  } catch { /* ignore notification errors */ }
  bus.publish({ type: 'db-change', table: 'messages', event: 'INSERT', new: { id, sender_id: sub, receiver_id } });
  return c.json({ id }, 201);
});

// ---- Transactions: create ----
app.post('/transactions', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const body = await c.req.json();
  const { buyer_id, domain_id, offer_id, amount, payment_method = 'bank_transfer' } = body;
  if (!domain_id || !amount) return c.json({ error: '缺少必要参数' }, 400);
  // Fetch commission rate from site_settings
  let commissionRate = 0.05;
  try {
    const settingRes = await db.execute({ sql: "SELECT value FROM site_settings WHERE key = 'commission_rate' LIMIT 1", args: [] });
    if (settingRes.rows.length > 0) commissionRate = parseFloat((rowToObj(settingRes.rows[0]) as any).value) || 0.05;
  } catch { /* use default */ }
  const numAmount = Number(amount);
  const commissionAmount = Math.max(numAmount * commissionRate, 10);
  const sellerAmount = numAmount - commissionAmount;
  const id = uuidv4();
  await db.execute({
    sql: 'INSERT INTO transactions (id, buyer_id, seller_id, domain_id, offer_id, amount, commission_rate, commission_amount, seller_amount, payment_method, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [id, buyer_id ?? null, sub, domain_id, offer_id ?? null, numAmount, commissionRate, commissionAmount, sellerAmount, payment_method, 'payment_pending', now(), now()]
  });
  // Update offer with transaction_id
  if (offer_id) {
    await db.execute({ sql: 'UPDATE domain_offers SET transaction_id = ? WHERE id = ?', args: [id, offer_id] });
  }
  // Update domain_listings status to pending
  if (body.listing_id) {
    await db.execute({ sql: "UPDATE domain_listings SET status = 'pending', updated_at = ? WHERE id = ?", args: [now(), body.listing_id] });
  }
  // Notification to buyer
  if (buyer_id && body.notify_message) {
    try {
      const notifId = uuidv4();
      await db.execute({
        sql: 'INSERT INTO notifications (id, user_id, type, title, message, is_read, data, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)',
        args: [notifId, buyer_id, 'offer_accepted', body.notify_title || '报价已接受', body.notify_message, JSON.stringify({ transaction_id: id, offer_id }), now()]
      });
    } catch { /* ignore */ }
  }
  bus.publish({ type: 'db-change', table: 'transactions', event: 'INSERT', new: { id, buyer_id, seller_id: sub } });
  return c.json({ id, commission_rate: commissionRate, commission_amount: commissionAmount, seller_amount: sellerAmount }, 201);
});

// ---- Transactions: single ----
app.get('/transactions/:id', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const txId = c.req.param('id');
  const txRes = await db.execute({ sql: 'SELECT * FROM transactions WHERE id = ? AND (buyer_id = ? OR seller_id = ?)', args: [txId, sub, sub] });
  if (txRes.rows.length === 0) return c.json({ error: '交易不存在或无权访问' }, 404);
  const tx = rowToObj(txRes.rows[0]);
  // Domain info (try domain_listings, fallback to domains table)
  let domain: Record<string, unknown> | null = null;
  try {
    const dlRes = await db.execute({ sql: 'SELECT id, name, price, currency FROM domain_listings WHERE id = ? LIMIT 1', args: [tx.domain_id] });
    if (dlRes.rows.length > 0) domain = rowToObj(dlRes.rows[0]);
    else {
      const dRes = await db.execute({ sql: 'SELECT id, name, price FROM domains WHERE id = ? LIMIT 1', args: [tx.domain_id] });
      if (dRes.rows.length > 0) domain = rowToObj(dRes.rows[0]);
    }
  } catch { /* ignore */ }
  // Escrow info
  let escrow: Record<string, unknown> | null = null;
  try {
    const esRes = await db.execute({ sql: 'SELECT * FROM escrow_services WHERE transaction_id = ? LIMIT 1', args: [txId] });
    if (esRes.rows.length > 0) escrow = rowToObj(esRes.rows[0]);
  } catch { /* ignore */ }
  // Buyer/Seller profiles
  const profileIds = [tx.buyer_id, tx.seller_id].filter(Boolean) as string[];
  let profiles: Record<string, unknown>[] = [];
  if (profileIds.length > 0) {
    const placeholders = profileIds.map(() => '?').join(',');
    const pRes = await db.execute({ sql: `SELECT id, full_name, username, avatar_url FROM profiles WHERE id IN (${placeholders})`, args: profileIds });
    profiles = pRes.rows.map(rowToObj);
  }
  const buyer = profiles.find(p => p.id === tx.buyer_id) || null;
  const seller = profiles.find(p => p.id === tx.seller_id) || null;
  return c.json({ transaction: tx, domain, escrow, buyer, seller });
});

// ---- Transactions: update ----
app.patch('/transactions/:id', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const txId = c.req.param('id');
  const body = await c.req.json();
  const txRes = await db.execute({ sql: 'SELECT * FROM transactions WHERE id = ? AND (buyer_id = ? OR seller_id = ?)', args: [txId, sub, sub] });
  if (txRes.rows.length === 0) return c.json({ error: '无权访问' }, 403);
  const tx = rowToObj(txRes.rows[0]);
  const allowed = ['status', 'transfer_confirmed_seller', 'transfer_confirmed_buyer', 'seller_confirmed_at', 'buyer_confirmed_at', 'completed_at', 'notes'];
  const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
  updates['updated_at'] = now();
  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  await db.execute({ sql: `UPDATE transactions SET ${setClauses} WHERE id = ?`, args: [...Object.values(updates), txId] });
  // If domain status needs updating (completed → sold)
  if (body.domain_name && body.domain_status) {
    await db.execute({ sql: 'UPDATE domain_listings SET status = ?, updated_at = ? WHERE name = ?', args: [body.domain_status, now(), body.domain_name] });
  }
  // Update profile total_sales if completed
  if (body.status === 'completed' && tx.seller_id) {
    await db.execute({ sql: 'UPDATE profiles SET total_sales = total_sales + 1 WHERE id = ?', args: [tx.seller_id] });
  }
  // Escrow update if provided
  if (body.escrow_update && body.escrow_id) {
    const escrowAllowed = ['status', 'domain_transferred_at', 'buyer_approved_at', 'released_at', 'funded_at'];
    const escrowUpdates = Object.fromEntries(Object.entries(body.escrow_update).filter(([k]) => escrowAllowed.includes(k)));
    if (Object.keys(escrowUpdates).length > 0) {
      const escrowSet = Object.keys(escrowUpdates).map(k => `${k} = ?`).join(', ');
      await db.execute({ sql: `UPDATE escrow_services SET ${escrowSet} WHERE id = ?`, args: [...Object.values(escrowUpdates), body.escrow_id] });
    }
  }
  // Notification
  if (body.notify_user_id && body.notify_title && body.notify_message) {
    try {
      const notifId = uuidv4();
      await db.execute({
        sql: 'INSERT INTO notifications (id, user_id, type, title, message, is_read, data, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)',
        args: [notifId, body.notify_user_id, body.notify_type || 'transaction', body.notify_title, body.notify_message, JSON.stringify({ transaction_id: txId }), now()]
      });
    } catch { /* ignore */ }
  }
  return c.json({ success: true });
});

// ---- Disputes ----
app.post('/disputes', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const body = await c.req.json();
  const { transaction_id, respondent_id, reason, description } = body;
  if (!transaction_id || !reason) return c.json({ error: '缺少必要参数' }, 400);
  const id = uuidv4();
  await db.execute({
    sql: 'INSERT INTO disputes (id, transaction_id, initiator_id, respondent_id, reason, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [id, transaction_id, sub, respondent_id ?? null, reason, description ?? null, 'open', now()]
  });
  // Update transaction status
  await db.execute({ sql: "UPDATE transactions SET status = 'disputed', updated_at = ? WHERE id = ?", args: [now(), transaction_id] });
  return c.json({ id }, 201);
});

// ---- Admin Stats ----
// GET /api/data/admin/domain-listings — all listings (admin only) with analytics + owner
app.get('/admin/domain-listings', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const r = await db.execute({ sql: 'SELECT * FROM domain_listings ORDER BY created_at DESC', args: [] });
  const listings = r.rows.map(rowToObj);
  if (listings.length === 0) return c.json([]);
  const ids = listings.map(d => d.id as string);
  const placeholders = ids.map(() => '?').join(',');
  const [analyticsRes, profileIdsRes] = await Promise.all([
    db.execute({ sql: `SELECT domain_id, views, favorites, offers FROM domain_analytics WHERE domain_id IN (${placeholders})`, args: ids }).catch(() => ({ rows: [] })),
    Promise.resolve(null)
  ]);
  const analyticsMap = new Map((analyticsRes as any).rows.map((r: any) => { const o = rowToObj(r); return [o.domain_id as string, o]; }));
  const ownerIds = [...new Set(listings.map(d => d.owner_id as string).filter(Boolean))];
  let profilesMap: Map<string, any> = new Map();
  if (ownerIds.length > 0) {
    const pp = ownerIds.map(() => '?').join(',');
    const pRes = await db.execute({ sql: `SELECT id, full_name, username, avatar_url FROM profiles WHERE id IN (${pp})`, args: ownerIds });
    profilesMap = new Map(pRes.rows.map(r => { const o = rowToObj(r); return [o.id as string, o]; }));
  }
  const result = listings.map(d => ({
    ...d,
    views: (analyticsMap.get(d.id as string) as any)?.views ?? 0,
    favorites: (analyticsMap.get(d.id as string) as any)?.favorites ?? 0,
    offers: (analyticsMap.get(d.id as string) as any)?.offers ?? 0,
    ownerName: (profilesMap.get(d.owner_id as string) as any)?.full_name ?? (profilesMap.get(d.owner_id as string) as any)?.username ?? '未知',
    ownerEmail: '',
  }));
  return c.json(result);
});

app.get('/admin/stats', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();
  const [users, domains, transactions, analytics, offers, verifications, disputes, tickets] = await Promise.all([
    db.execute('SELECT id, created_at FROM profiles'),
    db.execute("SELECT id, status, price, created_at, verification_status FROM domain_listings"),
    db.execute('SELECT id, status, amount, created_at FROM transactions'),
    db.execute('SELECT views, favorites, offers FROM domain_analytics'),
    db.execute('SELECT id, status, amount, created_at FROM domain_offers'),
    db.execute('SELECT id, status FROM domain_verifications').catch(() => ({ rows: [] })),
    db.execute("SELECT id, status FROM disputes WHERE status = 'open'").catch(() => ({ rows: [] })),
    db.execute("SELECT id, status FROM support_tickets WHERE status = 'open'").catch(() => ({ rows: [] }))
  ]);
  const usersData = users.rows.map(rowToObj);
  const domainsData = domains.rows.map(rowToObj);
  const txData = transactions.rows.map(rowToObj);
  const analyticsData = analytics.rows.map(rowToObj);
  const offersData = offers.rows.map(rowToObj);
  const verificationsData = (verifications as any).rows.map(rowToObj);
  const openDisputes = (disputes as any).rows.length;
  const openTickets = (tickets as any).rows.length;
  const newUsersToday = usersData.filter(u => (u.created_at as string) >= todayStr).length;
  const newDomainsToday = domainsData.filter(d => (d.created_at as string) >= todayStr).length;
  const activeListings = domainsData.filter(d => d.status === 'available').length;
  const completedTransactions = txData.filter(t => t.status === 'completed').length;
  const totalRevenue = txData.filter(t => t.status === 'completed').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalViews = analyticsData.reduce((sum, a) => sum + (Number(a.views) || 0), 0);
  const totalOffers = offersData.length;
  const pendingOffers = offersData.filter(o => o.status === 'pending').length;
  const verifiedDomains = domainsData.filter(d => d.verification_status === 'verified').length;
  const pendingVerifications = verificationsData.filter((v: any) => v.status === 'pending').length;
  return c.json({
    totalUsers: usersData.length,
    totalDomains: domainsData.length,
    pendingVerifications,
    completedTransactions,
    totalRevenue,
    activeListings,
    newUsersToday,
    newDomainsToday,
    totalViews,
    totalOffers,
    pendingOffers,
    verifiedDomains,
    openDisputes,
    openTickets,
    recentOffers: offersData.slice(-5).reverse()
  });
});

// ---- Admin: domain view increment ----
app.post('/domain-views/:id', async (c) => {
  const id = c.req.param('id');
  await db.execute({
    sql: 'UPDATE domain_analytics SET views = views + 1 WHERE domain_id = ?',
    args: [id]
  }).catch(() => {});
  return c.json({ ok: true });
});

// ---- Public: contact form email ----
app.post('/contact-email', async (c) => {
  const { to, subject, html, from_name, from_email } = await c.req.json();
  if (!to || !subject || !html) return c.json({ error: '参数不完整' }, 400);
  try {
    const settingsRow = await db.execute({ sql: "SELECT key, value FROM site_settings WHERE key IN ('smtp_password','smtp_from_email','smtp_from_name')", args: [] });
    const sm: Record<string, string> = {};
    for (const row of settingsRow.rows) sm[row.key as string] = row.value as string;
    const apiKey = sm['smtp_password'] || '';
    const fromEmail = from_email || sm['smtp_from_email'] || 'noreply@nic.rw';
    const fromName = from_name || sm['smtp_from_name'] || '域见·你';
    if (!apiKey) return c.json({ ok: true, warn: '未配置邮件服务' });
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `${fromName} <${fromEmail}>`, to: [to], subject, html }),
    });
    if (!res.ok) { const err = await res.text(); console.error('[contact-email]', err); }
    return c.json({ ok: true });
  } catch (e: any) {
    console.error('[contact-email]', e.message);
    return c.json({ ok: true, warn: e.message });
  }
});

// ---- Admin: send test email ----
app.post('/admin/send-test-email', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const { to, smtp: smtpForm } = await c.req.json();
  if (!to) return c.json({ error: '缺少收件人' }, 400);
  try {
    const settingsRow = await db.execute({ sql: "SELECT key, value FROM site_settings WHERE key IN ('smtp_password','smtp_from_email','smtp_from_name')", args: [] });
    const sm: Record<string, string> = {};
    for (const row of settingsRow.rows) sm[row.key as string] = row.value as string;
    const apiKey = smtpForm?.password || sm['smtp_password'] || '';
    const fromEmail = smtpForm?.from_email || sm['smtp_from_email'] || 'noreply@nic.rw';
    const fromName = smtpForm?.from_name || sm['smtp_from_name'] || '域见·你';
    if (!apiKey) return c.json({ success: false, error: '未配置 Resend API Key' });
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject: `【${fromName}】SMTP 邮件系统测试`,
        html: `<div style="font-family:sans-serif;padding:32px"><h2>✅ SMTP 邮件系统正常</h2><p>配置验证成功</p><p><strong>发件人：</strong>${fromName} &lt;${fromEmail}&gt;</p><p><strong>收件人：</strong>${to}</p><p><strong>时间：</strong>${new Date().toLocaleString('zh-CN')}</p></div>`,
      }),
    });
    if (!res.ok) { const err = await res.text(); return c.json({ success: false, error: err }); }
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message });
  }
});

// ---- Admin: WHOIS test ----
app.post('/admin/whois-test', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const { domain } = await c.req.json();
  if (!domain) return c.json({ error: '缺少domain' }, 400);
  try {
    const settingsRow = await db.execute({ sql: "SELECT value FROM site_settings WHERE key = 'whois_api_key' LIMIT 1", args: [] });
    const apiKey = settingsRow.rows[0]?.value as string || '';
    const rdap = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, { headers: { 'Accept': 'application/json' } });
    if (!rdap.ok) return c.json({ success: false, error: 'RDAP 查询失败' });
    const data = await rdap.json() as Record<string, unknown>;
    const events = (data.events as any[]) || [];
    const created = events.find((e: any) => e.eventAction === 'registration')?.eventDate || '';
    const registrar = ((data.entities as any[])?.[0]?.vcardArray?.[1] || []).find((v: any[]) => v[0] === 'fn')?.[3] || '未知';
    return c.json({ success: true, data: { registrar, createdDate: created, rdap: true, apiKey: apiKey ? '已配置' : '未配置' } });
  } catch (e: any) {
    return c.json({ success: false, error: e.message });
  }
});

app.post('/admin/change-password', requireAuth, async (c) => {
  const { sub, is_admin } = getAuth(c);
  const body = await c.req.json();
  const { new_password, target_email } = body;
  const bcrypt = await import('bcryptjs');
  if (target_email && is_admin) {
    // Admin changes another user's password
    const hash = await bcrypt.hash(new_password, 12);
    await db.execute({ sql: 'UPDATE app_auth_users SET password_hash = ?, updated_at = ? WHERE email = ?', args: [hash, now(), target_email] });
    return c.json({ success: true });
  }
  // Change own password
  if (!new_password || new_password.length < 8) return c.json({ error: '密码至少8位' }, 400);
  const hash = await bcrypt.hash(new_password, 12);
  await db.execute({ sql: 'UPDATE app_auth_users SET password_hash = ?, updated_at = ? WHERE id = ?', args: [hash, now(), sub] });
  return c.json({ success: true });
});

// ---- Admin: delete message ----
app.delete('/messages/:id', requireAuth, async (c) => {
  const { sub, is_admin } = getAuth(c);
  const id = c.req.param('id');
  const r = await db.execute({ sql: 'SELECT sender_id, receiver_id FROM messages WHERE id = ?', args: [id] });
  if (!r.rows[0]) return c.json({ error: '未找到' }, 404);
  const msg = rowToObj(r.rows[0]);
  if (!is_admin && msg.sender_id !== sub && msg.receiver_id !== sub) return c.json({ error: '无权限' }, 403);
  await db.execute({ sql: 'DELETE FROM messages WHERE id = ?', args: [id] });
  return c.json({ success: true });
});

// ---- Admin: delete notification ----
app.delete('/notifications/:id', requireAuth, async (c) => {
  const { sub, is_admin } = getAuth(c);
  const id = c.req.param('id');
  if (is_admin) {
    await db.execute({ sql: 'DELETE FROM notifications WHERE id = ?', args: [id] });
  } else {
    await db.execute({ sql: 'DELETE FROM notifications WHERE id = ? AND user_id = ?', args: [id, sub] });
  }
  return c.json({ success: true });
});

// ---- Admin: send notifications ----
app.post('/admin/notifications', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const body = await c.req.json();
  const { notifications } = body;
  if (!Array.isArray(notifications) || notifications.length === 0) return c.json({ error: '无通知数据' }, 400);
  const { v4: uuidv4 } = await import('uuid');
  let count = 0;
  for (const n of notifications) {
    const id = uuidv4();
    try {
      await db.execute({
        sql: 'INSERT INTO notifications (id, user_id, title, message, type, action_url, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
        args: [id, n.user_id, n.title, n.message, n.type ?? 'system', n.action_url ?? null, now()]
      });
      count++;
    } catch { /* skip duplicates */ }
  }
  bus.publish({ table: 'notifications', eventType: 'INSERT', new: { count }, userId: null });
  return c.json({ success: true, count });
});

// ---- Admin: user reviews ----
app.get('/admin/user-reviews', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const r = await db.execute({ sql: 'SELECT * FROM user_reviews ORDER BY created_at DESC', args: [] });
  return c.json(r.rows.map(rowToObj));
});

app.patch('/admin/user-reviews/:id', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const id = c.req.param('id');
  const body = await c.req.json();
  const updates: string[] = [];
  const args: unknown[] = [];
  if ('is_visible' in body) { updates.push('is_visible = ?'); args.push(body.is_visible); }
  if (updates.length === 0) return c.json({ error: '无可更新字段' }, 400);
  args.push(id);
  await db.execute({ sql: `UPDATE user_reviews SET ${updates.join(', ')} WHERE id = ?`, args });
  return c.json({ success: true });
});

app.delete('/admin/user-reviews/:id', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  await db.execute({ sql: 'DELETE FROM user_reviews WHERE id = ?', args: [c.req.param('id')] });
  return c.json({ success: true });
});

// ---- Admin: support tickets ----
app.get('/admin/support-tickets', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const r = await db.execute({ sql: 'SELECT * FROM support_tickets ORDER BY updated_at DESC', args: [] });
  return c.json(r.rows.map(rowToObj));
});

app.patch('/admin/support-tickets/:id', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const id = c.req.param('id');
  const body = await c.req.json();
  const updates: string[] = [];
  const args: unknown[] = [];
  if ('status' in body) { updates.push('status = ?'); args.push(body.status); }
  updates.push('updated_at = ?'); args.push(now());
  args.push(id);
  await db.execute({ sql: `UPDATE support_tickets SET ${updates.join(', ')} WHERE id = ?`, args });
  return c.json({ success: true });
});

app.post('/admin/ticket-replies', requireAuth, async (c) => {
  const { sub, is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const body = await c.req.json();
  const { ticket_id, message } = body;
  if (!ticket_id || !message) return c.json({ error: '缺少必要字段' }, 400);
  const { v4: uuidv4 } = await import('uuid');
  const id = uuidv4();
  await db.execute({
    sql: 'INSERT INTO ticket_replies (id, ticket_id, user_id, message, is_admin_reply, created_at) VALUES (?, ?, ?, ?, 1, ?)',
    args: [id, ticket_id, sub, message, now()]
  });
  if (body.auto_close) {
    await db.execute({ sql: "UPDATE support_tickets SET status = 'resolved', updated_at = ? WHERE id = ?", args: [now(), ticket_id] });
  }
  return c.json({ success: true, id });
});

// ---- Admin: delete domain offer ----
app.delete('/domain-offers/:id', requireAuth, async (c) => {
  const { sub, is_admin } = getAuth(c);
  const id = c.req.param('id');
  const r = await db.execute({ sql: 'SELECT buyer_id, seller_id FROM domain_offers WHERE id = ?', args: [id] });
  if (!r.rows[0]) return c.json({ error: '未找到' }, 404);
  const offer = rowToObj(r.rows[0]);
  if (!is_admin && offer.buyer_id !== sub && offer.seller_id !== sub) return c.json({ error: '无权限' }, 403);
  await db.execute({ sql: 'DELETE FROM domain_offers WHERE id = ?', args: [id] });
  return c.json({ success: true });
});

// ---- Admin: get/update users ----
app.get('/admin/users', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const r = await db.execute({
    sql: `SELECT p.*, u.email, u.is_verified, u.created_at as auth_created_at,
      (SELECT role FROM admin_roles WHERE user_id = p.id LIMIT 1) as admin_role
      FROM profiles p
      LEFT JOIN app_auth_users u ON p.id = u.id
      ORDER BY p.created_at DESC`,
    args: []
  });
  return c.json(r.rows.map(rowToObj));
});

export default app;
