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

async function queryTable(table: string, where?: string, args?: unknown[]) {
  const sql = where
    ? `SELECT * FROM ${table} WHERE ${where}`
    : `SELECT * FROM ${table}`;
  const r = await db.execute({ sql, args: args || [] });
  return r.rows.map(rowToObj);
}

async function invalidateDomainListCache(id?: string) {
  const redis = (await import('../redis.js')).redis;
  const keys = await redis.keys('domain_listings:*');
  for (const k of keys) await redis.del(k);
  if (id) await cacheDel(`domain_listing:${id}`);
}

// ---------- Shared email utility ----------
async function sendEmail(to: string | string[], subject: string, html: string): Promise<void> {
  const r = await db.execute("SELECT key, value FROM site_settings WHERE key IN ('resend_api_key','smtp_from_email','smtp_from_name','smtp_password')");
  const settings: Record<string, string> = {};
  for (const row of r.rows) settings[row.key as string] = row.value as string;
  const apiKey = settings.resend_api_key || settings.smtp_password || '';
  if (!apiKey) return;
  const fromEmail = settings.smtp_from_email || 'noreply@nic.rw';
  const fromName = settings.smtp_from_name || '域见·你';
  const recipients = Array.isArray(to) ? to : [to];
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `${fromName} <${fromEmail}>`, to: recipients, subject, html }),
  }).catch(() => {});
}

// ---- Domain Listings ----
app.get('/domain-listings', async (c) => {
  const status = c.req.query('status');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  const search = c.req.query('search') || '';
  const category = c.req.query('category') || '';

  const cacheKey = `domain_listings:${status}:${search}:${category}:${limit}:${offset}`;
  const cached = await cacheGet<unknown[]>(cacheKey);
  if (cached) return c.json(cached);

  const conditions: string[] = [];
  const args: unknown[] = [];

  if (status) { conditions.push('status = ?'); args.push(status); }
  if (search) { conditions.push("(name LIKE ? OR description LIKE ?)"); args.push(`%${search}%`, `%${search}%`); }
  if (category) { conditions.push('category = ?'); args.push(category); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT * FROM domain_listings ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  args.push(limit, offset);

  const r = await db.execute({ sql, args });
  const rows = r.rows.map(rowToObj);
  await cacheSet(cacheKey, rows, 60);
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

app.get('/domain-listings/:id/detail', async (c) => {
  const idParam = c.req.param('id');
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

app.post('/domain-listings', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const body = await c.req.json();
  const { v4: uuidv4 } = await import('uuid');
  const id = uuidv4();
  const t = now();
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

// ---- User Profile by ID ----
app.get('/profiles/:id', async (c) => {
  const id = c.req.param('id');
  const r = await db.execute({
    sql: 'SELECT id, username, full_name, avatar_url, bio, company_name, seller_rating, seller_verified, is_seller FROM profiles WHERE id = ? LIMIT 1',
    args: [id]
  });
  if (!r.rows[0]) return c.json({ error: '未找到' }, 404);
  return c.json(rowToObj(r.rows[0]));
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

app.post('/messages', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const { v4: uuidv4 } = await import('uuid');
  const body = await c.req.json();
  const { receiver_id, content, domain_id, offer_id } = body;
  if (!receiver_id || !content) return c.json({ error: '缺少必要字段' }, 400);
  const id = uuidv4();
  const t = now();
  await db.execute({
    sql: 'INSERT INTO messages (id, sender_id, receiver_id, content, domain_id, offer_id, is_read, created_at) VALUES (?,?,?,?,?,?,0,?)',
    args: [id, sub, receiver_id, content, domain_id || null, offer_id || null, t]
  });
  const inserted = rowToObj((await db.execute({ sql: 'SELECT * FROM messages WHERE id = ?', args: [id] })).rows[0]);
  bus.publish({ table: 'messages', eventType: 'INSERT', new: inserted, userId: sub });
  return c.json(inserted, 201);
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

app.post('/transactions', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const { v4: uuidv4 } = await import('uuid');
  const body = await c.req.json();
  const { domain_id, seller_id, amount, offer_id, payment_method, notes, listing_id } = body;
  const resolvedDomainId = domain_id || listing_id;
  if (!resolvedDomainId || !seller_id || !amount) return c.json({ error: '缺少必要字段' }, 400);
  const id = uuidv4();
  const t = now();
  await db.execute({
    sql: `INSERT INTO transactions (id, domain_id, buyer_id, seller_id, amount, status, offer_id, payment_method, notes, created_at, updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    args: [id, resolvedDomainId, sub, seller_id, parseFloat(amount), 'pending', offer_id || null, payment_method || null, notes || null, t, t]
  });
  const inserted = rowToObj((await db.execute({ sql: 'SELECT * FROM transactions WHERE id = ?', args: [id] })).rows[0]);
  bus.publish({ table: 'transactions', eventType: 'INSERT', new: inserted, userId: sub });
  return c.json(inserted, 201);
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
  await cacheSet('site_settings', data, 300);
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
  // Support both flat key-value and nested { updates: {...} } format
  const entries = body.updates ? Object.entries(body.updates) : Object.entries(body);
  let updatedCount = 0;
  for (const [k, v] of entries) {
    const val = typeof v === 'object' ? JSON.stringify(v) : String(v ?? '');
    const existing = await db.execute({ sql: 'SELECT key FROM site_settings WHERE key = ?', args: [k] });
    if (existing.rows[0]) {
      await db.execute({ sql: 'UPDATE site_settings SET value = ?, updated_at = ? WHERE key = ?', args: [val, now(), k] });
    } else {
      await db.execute({ sql: 'INSERT INTO site_settings (key, value, updated_at) VALUES (?,?,?)', args: [k, val, now()] });
    }
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
  const role = c.req.query('role');
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
  // Accept both camelCase and snake_case field names
  const domainId = body.domain_id || body.domainId;
  const sellerId = body.seller_id || body.sellerId;
  const buyerId = body.buyer_id || body.buyerId || null;
  const amount = body.amount;
  const email = body.contact_email || body.email;
  const message = body.message || null;

  if (!domainId || !sellerId || !amount || !email) {
    return c.json({ error: '缺少必要字段' }, 400);
  }
  const id = uuidv4();
  const t = now();
  await db.execute({
    sql: `INSERT INTO domain_offers (id, domain_id, buyer_id, seller_id, amount, status, message, contact_email, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
    args: [id, domainId, buyerId, sellerId, parseFloat(amount), message, email, t, t]
  });
  const inserted = rowToObj((await db.execute({ sql: 'SELECT * FROM domain_offers WHERE id = ?', args: [id] })).rows[0]);

  // Send email notifications
  const domainRes = await db.execute({ sql: 'SELECT name FROM domain_listings WHERE id = ? LIMIT 1', args: [domainId] });
  const domainName = domainRes.rows[0]?.name as string || domainId;
  const sellerRes = await db.execute({ sql: 'SELECT email FROM app_auth_users WHERE id = ? LIMIT 1', args: [sellerId] });
  const sellerEmail = sellerRes.rows[0]?.email as string;

  const notifyHtml = `<h2>您的域名 ${domainName} 收到新报价</h2>
    <p>报价金额：<strong>${amount}</strong></p>
    <p>联系邮箱：${email}</p>
    ${message ? `<p>留言：${message}</p>` : ''}
    <p>请登录管理后台处理此报价。</p>`;

  if (sellerEmail) sendEmail(sellerEmail, `域名 ${domainName} 收到新报价`, notifyHtml).catch(() => {});
  sendEmail(email, `您对 ${domainName} 的报价已提交`, `<h2>您的报价已成功提交</h2><p>域名：${domainName}</p><p>报价金额：${amount}</p><p>卖家将尽快与您联系。</p>`).catch(() => {});

  return c.json({ success: true, offer: inserted }, 201);
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
  if (!r.rows[0]) return c.json({ error: '未找到' }, 404);
  const offer = rowToObj(r.rows[0]);

  // Email notification on status change
  if (body.status) {
    const domainRes = await db.execute({ sql: 'SELECT name FROM domain_listings WHERE id = ? LIMIT 1', args: [offer.domain_id] });
    const domainName = domainRes.rows[0]?.name as string || String(offer.domain_id);
    if (body.status === 'accepted') {
      const buyerRes = await db.execute({ sql: 'SELECT email FROM app_auth_users WHERE id = ? LIMIT 1', args: [offer.buyer_id] });
      const buyerEmail = (buyerRes.rows[0]?.email as string) || (offer.contact_email as string);
      if (buyerEmail) sendEmail(buyerEmail, `您对 ${domainName} 的报价已被接受！`, `<h2>恭喜！您的报价已被接受</h2><p>域名：${domainName}</p><p>成交价：${offer.amount}</p><p>请联系卖家完成付款流程。</p>`).catch(() => {});
    } else if (body.status === 'countered' && body.message) {
      const buyerRes = await db.execute({ sql: 'SELECT email FROM app_auth_users WHERE id = ? LIMIT 1', args: [offer.buyer_id] });
      const buyerEmail = (buyerRes.rows[0]?.email as string) || (offer.contact_email as string);
      if (buyerEmail) sendEmail(buyerEmail, `域名 ${domainName} 卖家发来还价`, `<h2>卖家对您的报价作出回应</h2><p>域名：${domainName}</p><p>还价金额：${body.amount || offer.amount}</p><p>留言：${body.message}</p>`).catch(() => {});
    }
  }

  return c.json({ offer });
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
  const body = await c.req.json();
  // Accept both domain_id (frontend) and domainId (legacy)
  const domainId = body.domain_id || body.domainId;
  if (!domainId) return c.json({ error: '缺少 domain_id' }, 400);
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

// ---- Contact Email ----
app.post('/contact-email', async (c) => {
  const body = await c.req.json();
  const { name, email, subject, message } = body;
  if (!email || !message) return c.json({ error: '缺少必要字段' }, 400);
  const settingsRes = await db.execute({ sql: "SELECT value FROM site_settings WHERE key = 'contact_email' LIMIT 1", args: [] });
  const contactEmail = (settingsRes.rows[0]?.value as string) || 'domain@nic.rw';
  const html = `<h2>新联系消息</h2>
    <p><strong>发件人：</strong>${name || '匿名'} &lt;${email}&gt;</p>
    <p><strong>主题：</strong>${subject || '无'}</p>
    <p><strong>内容：</strong></p><p>${message}</p>`;
  await sendEmail(contactEmail, `联系消息：${subject || '无主题'}`, html).catch(() => {});
  return c.json({ success: true });
});

// ---- Disputes ----
app.post('/disputes', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const { v4: uuidv4 } = await import('uuid');
  const body = await c.req.json();
  const { transaction_id, reason, description } = body;
  if (!transaction_id || !reason) return c.json({ error: '缺少必要字段' }, 400);
  const id = uuidv4();
  const t = now();
  await db.execute({
    sql: 'INSERT INTO disputes (id, transaction_id, filed_by, reason, description, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)',
    args: [id, transaction_id, sub, reason, description || null, 'open', t, t]
  }).catch(async () => {
    // If disputes table doesn't exist yet, create it
    await db.executeMultiple(`
      CREATE TABLE IF NOT EXISTS disputes (
        id TEXT PRIMARY KEY,
        transaction_id TEXT,
        filed_by TEXT,
        reason TEXT,
        description TEXT,
        status TEXT DEFAULT 'open',
        created_at TEXT,
        updated_at TEXT
      );
    `);
    await db.execute({
      sql: 'INSERT INTO disputes (id, transaction_id, filed_by, reason, description, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)',
      args: [id, transaction_id, sub, reason, description || null, 'open', t, t]
    });
  });
  return c.json({ id, success: true }, 201);
});

// ---- Admin: Stats ----
app.get('/admin/stats', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const [domainsRes, usersRes, offersRes, txRes] = await Promise.all([
    db.execute("SELECT COUNT(*) as total, SUM(CASE WHEN status='available' THEN 1 ELSE 0 END) as available FROM domain_listings"),
    db.execute('SELECT COUNT(*) as total FROM app_auth_users'),
    db.execute("SELECT COUNT(*) as total, SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending FROM domain_offers"),
    db.execute("SELECT COUNT(*) as total, COALESCE(SUM(amount),0) as revenue FROM transactions"),
  ]);
  return c.json({
    domains: { total: domainsRes.rows[0]?.total || 0, available: domainsRes.rows[0]?.available || 0 },
    users: { total: usersRes.rows[0]?.total || 0 },
    offers: { total: offersRes.rows[0]?.total || 0, pending: offersRes.rows[0]?.pending || 0 },
    transactions: { total: txRes.rows[0]?.total || 0, revenue: txRes.rows[0]?.revenue || 0 },
  });
});

// ---- Admin: Change Password ----
app.post('/admin/change-password', requireAuth, async (c) => {
  const { is_admin, sub } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const bcrypt = (await import('bcryptjs')).default;
  const body = await c.req.json();
  const { new_password, target_email } = body;
  if (!new_password || new_password.length < 6) return c.json({ error: '密码至少6位' }, 400);
  const hash = await bcrypt.hash(new_password, 12);
  const t = now();
  if (target_email) {
    await db.execute({ sql: 'UPDATE app_auth_users SET password_hash = ?, updated_at = ? WHERE email = ?', args: [hash, t, target_email] });
  } else {
    await db.execute({ sql: 'UPDATE app_auth_users SET password_hash = ?, updated_at = ? WHERE id = ?', args: [hash, t, sub] });
  }
  return c.json({ success: true });
});

// ---- Admin: WHOIS Test ----
app.post('/admin/whois-test', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const { domain } = await c.req.json();
  if (!domain) return c.json({ error: '缺少域名' }, 400);
  const settingsRes = await db.execute({ sql: "SELECT value FROM site_settings WHERE key = 'whois_api_key' LIMIT 1", args: [] });
  const apiKey = settingsRes.rows[0]?.value as string || '';
  try {
    const url = `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${apiKey}&domainName=${encodeURIComponent(domain)}&outputFormat=JSON`;
    const resp = await fetch(url);
    const data = await resp.json();
    return c.json({ success: true, data });
  } catch (e) {
    return c.json({ success: false, error: String(e) });
  }
});

// ---- Admin: Send Test Email ----
app.post('/admin/send-test-email', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const body = await c.req.json();
  const { to, smtp } = body;
  if (!to) return c.json({ error: '缺少收件人' }, 400);
  // Use provided SMTP config or read from DB
  let apiKey = smtp?.password || smtp?.apiKey || '';
  let fromEmail = smtp?.from_email || 'noreply@nic.rw';
  let fromName = smtp?.from_name || '域见·你';
  if (!apiKey) {
    const r = await db.execute("SELECT key, value FROM site_settings WHERE key IN ('resend_api_key','smtp_password','smtp_from_email','smtp_from_name')");
    const s: Record<string, string> = {};
    for (const row of r.rows) s[row.key as string] = row.value as string;
    apiKey = s.resend_api_key || s.smtp_password || '';
    fromEmail = s.smtp_from_email || fromEmail;
    fromName = s.smtp_from_name || fromName;
  }
  if (!apiKey) return c.json({ error: 'SMTP/Resend API Key 未配置' }, 400);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `${fromName} <${fromEmail}>`, to: [to], subject: '测试邮件 - 域见·你', html: '<h1>测试邮件</h1><p>这是一封来自域见·你的测试邮件，如果您收到此邮件，说明邮件功能配置正确。</p>' }),
    });
    const result = await res.json();
    if (res.ok) return c.json({ success: true, result });
    return c.json({ success: false, error: result }, 400);
  } catch (e) {
    return c.json({ success: false, error: String(e) }, 500);
  }
});

// ---- Admin: Site Settings CRUD ----
app.get('/admin/site-settings', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const r = await db.execute({ sql: 'SELECT key, value, updated_at FROM site_settings ORDER BY key ASC', args: [] });
  return c.json(r.rows.map(rowToObj));
});

app.post('/admin/site-settings', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const { key, value } = await c.req.json();
  if (!key) return c.json({ error: '缺少 key' }, 400);
  const val = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
  const t = now();
  const existing = await db.execute({ sql: 'SELECT key FROM site_settings WHERE key = ?', args: [key] });
  if (existing.rows[0]) {
    await db.execute({ sql: 'UPDATE site_settings SET value = ?, updated_at = ? WHERE key = ?', args: [val, t, key] });
  } else {
    await db.execute({ sql: 'INSERT INTO site_settings (key, value, updated_at) VALUES (?,?,?)', args: [key, val, t] });
  }
  await cacheDel('site_settings');
  return c.json({ key, value: val });
});

app.delete('/admin/site-settings/:key', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const key = c.req.param('key');
  await db.execute({ sql: 'DELETE FROM site_settings WHERE key = ?', args: [key] });
  await cacheDel('site_settings');
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
