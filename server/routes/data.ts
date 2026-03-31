import { Hono } from 'hono';
import { db } from '../db.js';
import { requireAuth, getAuth } from '../middleware/auth.js';
import { bus } from '../eventBus.js';
import { cacheGet, cacheSet, cacheDel, checkRateLimit, redis } from '../redis.js';
import { sendMail, testMailConfig } from '../mailer.js';
import {
  sellerNewOfferEmail,
  buyerOfferConfirmEmail,
  buyerCounterOfferEmail,
  buyerOfferAcceptedEmail,
  sellerCounterAcceptedEmail,
  buyerOfferRejectedEmail,
  sellerCounterRejectedEmail,
  sellerOfferCancelledEmail,
} from '../offerEmailTemplates.js';

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

async function invalidateDomainListCache(id?: string, name?: string) {
  // Use SCAN instead of KEYS to avoid blocking the Redis server on large keyspaces
  let cursor = '0';
  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'domain_listings:*', 'COUNT', 100);
    cursor = nextCursor;
    if (keys.length > 0) await redis.del(...keys);
  } while (cursor !== '0');

  if (id) {
    await cacheDel(`domain_listing:${id}`);
    await cacheDel(`domain_detail:${id.toLowerCase()}`);
  }
  if (name) await cacheDel(`domain_detail:${name.toLowerCase()}`);
}

// ---------- Shared email utility (delegates to server/mailer.ts) ----------
async function sendEmail(to: string | string[], subject: string, html: string): Promise<void> {
  try {
    await sendMail(to, subject, html);
  } catch (e) {
    console.error('[sendEmail] Failed:', e instanceof Error ? e.message : e);
  }
}

// ---------- Brand config helper ----------
async function getBrandConfig() {
  const r = await db.execute("SELECT key, value FROM site_settings WHERE key IN ('site_name','site_domain','contact_email')");
  const s: Record<string, string> = {};
  for (const row of r.rows) s[row.key as string] = row.value as string;
  return {
    siteName: s.site_name || '域见·你',
    siteDomain: (s.site_domain || 'https://nic.rw').replace(/\/$/, ''),
    supportEmail: s.contact_email || 'support@nic.rw',
  };
}

// ---------- In-app notification helper ----------
async function createNotification(opts: {
  userId: string;
  title: string;
  message: string;
  type: string;
  relatedId?: string;
  actionUrl?: string;
}) {
  const { v4: uuidv4 } = await import('uuid');
  const id = uuidv4();
  const t = now();
  await db.execute({
    sql: `INSERT INTO notifications (id, user_id, title, message, type, is_read, related_id, action_url, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
    args: [id, opts.userId, opts.title, opts.message, opts.type, opts.relatedId || null, opts.actionUrl || null, t, t],
  });
  // Publish for SSE real-time delivery
  bus.emit('db-change', {
    table: 'notifications',
    eventType: 'INSERT',
    new: { id, user_id: opts.userId, title: opts.title, message: opts.message, type: opts.type, is_read: 0, related_id: opts.relatedId || null, action_url: opts.actionUrl || null, created_at: t, updated_at: t },
  });
}

// ---------- Offer amount formatter ----------
function fmtAmount(amount: unknown, currency?: string): string {
  const sym = currency === 'USD' ? '$' : '¥';
  return `${sym}${Number(amount).toLocaleString()}`;
}

// ---- Domain Listings ----
app.get('/domain-listings', async (c) => {
  const status = c.req.query('status');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  const search = c.req.query('search') || '';
  const category = c.req.query('category') || '';
  const withAnalytics = c.req.query('analytics') === '1';

  const cacheKey = `domain_listings:${status}:${search}:${category}:${limit}:${offset}:${withAnalytics ? 'a' : ''}`;
  const cached = await cacheGet<unknown[]>(cacheKey);
  if (cached) return c.json(cached);

  const conditions: string[] = [];
  const args: unknown[] = [];

  if (status) { conditions.push('dl.status = ?'); args.push(status); }
  if (search) { conditions.push("(dl.name LIKE ? OR dl.description LIKE ?)"); args.push(`%${search}%`, `%${search}%`); }
  if (category) { conditions.push('dl.category = ?'); args.push(category); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  let sql: string;
  if (withAnalytics) {
    sql = `SELECT dl.*, COALESCE(da.views,0) as views, COALESCE(da.favorites,0) as favorites, COALESCE(da.offers,0) as offers
           FROM domain_listings dl
           LEFT JOIN domain_analytics da ON dl.id = da.domain_id
           ${where} ORDER BY dl.created_at DESC LIMIT ? OFFSET ?`;
  } else {
    sql = `SELECT * FROM domain_listings dl ${where} ORDER BY dl.created_at DESC LIMIT ? OFFSET ?`;
  }
  args.push(limit, offset);

  const r = await db.execute({ sql, args });
  const rows = r.rows.map(rowToObj);
  await cacheSet(cacheKey, rows, 90);  // 90s — domain listings change infrequently
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
  await cacheSet(cacheKey, row, 180);  // 3 min
  return c.json(row);
});

app.get('/domain-listings/:id/detail', async (c) => {
  const idParam = c.req.param('id');
  const cacheKey = `domain_detail:${idParam.toLowerCase()}`;
  const cached = await cacheGet<unknown>(cacheKey);
  if (cached) return c.json(cached);

  const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
  const r = isUUID
    ? await db.execute({ sql: 'SELECT * FROM domain_listings WHERE id = ?', args: [idParam] })
    : await db.execute({ sql: 'SELECT * FROM domain_listings WHERE name = ? COLLATE NOCASE', args: [idParam] });
  if (!r.rows[0]) return c.json({ error: '未找到' }, 404);
  const domain = rowToObj(r.rows[0]);

  const [analyticsRes, priceHistRes, similarRes, ownerRes] = await Promise.all([
    db.execute({ sql: 'SELECT views, favorites, offers FROM domain_analytics WHERE domain_id = ? LIMIT 1', args: [domain.id] }),
    db.execute({ sql: 'SELECT * FROM domain_price_history WHERE domain_id = ? ORDER BY created_at ASC LIMIT 50', args: [domain.id] }),
    db.execute({ sql: "SELECT id,name,price,category,is_verified,highlight FROM domain_listings WHERE status = 'available' AND id != ? LIMIT 6", args: [domain.id] }),
    domain.owner_id
      ? db.execute({ sql: 'SELECT id, username, full_name, avatar_url, bio, seller_rating, seller_verified FROM profiles WHERE id = ? LIMIT 1', args: [domain.owner_id] })
      : Promise.resolve({ rows: [] }),
  ]);

  const analytics = analyticsRes.rows[0] ? rowToObj(analyticsRes.rows[0]) : { views: 0, favorites: 0, offers: 0 };
  const priceHistory = priceHistRes.rows.map(rowToObj);
  const similarDomains = similarRes.rows.map(rowToObj);
  const owner = ownerRes.rows[0] ? rowToObj(ownerRes.rows[0]) : null;

  const result = { domain: { ...domain, ...analytics, owner }, priceHistory, similarDomains };
  await cacheSet(cacheKey, result, 90);
  return c.json(result);
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
  const [profileRes, domainsRes, statsRes] = await Promise.all([
    db.execute({
      sql: 'SELECT id, username, full_name, avatar_url, bio, company_name, seller_rating, seller_verified, is_seller, created_at FROM profiles WHERE id = ? LIMIT 1',
      args: [id]
    }),
    db.execute({
      sql: "SELECT id, name, price, currency, category, status, views, description, logo_url FROM domain_listings WHERE owner_id = ? AND status != 'sold' ORDER BY created_at DESC LIMIT 20",
      args: [id]
    }),
    db.execute({
      sql: `SELECT
              COUNT(DISTINCT dl.id) as total_listings,
              COALESCE(SUM(dl.views), 0) as total_views,
              COUNT(DISTINCT CASE WHEN tx.status = 'completed' THEN tx.id END) as completed_deals
            FROM domain_listings dl
            LEFT JOIN transactions tx ON tx.seller_id = ? AND tx.status = 'completed'
            WHERE dl.owner_id = ?`,
      args: [id, id]
    }),
  ]);
  if (!profileRes.rows[0]) return c.json({ error: '未找到' }, 404);
  const profile = rowToObj(profileRes.rows[0]);
  const domains = domainsRes.rows.map(rowToObj);
  const statsRow = statsRes.rows[0] as any;
  const stats = {
    totalListings: Number(statsRow?.total_listings) || 0,
    totalViews: Number(statsRow?.total_views) || 0,
    completedDeals: Number(statsRow?.completed_deals) || 0,
  };
  return c.json({ ...profile, domains, stats });
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
  // buyer_id can be supplied explicitly (e.g. seller creating on behalf of buyer);
  // fall back to sub (the authenticated caller) when not provided
  const buyerId: string = (body.buyer_id as string) || sub;
  if (!resolvedDomainId || !seller_id || !amount) return c.json({ error: '缺少必要字段' }, 400);
  const id = uuidv4();
  const t = now();
  await db.execute({
    sql: `INSERT INTO transactions (id, domain_id, buyer_id, seller_id, amount, status, offer_id, payment_method, notes, created_at, updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    args: [id, resolvedDomainId, buyerId, seller_id, parseFloat(amount), 'pending', offer_id || null, payment_method || null, notes || null, t, t]
  });
  const inserted = rowToObj((await db.execute({ sql: 'SELECT * FROM transactions WHERE id = ?', args: [id] })).rows[0]);
  bus.publish({ table: 'transactions', eventType: 'INSERT', new: inserted, userId: sub });
  return c.json(inserted, 201);
});

// ---- Homepage Data (hot + sold domains + logos, Redis 5 min) ----
app.get('/home', async (c) => {
  const { cacheGetOrSet } = await import('../redis.js');
  const data = await cacheGetOrSet(
    'home_data',
    async () => {
      // Fetch Turso data + Supabase auctions all in parallel
      const [hotRes, soldRes, logoRes, auctionData] = await Promise.all([
        db.execute({
          sql: `SELECT dl.id, dl.name, dl.price
                FROM domain_listings dl
                LEFT JOIN domain_analytics da ON dl.id = da.domain_id
                WHERE dl.status = 'available'
                ORDER BY COALESCE(da.views, 0) DESC
                LIMIT 40`,
          args: [],
        }),
        db.execute({
          sql: `SELECT id, name, price FROM domain_listings WHERE status = 'sold' ORDER BY created_at DESC LIMIT 40`,
          args: [],
        }),
        db.execute({
          sql: `SELECT key, value FROM site_settings WHERE key LIKE 'domain_logo_%'`,
          args: [],
        }),
        // Inline the auctions fetch so the browser only makes ONE request
        (async () => {
          try {
            const { supabaseAdmin } = await import('../supabase.js');
            const { data: rows, error } = await supabaseAdmin
              .from('domain_auctions')
              .select('id, starting_price, current_price, domain:domain_listings(id, name, price)')
              .eq('status', 'active')
              .limit(20);
            if (error) return [];
            return (rows ?? []).filter((a: any) => a.domain).map((a: any) => ({
              id: (a.domain as any)?.id ?? a.id,
              name: (a.domain as any)?.name ?? '域名',
              price: Number(a.current_price) || Number(a.starting_price) || 0,
            }));
          } catch { return []; }
        })(),
      ]);

      const logoMap: Record<string, string> = {};
      for (const row of logoRes.rows) {
        const id = (row.key as string).replace('domain_logo_', '');
        if (row.value) logoMap[id] = row.value as string;
      }

      const hotDomains = hotRes.rows.map(rowToObj);
      const soldDomains = soldRes.rows.map(rowToObj);
      return { hotDomains, soldDomains, auctionDomains: auctionData, logoMap, totalSold: soldDomains.length };
    },
    300,  // 5 min fresh
    300,  // serve stale for 5 min while revalidating
  );
  // Allow CDN/browser to serve cached response for 60s, then stale-while-revalidate 240s
  c.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=240');
  return c.json(data);
});

// ---- Active Auctions (kept for backwards compat; data is now bundled in /home) ----
app.get('/auctions', async (c) => {
  const { cacheGetOrSet } = await import('../redis.js');
  const data = await cacheGetOrSet(
    'active_auctions',
    async () => {
      const { supabaseAdmin } = await import('../supabase.js');
      const { data: rows, error } = await supabaseAdmin
        .from('domain_auctions')
        .select('id, starting_price, current_price, domain:domain_listings(id, name, price)')
        .eq('status', 'active')
        .limit(20);
      if (error) return [];
      return (rows ?? []).filter((a: any) => a.domain).map((a: any) => ({
        id: (a.domain as any)?.id ?? a.id,
        name: (a.domain as any)?.name ?? '域名',
        price: Number(a.current_price) || Number(a.starting_price) || 0,
      }));
    },
    300,
    300,
  );
  c.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=240');
  return c.json(data);
});

// ---- Site Settings (public read, heavily cached 10 min + 5 min stale) ----
app.get('/site-settings', async (c) => {
  const { cacheGetOrSet } = await import('../redis.js');
  const data = await cacheGetOrSet<Record<string, unknown>>(
    'site_settings',
    async () => {
      const r = await db.execute({ sql: 'SELECT key, value FROM site_settings', args: [] });
      const out: Record<string, unknown> = {};
      for (const row of r.rows) out[row.key as string] = parseJson(row.value);
      return out;
    },
    600,  // fresh for 10 min
    300,  // serve stale for extra 5 min while refreshing
  );
  c.header('Cache-Control', 'public, max-age=120, stale-while-revalidate=480');
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
  let body: Record<string, unknown> = {};
  try { body = await c.req.json(); } catch { body = {}; }
  // Support flat key-value, { updates: {...} }, and nested formats
  let kvMap: Record<string, unknown> = {};
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const b = body as Record<string, unknown>;
    if (b.updates && typeof b.updates === 'object' && !Array.isArray(b.updates)) {
      kvMap = b.updates as Record<string, unknown>;
    } else {
      const { updates: _u, ...rest } = b;
      kvMap = rest;
    }
  }
  const entries = Object.entries(kvMap).filter(([k]) => k && typeof k === 'string');
  for (const [k, v] of entries) {
    const val = v === null || v === undefined ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v));
    const existing = await db.execute({ sql: 'SELECT id FROM site_settings WHERE key = ?', args: [k] });
    if (existing.rows.length > 0) {
      await db.execute({ sql: 'UPDATE site_settings SET value = ?, updated_at = ? WHERE key = ?', args: [val, now(), k] });
    } else {
      await db.execute({ sql: 'INSERT INTO site_settings (id, key, value, section, type, updated_at) VALUES (lower(hex(randomblob(16))),?,?,?,?,?)', args: [k, val, 'general', 'text', now()] });
    }
  }
  if (entries.length === 0) return c.json({ error: '无可更新字段' }, 400);
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
    args: [id, domainId, buyerId, sellerId, parseFloat(amount), message, email, t, t],
  });
  const inserted = rowToObj((await db.execute({ sql: 'SELECT * FROM domain_offers WHERE id = ?', args: [id] })).rows[0]);

  // Gather context
  const [domainRes, sellerRes, brand] = await Promise.all([
    db.execute({ sql: 'SELECT name, currency FROM domain_listings WHERE id = ? LIMIT 1', args: [domainId] }),
    db.execute({ sql: 'SELECT id, email FROM app_auth_users WHERE id = ? LIMIT 1', args: [sellerId] }),
    getBrandConfig(),
  ]);
  const domainName = domainRes.rows[0]?.name as string || domainId;
  const currency = domainRes.rows[0]?.currency as string | undefined;
  const sellerEmail = sellerRes.rows[0]?.email as string;
  const amtDisplay = fmtAmount(amount, currency);

  // ── In-app notifications ──
  // Notify seller
  await createNotification({
    userId: sellerId,
    title: `💰 域名 ${domainName} 收到新报价`,
    message: `有买家对您的域名 ${domainName} 报价 ${amtDisplay}，请登录处理`,
    type: 'offer',
    relatedId: id,
    actionUrl: '/user-center?tab=transactions',
  }).catch(() => {});

  // Notify buyer (if logged in)
  if (buyerId) {
    await createNotification({
      userId: buyerId,
      title: `📤 报价已成功提交`,
      message: `您对域名 ${domainName} 的 ${amtDisplay} 报价已发送，等待卖家回复`,
      type: 'offer',
      relatedId: id,
      actionUrl: '/user-center?tab=transactions',
    }).catch(() => {});
  }

  // ── Email notifications ──
  const buyerMsg = (() => {
    try { const p = JSON.parse(message || ''); return p.buyer_message ?? message; } catch { return message; }
  })();

  if (sellerEmail) {
    const { subject, html } = sellerNewOfferEmail({ domainName, amount: amtDisplay, buyerMessage: buyerMsg || undefined, brand });
    sendEmail(sellerEmail, subject, html).catch(() => {});
  }
  const { subject: bSubj, html: bHtml } = buyerOfferConfirmEmail({ domainName, amount: amtDisplay, buyerMessage: buyerMsg || undefined, brand });
  sendEmail(email, bSubj, bHtml).catch(() => {});

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
    args: [...args, sub, sub],
  });
  const r = await db.execute({ sql: 'SELECT * FROM domain_offers WHERE id = ?', args: [offerId] });
  if (!r.rows[0]) return c.json({ error: '未找到' }, 404);
  const offer = rowToObj(r.rows[0]);

  if (body.status) {
    // Gather context async
    const [domainRes, buyerRes, sellerRes, brand] = await Promise.all([
      db.execute({ sql: 'SELECT name, currency FROM domain_listings WHERE id = ? LIMIT 1', args: [offer.domain_id] }),
      offer.buyer_id ? db.execute({ sql: 'SELECT email FROM app_auth_users WHERE id = ? LIMIT 1', args: [offer.buyer_id] }) : Promise.resolve({ rows: [] }),
      offer.seller_id ? db.execute({ sql: 'SELECT email FROM app_auth_users WHERE id = ? LIMIT 1', args: [offer.seller_id] }) : Promise.resolve({ rows: [] }),
      getBrandConfig(),
    ]);

    const domainName = domainRes.rows[0]?.name as string || String(offer.domain_id);
    const currency = domainRes.rows[0]?.currency as string | undefined;
    const buyerEmail = (buyerRes.rows[0]?.email as string) || (offer.contact_email as string);
    const sellerEmail = sellerRes.rows[0]?.email as string;
    const buyerId = offer.buyer_id as string | null;
    const sellerId = offer.seller_id as string | null;
    const amtCurrent = fmtAmount(offer.amount, currency);

    // ── 卖家还价 (countered) ──
    if (body.status === 'countered') {
      let counterAmt = fmtAmount(offer.amount, currency);
      let counterNote = '';
      try {
        const parsed = JSON.parse(body.message || '');
        if (parsed.counter_amount) counterAmt = fmtAmount(parsed.counter_amount, currency);
        counterNote = parsed.counter_note || '';
      } catch { /* plain message */ }

      if (buyerId) {
        await createNotification({
          userId: buyerId,
          title: `💬 卖家已还价：${domainName}`,
          message: `卖家对您的报价回应了还价 ${counterAmt}，请登录查看并决定是否接受`,
          type: 'offer_counter',
          relatedId: offerId,
          actionUrl: '/user-center?tab=transactions',
        }).catch(() => {});
      }
      if (sellerId) {
        await createNotification({
          userId: sellerId,
          title: `✅ 还价已发出：${domainName}`,
          message: `您的 ${counterAmt} 还价已成功发送给买家，等待买家回复`,
          type: 'offer_counter',
          relatedId: offerId,
          actionUrl: '/user-center?tab=transactions',
        }).catch(() => {});
      }
      if (buyerEmail) {
        const { subject, html } = buyerCounterOfferEmail({
          domainName, originalAmount: amtCurrent, counterAmount: counterAmt,
          counterNote: counterNote || undefined, brand,
        });
        sendEmail(buyerEmail, subject, html).catch(() => {});
      }
    }

    // ── 报价被接受 (accepted) ──
    else if (body.status === 'accepted') {
      const isBuyerAccepting = sub === buyerId;  // buyer accepting seller's counter
      const isSellerAccepting = sub === sellerId; // seller accepting buyer's offer

      if (isSellerAccepting) {
        // Seller accepted → notify buyer
        if (buyerId) {
          await createNotification({
            userId: buyerId,
            title: `🎉 报价已被接受！${domainName}`,
            message: `恭喜！卖家接受了您对域名 ${domainName} 的 ${amtCurrent} 报价，请尽快进入交易详情完成付款`,
            type: 'offer_accepted',
            relatedId: offerId,
            actionUrl: '/user-center?tab=transactions',
          }).catch(() => {});
        }
        if (sellerId) {
          await createNotification({
            userId: sellerId,
            title: `✅ 报价已接受：${domainName}`,
            message: `您已接受买家对域名 ${domainName} 的 ${amtCurrent} 报价，等待买家付款`,
            type: 'offer_accepted',
            relatedId: offerId,
            actionUrl: '/user-center?tab=transactions',
          }).catch(() => {});
        }
        if (buyerEmail) {
          const { subject, html } = buyerOfferAcceptedEmail({ domainName, amount: amtCurrent, brand });
          sendEmail(buyerEmail, subject, html).catch(() => {});
        }
      } else if (isBuyerAccepting) {
        // Buyer accepted seller's counter → notify seller
        if (sellerId) {
          await createNotification({
            userId: sellerId,
            title: `🤝 买家接受了您的还价！${domainName}`,
            message: `买家同意以 ${amtCurrent} 完成交易，请等待买家付款`,
            type: 'offer_accepted',
            relatedId: offerId,
            actionUrl: '/user-center?tab=transactions',
          }).catch(() => {});
        }
        if (buyerId) {
          await createNotification({
            userId: buyerId,
            title: `✅ 您已接受还价：${domainName}`,
            message: `您以 ${amtCurrent} 接受了卖家还价，请尽快完成付款`,
            type: 'offer_accepted',
            relatedId: offerId,
            actionUrl: '/user-center?tab=transactions',
          }).catch(() => {});
        }
        if (sellerEmail) {
          const { subject, html } = sellerCounterAcceptedEmail({ domainName, amount: amtCurrent, brand });
          sendEmail(sellerEmail, subject, html).catch(() => {});
        }
        if (buyerEmail) {
          const { subject, html } = buyerOfferAcceptedEmail({ domainName, amount: amtCurrent, brand });
          sendEmail(buyerEmail, subject, html).catch(() => {});
        }
      }
    }

    // ── 报价被拒绝 (rejected) ──
    else if (body.status === 'rejected') {
      // Seller rejecting buyer's offer
      if (sub === sellerId && buyerId) {
        await createNotification({
          userId: buyerId,
          title: `📋 您的报价未被接受：${domainName}`,
          message: `卖家未接受您对域名 ${domainName} 的 ${amtCurrent} 报价，域名仍在挂牌，欢迎调整后重新报价`,
          type: 'offer_rejected',
          relatedId: offerId,
          actionUrl: '/user-center?tab=transactions',
        }).catch(() => {});
        if (buyerEmail) {
          const { subject, html } = buyerOfferRejectedEmail({ domainName, amount: amtCurrent, brand });
          sendEmail(buyerEmail, subject, html).catch(() => {});
        }
      }
      // Buyer rejecting seller's counter offer
      else if (sub === buyerId && sellerId) {
        await createNotification({
          userId: sellerId,
          title: `📋 买家拒绝了您的还价：${domainName}`,
          message: `买家拒绝了您对域名 ${domainName} 的还价，本次协商结束，请等待买家重新提交报价`,
          type: 'offer_rejected',
          relatedId: offerId,
          actionUrl: '/user-center?tab=transactions',
        }).catch(() => {});
        if (sellerEmail) {
          const { subject, html } = sellerCounterRejectedEmail({ domainName, counterAmount: amtCurrent, brand });
          sendEmail(sellerEmail, subject, html).catch(() => {});
        }
      }
    }

    // ── 买家取消报价 (cancelled) ──
    else if (body.status === 'cancelled' && sellerId) {
      await createNotification({
        userId: sellerId,
        title: `📌 报价已取消：${domainName}`,
        message: `买家取消了对域名 ${domainName} 的 ${amtCurrent} 报价，域名持续挂牌中`,
        type: 'offer',
        relatedId: offerId,
        actionUrl: '/user-center?tab=transactions',
      }).catch(() => {});
      if (sellerEmail) {
        const { subject, html } = sellerOfferCancelledEmail({ domainName, amount: amtCurrent, brand });
        sendEmail(sellerEmail, subject, html).catch(() => {});
      }
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

// ---- Domain Views (record a page view) ----
app.post('/domain-views/:id', async (c) => {
  const domainId = c.req.param('id');
  if (!domainId) return c.json({ error: '缺少域名ID' }, 400);
  try {
    const existing = await db.execute({
      sql: 'SELECT id FROM domain_analytics WHERE domain_id = ? LIMIT 1',
      args: [domainId],
    });
    if (existing.rows.length > 0) {
      await db.execute({
        sql: 'UPDATE domain_analytics SET views = COALESCE(views,0)+1, last_updated = ? WHERE domain_id = ?',
        args: [new Date().toISOString(), domainId],
      });
    } else {
      const { randomUUID } = await import('crypto');
      await db.execute({
        sql: 'INSERT INTO domain_analytics (id, domain_id, views, favorites, offers, last_updated) VALUES (?,?,1,0,0,?)',
        args: [randomUUID(), domainId, new Date().toISOString()],
      });
    }
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
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

  // Serve from cache (120s TTL + 60s stale) to avoid hammering Turso on every refresh
  const forceRefresh = c.req.query('refresh') === '1';
  if (!forceRefresh) {
    const cached = await cacheGet<Record<string, unknown>>('admin_stats');
    if (cached) return c.json(cached);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try { return await fn(); } catch { return fallback; }
  };
  const emptyRows = { rows: [{}] };

  const [domainsRes, usersRes, offersRes, txRes, viewsRes, newUsersRes, newDomainsRes, recentOffers] = await Promise.all([
    safe(() => db.execute("SELECT COUNT(*) as total, SUM(CASE WHEN status='available' THEN 1 ELSE 0 END) as active, SUM(CASE WHEN is_verified=1 OR is_verified='true' THEN 1 ELSE 0 END) as verified FROM domain_listings"), emptyRows),
    safe(() => db.execute('SELECT COUNT(*) as total FROM app_auth_users'), emptyRows),
    safe(() => db.execute("SELECT COUNT(*) as total, SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending FROM domain_offers"), emptyRows),
    safe(() => db.execute("SELECT COUNT(*) as total, COALESCE(SUM(CASE WHEN status='completed' THEN amount ELSE 0 END),0) as revenue, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed FROM transactions"), emptyRows),
    safe(() => db.execute('SELECT COALESCE((SELECT SUM(views) FROM domain_analytics),0) as total'), emptyRows),
    safe(() => db.execute({ sql: 'SELECT COUNT(*) as total FROM app_auth_users WHERE created_at >= ?', args: [todayIso] }), emptyRows),
    safe(() => db.execute({ sql: "SELECT COUNT(*) as total FROM domain_listings WHERE created_at >= ?", args: [todayIso] }), emptyRows),
    safe(async () => {
      const r = await db.execute("SELECT do.id, do.amount, do.status, do.created_at, dl.name as domain_name FROM domain_offers do LEFT JOIN domain_listings dl ON dl.id = do.domain_id ORDER BY do.created_at DESC LIMIT 5");
      return r.rows.map(rowToObj);
    }, [] as Record<string, unknown>[]),
  ]);

  const result = {
    totalUsers: Number(usersRes.rows[0]?.total) || 0,
    totalDomains: Number(domainsRes.rows[0]?.total) || 0,
    activeListings: Number(domainsRes.rows[0]?.active) || 0,
    verifiedDomains: Number(domainsRes.rows[0]?.verified) || 0,
    totalOffers: Number(offersRes.rows[0]?.total) || 0,
    pendingOffers: Number(offersRes.rows[0]?.pending) || 0,
    completedTransactions: Number(txRes.rows[0]?.completed) || 0,
    totalRevenue: Number(txRes.rows[0]?.revenue) || 0,
    totalViews: Number(viewsRes.rows[0]?.total) || 0,
    pendingVerifications: 0,
    newUsersToday: Number(newUsersRes.rows[0]?.total) || 0,
    newDomainsToday: Number(newDomainsRes.rows[0]?.total) || 0,
    recentOffers,
    cachedAt: new Date().toISOString(),
  };
  await cacheSet('admin_stats', result, 120);  // cache 2 min
  return c.json(result);
});

// ---- Admin: All Offers ----
app.get('/admin/offers', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const r = await db.execute(`
    SELECT do.*, dl.name as domain_name,
      bu.email as buyer_email, su.email as seller_email
    FROM domain_offers do
    LEFT JOIN domain_listings dl ON do.domain_id = dl.id
    LEFT JOIN app_auth_users bu ON do.buyer_id = bu.id
    LEFT JOIN app_auth_users su ON do.seller_id = su.id
    ORDER BY do.created_at DESC
  `);
  return c.json(r.rows.map(rowToObj));
});

app.delete('/domain-offers/:id', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const id = c.req.param('id');
  await db.execute({ sql: 'DELETE FROM domain_offers WHERE id = ?', args: [id] });
  return c.json({ success: true });
});

// ---- Admin: All Transactions ----
app.get('/admin/transactions', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const r = await db.execute(`
    SELECT t.*, dl.name as domain_name,
      bu.email as buyer_email, su.email as seller_email
    FROM transactions t
    LEFT JOIN domain_listings dl ON t.domain_id = dl.id
    LEFT JOIN app_auth_users bu ON t.buyer_id = bu.id
    LEFT JOIN app_auth_users su ON t.seller_id = su.id
    ORDER BY t.created_at DESC
    LIMIT 200
  `);
  return c.json(r.rows.map(rowToObj));
});

app.patch('/admin/transactions/:id', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const txId = c.req.param('id');
  const body = await c.req.json();
  const { status, notes, domain_id } = body;
  const updates: string[] = [];
  const args: unknown[] = [];
  if (status !== undefined) { updates.push('status = ?'); args.push(status); }
  if (notes !== undefined) { updates.push('notes = ?'); args.push(notes); }
  if (status === 'completed') { updates.push('completed_at = ?'); args.push(now()); }
  updates.push('updated_at = ?');
  args.push(now());
  args.push(txId);
  await db.execute({ sql: `UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`, args });
  if (domain_id) {
    if (status === 'completed') {
      await db.execute({ sql: "UPDATE domain_listings SET status = 'sold', updated_at = ? WHERE id = ?", args: [now(), domain_id] });
    } else if (status === 'cancelled' || status === 'refunded') {
      await db.execute({ sql: "UPDATE domain_listings SET status = 'active', updated_at = ? WHERE id = ?", args: [now(), domain_id] });
    }
  }
  const r = await db.execute({ sql: 'SELECT * FROM transactions WHERE id = ?', args: [txId] });
  return c.json(rowToObj(r.rows[0]));
});

// ---- Admin: All Messages ----
app.get('/admin/messages', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const r = await db.execute(`
    SELECT m.*, dl.name as domain_name,
      su.email as sender_email, ru.email as receiver_email
    FROM messages m
    LEFT JOIN domain_listings dl ON m.domain_id = dl.id
    LEFT JOIN app_auth_users su ON m.sender_id = su.id
    LEFT JOIN app_auth_users ru ON m.receiver_id = ru.id
    ORDER BY m.created_at DESC
    LIMIT 500
  `);
  return c.json(r.rows.map(rowToObj));
});

app.delete('/admin/messages/:id', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const id = c.req.param('id');
  await db.execute({ sql: 'DELETE FROM messages WHERE id = ?', args: [id] });
  return c.json({ success: true });
});

// ---- Admin: Trend Stats ----
app.get('/admin/trend-stats', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const cached = await cacheGet<Record<string, unknown>>('admin_trend_stats');
  if (cached) return c.json(cached);
  const days = 7;
  const trends: Record<string, unknown>[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
    const ds = dayStart.toISOString(); const de = dayEnd.toISOString();
    const [usersR, domainsR, offersR] = await Promise.all([
      db.execute({ sql: 'SELECT COUNT(*) as cnt FROM app_auth_users WHERE created_at >= ? AND created_at <= ?', args: [ds, de] }),
      db.execute({ sql: 'SELECT COUNT(*) as cnt FROM domain_listings WHERE created_at >= ? AND created_at <= ?', args: [ds, de] }),
      db.execute({ sql: 'SELECT COUNT(*) as cnt FROM domain_offers WHERE created_at >= ? AND created_at <= ?', args: [ds, de] }),
    ]);
    trends.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      users: Number(usersR.rows[0]?.cnt) || 0,
      domains: Number(domainsR.rows[0]?.cnt) || 0,
      offers: Number(offersR.rows[0]?.cnt) || 0,
      views: 0,
    });
  }
  const catR = await db.execute('SELECT category, COUNT(*) as cnt FROM domain_listings GROUP BY category');
  const categories = catR.rows.map(row => {
    const o = rowToObj(row);
    return { name: String(o.category || 'standard'), value: Number(o.cnt) || 0 };
  });
  const result = { trends, categories };
  await cacheSet('admin_trend_stats', result, 300);
  return c.json(result);
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

  // Map frontend smtp object → mailer override keys
  const override = smtp ? {
    smtp_host:       smtp.host,
    smtp_port:       smtp.port,
    smtp_username:   smtp.username,
    smtp_password:   smtp.password,
    smtp_from_email: smtp.from_email,
    smtp_from_name:  smtp.from_name,
  } : undefined;

  const result = await testMailConfig(to, override);
  if (result.ok) return c.json({ success: true, provider: result.provider });
  return c.json({ success: false, error: result.error, provider: result.provider }, 400);
});

// ---- Admin: Site Settings CRUD ----
app.get('/admin/site-settings', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const r = await db.execute({ sql: 'SELECT id, key, value, description, section, type, updated_at FROM site_settings ORDER BY section ASC, key ASC', args: [] });
  return c.json(r.rows.map(rowToObj));
});

app.post('/admin/site-settings', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const body = await c.req.json();
  const { key, value, section: sec = 'general', type: typ = 'text', description: desc = '' } = body;
  if (!key) return c.json({ error: '缺少 key' }, 400);
  const val = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
  const t = now();
  const existingRow = await db.execute({ sql: 'SELECT id FROM site_settings WHERE key = ?', args: [key] });
  if (existingRow.rows.length > 0) {
    await db.execute({ sql: 'UPDATE site_settings SET value = ?, description = ?, section = ?, type = ?, updated_at = ? WHERE key = ?', args: [val, desc, sec, typ, t, key] });
  } else {
    await db.execute({ sql: 'INSERT INTO site_settings (id, key, value, description, section, type, updated_at) VALUES (lower(hex(randomblob(16))),?,?,?,?,?,?)', args: [key, val, desc, sec, typ, t] });
  }
  await cacheDel('site_settings');
  const r2 = await db.execute({ sql: 'SELECT id, key, value, description, section, type, updated_at FROM site_settings WHERE key = ?', args: [key] });
  return c.json(r2.rows[0] ? rowToObj(r2.rows[0] as Record<string, unknown>) : { key, value: val });
});

app.delete('/admin/site-settings/:key', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const key = c.req.param('key');
  await db.execute({ sql: 'DELETE FROM site_settings WHERE key = ?', args: [key] });
  await cacheDel('site_settings');
  return c.json({ success: true });
});

// ---- Admin: upload logo → data URL stored in site_settings ----
app.post('/admin/upload-logo', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);

  const contentType = c.req.header('content-type') || '';

  let dataUrl: string;
  let mode: string = 'light';

  if (contentType.includes('application/json')) {
    // JSON mode: { dataUrl: 'data:image/...', mode: 'light'|'dark' }
    const body = await c.req.json().catch(() => null);
    if (!body) return c.json({ error: '解析请求失败' }, 400);
    dataUrl = body.dataUrl || '';
    mode = body.mode || 'light';
    if (!dataUrl.startsWith('data:image/')) return c.json({ error: '无效的图片数据' }, 400);
    if (dataUrl.length > 5 * 1024 * 1024) return c.json({ error: '图片数据过大，请压缩后重试' }, 400);
  } else if (contentType.includes('multipart/form-data')) {
    // FormData mode with Vercel Blob (optional)
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const form = await c.req.formData().catch(() => null);
    if (!form) return c.json({ error: '解析表单失败' }, 400);
    const file = form.get('file') as File | null;
    mode = (form.get('mode') as string) || 'light';
    if (!file) return c.json({ error: '未找到文件字段' }, 400);
    const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!ALLOWED.includes(file.type)) return c.json({ error: '仅支持 JPG/PNG/GIF/WebP/SVG' }, 400);
    if (file.size > 2 * 1024 * 1024) return c.json({ error: 'Logo 不能超过 2MB' }, 400);
    if (token) {
      try {
        const { put } = await import('@vercel/blob');
        const ext = file.name.split('.').pop() || 'png';
        const blob = await put(`logos/${mode}-${Date.now()}.${ext}`, file, { access: 'public', token, addRandomSuffix: false });
        const settingKey = mode === 'dark' ? 'logo_dark_url' : 'logo_url';
        await db.execute({
          sql: `INSERT INTO site_settings (id, key, value, section, type, updated_at)
                VALUES (lower(hex(randomblob(16))), ?, ?, 'general', 'text', CURRENT_TIMESTAMP)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
          args: [settingKey, blob.url],
        });
        await cacheDel('site_settings');
        return c.json({ url: blob.url, key: settingKey });
      } catch (e: any) {
        return c.json({ error: '云存储上传失败：' + (e?.message || '未知错误') }, 500);
      }
    }
    // No Blob token - convert FormData file to data URL
    const buf = await file.arrayBuffer();
    const b64 = Buffer.from(buf).toString('base64');
    dataUrl = `data:${file.type};base64,${b64}`;
  } else {
    return c.json({ error: '不支持的 Content-Type' }, 400);
  }

  const settingKey = mode === 'dark' ? 'logo_dark_url' : mode === 'favicon' ? 'favicon_url' : 'logo_url';
  await db.execute({
    sql: `INSERT INTO site_settings (id, key, value, section, type, updated_at)
          VALUES (lower(hex(randomblob(16))), ?, ?, 'general', 'text', CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    args: [settingKey, dataUrl],
  });
  await cacheDel('site_settings');
  return c.json({ url: dataUrl, key: settingKey });
});

// ---- Admin: auction management (via service admin client) ----
app.get('/admin/auctions', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const { supabaseAdmin } = await import('../supabase.js');
  const { data, error } = await supabaseAdmin
    .from('domain_auctions')
    .select('id, domain_id, starting_price, current_price, reserve_price, buy_now_price, bid_count, status, start_time, end_time, created_at, winner_id, domain_listings(name)')
    .order('created_at', { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  const mapped = (data || []).map((a: any) => ({
    ...a,
    start_price: a.starting_price,
    domain_name: a.domain_listings?.name ?? '—',
  }));
  return c.json(mapped);
});

app.patch('/admin/auctions/:id', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const id = c.req.param('id');
  const body = await c.req.json();
  const { supabaseAdmin } = await import('../supabase.js');
  const { error } = await supabaseAdmin.from('domain_auctions').update(body).eq('id', id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true });
});

app.get('/admin/auctions/:id/bids', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const id = c.req.param('id');
  const { supabaseAdmin } = await import('../supabase.js');
  const { data: bids, error } = await supabaseAdmin
    .from('auction_bids')
    .select('id, auction_id, bidder_id, amount, created_at')
    .eq('auction_id', id)
    .order('amount', { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  const bidderIds = [...new Set((bids || []).map((b: any) => b.bidder_id).filter(Boolean))];
  let profileMap: Record<string, any> = {};
  if (bidderIds.length > 0) {
    const { data: profiles } = await supabaseAdmin.from('profiles').select('id, contact_email, full_name').in('id', bidderIds);
    for (const p of profiles || []) profileMap[p.id] = p;
  }
  const result = (bids || []).map((b: any) => ({
    ...b,
    bidder_email: profileMap[b.bidder_id]?.contact_email || profileMap[b.bidder_id]?.full_name || '—',
  }));
  return c.json(result);
});

// ---- Admin: review management ----
app.get('/admin/reviews', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const { supabaseAdmin } = await import('../supabase.js');
  const { data: reviews, error } = await supabaseAdmin
    .from('user_reviews')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  if (!reviews || reviews.length === 0) return c.json([]);
  // Fetch reviewer profiles separately (no FK constraint in DB)
  const reviewerIds = [...new Set(reviews.map((r: any) => r.reviewer_id).filter(Boolean))];
  let profileMap: Record<string, any> = {};
  if (reviewerIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, contact_email')
      .in('id', reviewerIds);
    if (profiles) {
      for (const p of profiles) profileMap[p.id] = p;
    }
  }
  const enriched = reviews.map((r: any) => ({
    ...r,
    reviewer: r.reviewer_id ? profileMap[r.reviewer_id] || null : null,
  }));
  return c.json(enriched);
});

app.patch('/admin/reviews/:id', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const id = c.req.param('id');
  const body = await c.req.json();
  const { supabaseAdmin } = await import('../supabase.js');
  const { error } = await supabaseAdmin.from('user_reviews').update(body).eq('id', id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true });
});

app.delete('/admin/reviews/:id', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const id = c.req.param('id');
  const { supabaseAdmin } = await import('../supabase.js');
  const { error } = await supabaseAdmin.from('user_reviews').delete().eq('id', id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true });
});

// ---- Admin: seed default SEO settings ----
app.post('/admin/seed-seo', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const defaults = [
    { key: 'meta_title', value: 'NIC.RW - 专业中文域名交易平台', description: '页面标题', section: 'seo' },
    { key: 'meta_description', value: '域见·你 | NIC.RW 是专业的中文域名交易平台，提供域名买卖、竞拍、估值等全方位服务', description: '页面描述', section: 'seo' },
    { key: 'keywords', value: '域名交易,域名买卖,域名估值,域名竞拍,中文域名,NIC.RW', description: '关键词', section: 'seo' },
    { key: 'og_title', value: 'NIC.RW 域名交易平台', description: 'Open Graph 标题', section: 'seo' },
    { key: 'og_description', value: '专业域名交易服务平台，助力您的数字资产增值', description: 'Open Graph 描述', section: 'seo' },
    { key: 'canonical_url', value: 'https://nic.rw', description: '规范 URL', section: 'seo' },
  ];
  for (const d of defaults) {
    await db.execute({
      sql: `INSERT INTO site_settings (id, key, value, description, section, type, updated_at)
            VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, 'text', CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO NOTHING`,
      args: [d.key, d.value, d.description, d.section],
    });
  }
  await cacheDel('site_settings');
  return c.json({ ok: true, seeded: defaults.length });
});

// ---- Admin: publish realtime event ----
app.post('/admin/publish-event', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const event = await c.req.json();
  bus.publish(event);
  return c.json({ ok: true });
});

// ---- Crash report (frontend auto-reports uncaught errors) ----
app.post('/crash-report', async (c) => {
  try {
    // Rate limit: 5 crash reports per IP per 5 minutes
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rl = await checkRateLimit(`crash:${ip}`, 5, 300);
    if (!rl.allowed) return c.json({ ok: true }); // silently drop excess

    const body = await c.req.json();
    const {
      url, message: bodyMessage, stack, errorMessage, errorStack,
      userId, userEmail, browser, timestamp, crashId
    } = body;
    const msgText = (errorMessage || bodyMessage || '未知错误').substring(0, 500);
    const stackText = (errorStack || stack || '').substring(0, 3000);
    const brand = await getBrandConfig();

    const safeUrl = (url || '未知').substring(0, 200);
    const safeBrowser = (browser || '未知').substring(0, 300);

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:24px}
  .card{background:#fff;border-radius:8px;padding:24px;max-width:680px;margin:0 auto;border:1px solid #e5e7eb}
  h1{font-size:20px;color:#dc2626;margin:0 0 4px}
  .meta{font-size:13px;color:#6b7280;margin-bottom:20px}
  .section{margin-bottom:16px}
  .label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.6px;color:#9ca3af;margin-bottom:4px}
  .value{font-size:14px;color:#111;word-break:break-all}
  .stack{background:#1e1e1e;color:#d4d4d4;font-family:'Courier New',monospace;font-size:12px;padding:14px;border-radius:6px;white-space:pre-wrap;word-break:break-all;overflow:auto}
  .badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;background:#fef2f2;color:#dc2626;border:1px solid #fecaca}
</style></head><body>
<div class="card">
  <h1>⚠ 程序崩溃报告</h1>
  <div class="meta">崩溃 ID: <strong>${crashId || 'N/A'}</strong> &nbsp;·&nbsp; ${new Date(timestamp || Date.now()).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</div>

  <div class="section">
    <div class="label">出错页面</div>
    <div class="value">${safeUrl}</div>
  </div>

  <div class="section">
    <div class="label">错误信息</div>
    <div class="value"><span class="badge">ERROR</span> ${msgText}</div>
  </div>

  ${userId ? `<div class="section">
    <div class="label">用户信息</div>
    <div class="value">ID: ${userId}${userEmail ? ' &nbsp;·&nbsp; ' + String(userEmail).substring(0, 100) : ''}</div>
  </div>` : '<div class="section"><div class="label">用户信息</div><div class="value">未登录用户</div></div>'}

  <div class="section">
    <div class="label">浏览器 / 设备</div>
    <div class="value">${safeBrowser}</div>
  </div>

  ${stackText ? `<div class="section">
    <div class="label">错误堆栈</div>
    <pre class="stack">${stackText}</pre>
  </div>` : ''}
</div></body></html>`;

    await sendEmail(
      brand.supportEmail,
      `[崩溃报告] ${msgText.substring(0, 60)} — ${brand.siteName}`,
      html
    );
    return c.json({ ok: true });
  } catch (e) {
    return c.json({ ok: true }); // Always succeed to not re-trigger error
  }
});

// ---- Feedback screenshot upload (no auth required) ----
app.post('/feedback/upload', async (c) => {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return c.json({ error: '图片上传服务未配置' }, 503);

    const contentType = c.req.header('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return c.json({ error: '请使用 multipart/form-data 上传' }, 400);
    }
    const form = await c.req.formData().catch(() => null);
    if (!form) return c.json({ error: '解析表单失败' }, 400);

    const file = form.get('file') as File | null;
    if (!file) return c.json({ error: '未找到文件字段' }, 400);

    const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!ALLOWED.includes(file.type)) {
      return c.json({ error: '仅支持 JPG/PNG/GIF/WebP 图片' }, 400);
    }
    const MAX = 5 * 1024 * 1024;
    if (file.size > MAX) return c.json({ error: '截图不能超过 5MB' }, 400);

    const { put } = await import('@vercel/blob');
    const { v4: uuidv4 } = await import('uuid');
    const ext = file.name.split('.').pop() || 'jpg';
    const pathname = `feedback/${uuidv4()}.${ext}`;
    const blob = await put(pathname, file, { access: 'public', token, addRandomSuffix: false });
    return c.json({ url: blob.url });
  } catch (e: any) {
    return c.json({ error: e?.message || '上传失败' }, 500);
  }
});

// ---- User feedback / bug report ----
app.post('/feedback', async (c) => {
  try {
    // Rate limit: 5 feedback submissions per IP per 10 minutes
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rl = await checkRateLimit(`feedback:${ip}`, 5, 600);
    if (!rl.allowed) return c.json({ error: '提交过于频繁，请稍后再试' }, 429);

    const body = await c.req.json();
    const { type, subject, message, url, userId, userEmail, browser, timestamp, screenshots } = body;

    // Input length limits
    if (!message || typeof message !== 'string') return c.json({ error: '请填写反馈内容' }, 400);
    if (message.length > 5000) return c.json({ error: '反馈内容不能超过 5000 字' }, 400);
    if (subject && subject.length > 200) return c.json({ error: '主题不能超过 200 字' }, 400);
    const brand = await getBrandConfig();
    const { v4: uuidv4 } = await import('uuid');

    const typeLabels: Record<string, string> = {
      bug: '🐛 Bug 反馈',
      suggestion: '💡 功能建议',
      complaint: '📢 投诉建议',
      other: '💬 其他反馈',
    };
    const typeLabel = typeLabels[type] || '反馈';
    const screenshotUrls: string[] = Array.isArray(screenshots) ? screenshots.filter(Boolean) : [];

    // Persist to Turso DB
    const feedbackId = uuidv4();
    await db.execute({
      sql: `INSERT INTO user_feedback (id, type, subject, message, url, user_id, user_email, browser, screenshots, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`,
      args: [
        feedbackId,
        type || 'other',
        subject || null,
        message || '',
        url || null,
        userId || null,
        userEmail || null,
        browser || null,
        screenshotUrls.length > 0 ? JSON.stringify(screenshotUrls) : null,
        new Date(timestamp || Date.now()).toISOString(),
      ],
    });

    const screenshotsHtml = screenshotUrls.length > 0
      ? `<div class="section">
          <div class="label">附件截图（${screenshotUrls.length} 张）</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">
            ${screenshotUrls.map(u => `<a href="${u}" target="_blank"><img src="${u}" style="max-width:200px;max-height:160px;border-radius:6px;border:1px solid #e5e7eb;object-fit:cover" /></a>`).join('')}
          </div>
        </div>`
      : '';

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:24px}
  .card{background:#fff;border-radius:8px;padding:24px;max-width:700px;margin:0 auto;border:1px solid #e5e7eb}
  h1{font-size:20px;color:#111;margin:0 0 4px}
  .meta{font-size:13px;color:#6b7280;margin-bottom:20px}
  .section{margin-bottom:16px}
  .label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.6px;color:#9ca3af;margin-bottom:4px}
  .value{font-size:14px;color:#111;word-break:break-all}
  .message-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:14px;font-size:14px;color:#374151;white-space:pre-wrap;line-height:1.6}
  .badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:600}
  .badge-bug{background:#fef2f2;color:#dc2626;border:1px solid #fecaca}
  .badge-suggestion{background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe}
  .badge-complaint{background:#fff7ed;color:#c2410c;border:1px solid #fed7aa}
  .badge-other{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
</style></head><body>
<div class="card">
  <h1>用户反馈 — ${brand.siteName}</h1>
  <div class="meta">${new Date(timestamp || Date.now()).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</div>
  <div class="section">
    <div class="label">反馈类型</div>
    <div class="value"><span class="badge badge-${type || 'other'}">${typeLabel}</span></div>
  </div>
  <div class="section">
    <div class="label">主题</div>
    <div class="value">${subject || '（无主题）'}</div>
  </div>
  ${userEmail ? `<div class="section"><div class="label">用户信息</div><div class="value">${userEmail}${userId ? ' (ID: ' + userId + ')' : ''}</div></div>` : ''}
  <div class="section">
    <div class="label">来源页面</div>
    <div class="value">${url || '未知'}</div>
  </div>
  <div class="section">
    <div class="label">详细描述</div>
    <div class="message-box">${(message || '（无描述）').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  </div>
  ${screenshotsHtml}
  <div class="section">
    <div class="label">浏览器 / 设备</div>
    <div class="value">${browser || '未知'}</div>
  </div>
  <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af">
    反馈 ID: ${feedbackId}
  </div>
</div></body></html>`;

    sendEmail(
      brand.supportEmail,
      `[用户反馈] ${typeLabel} — ${subject || '无主题'} — ${brand.siteName}`,
      html
    ).catch(() => {});

    return c.json({ ok: true, id: feedbackId });
  } catch (e) {
    return c.json({ ok: false, error: 'Failed to send feedback' }, 500);
  }
});

// ---- Admin: list feedback ----
app.get('/admin/feedback', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);

  const status = c.req.query('status') || '';
  const type = c.req.query('type') || '';
  const limit = Math.min(Number(c.req.query('limit') || 50), 100);
  const offset = Number(c.req.query('offset') || 0);

  let sql = 'SELECT * FROM user_feedback';
  const args: unknown[] = [];
  const conditions: string[] = [];
  if (status) { conditions.push('status = ?'); args.push(status); }
  if (type) { conditions.push('type = ?'); args.push(type); }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  args.push(limit, offset);

  const [rows, countRow] = await Promise.all([
    db.execute({ sql, args }),
    db.execute({
      sql: `SELECT COUNT(*) as cnt FROM user_feedback${conditions.length ? ' WHERE ' + conditions.join(' AND ') : ''}`,
      args: args.slice(0, -2),
    }),
  ]);

  const items = rows.rows.map(r => ({
    ...r,
    screenshots: r.screenshots ? JSON.parse(r.screenshots as string) : [],
  }));

  return c.json({ items, total: Number(countRow.rows[0]?.cnt ?? 0) });
});

// ---- Admin: update feedback status / note ----
app.patch('/admin/feedback/:id', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);

  const id = c.req.param('id');
  const body = await c.req.json();
  const updates: string[] = [];
  const args: unknown[] = [];
  if ('status' in body) { updates.push('status = ?'); args.push(body.status); }
  if ('admin_note' in body) { updates.push('admin_note = ?'); args.push(body.admin_note); }
  if (!updates.length) return c.json({ error: '无更新字段' }, 400);
  args.push(id);
  await db.execute({ sql: `UPDATE user_feedback SET ${updates.join(', ')} WHERE id = ?`, args });
  return c.json({ ok: true });
});

// ---- Admin: unread feedback count ----
app.get('/admin/feedback/count', requireAuth, async (c) => {
  const { is_admin } = getAuth(c);
  if (!is_admin) return c.json({ error: '无权限' }, 403);
  const row = await db.execute("SELECT COUNT(*) as cnt FROM user_feedback WHERE status = 'new'");
  return c.json({ count: Number(row.rows[0]?.cnt ?? 0) });
});

export default app;
