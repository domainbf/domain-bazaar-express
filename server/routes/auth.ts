import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../jwt.js';
import { requireAuth, getAuth } from '../middleware/auth.js';
import { bus } from '../eventBus.js';
import {
  saveSession, getSession, deleteSession,
  deleteAllUserSessions, getUserSessionIds,
  checkRateLimit, cacheGet, cacheSet, cacheDel
} from '../redis.js';

const app = new Hono();

function now() { return new Date().toISOString(); }

async function findAuthUser(email: string) {
  const r = await db.execute({
    sql: 'SELECT * FROM app_auth_users WHERE email = ?',
    args: [email.toLowerCase()]
  });
  return r.rows[0] || null;
}

async function findAuthUserById(id: string) {
  const r = await db.execute({
    sql: 'SELECT * FROM app_auth_users WHERE id = ?',
    args: [id]
  });
  return r.rows[0] || null;
}

async function getProfile(userId: string) {
  // Try cache first
  const cached = await cacheGet<Record<string, unknown>>(`profile:${userId}`);
  if (cached) return cached;

  const r = await db.execute({
    sql: 'SELECT * FROM profiles WHERE id = ?',
    args: [userId]
  });
  const profile = r.rows[0] || null;
  if (profile) await cacheSet(`profile:${userId}`, profile, 300); // 5 min cache
  return profile;
}

async function invalidateProfileCache(userId: string) {
  await cacheDel(`profile:${userId}`);
}

async function checkIsAdmin(userId: string): Promise<boolean> {
  const cached = await cacheGet<boolean>(`is_admin:${userId}`);
  if (cached !== null) return cached;

  const r = await db.execute({
    sql: "SELECT 1 FROM admin_roles WHERE user_id = ? AND role = 'admin'",
    args: [userId]
  });
  const isAdmin = r.rows.length > 0;
  await cacheSet(`is_admin:${userId}`, isAdmin, 600); // 10 min cache
  return isAdmin;
}

async function issueTokenPair(userId: string, email: string, isAdmin: boolean, userAgent?: string) {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({ sub: userId, email, is_admin: isAdmin }),
    signRefreshToken({ sub: userId, email, is_admin: isAdmin })
  ]);
  const sessionId = uuidv4();
  const refreshHash = await bcrypt.hash(refreshToken, 6);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Store session in Redis
  await saveSession(sessionId, {
    userId,
    refreshTokenHash: refreshHash,
    userAgent,
    expiresAt
  });

  return { accessToken, refreshToken, sessionId };
}

// POST /api/auth/register
app.post('/register', async (c) => {
  const { email, password, full_name } = await c.req.json();
  if (!email || !password) return c.json({ error: '邮箱和密码不能为空' }, 400);
  if (password.length < 6) return c.json({ error: '密码至少 6 位' }, 400);

  // Rate limit: 5 registrations per IP per hour
  const ip = c.req.header('x-forwarded-for') || 'unknown';
  const rl = await checkRateLimit(`register:${ip}`, 5, 3600);
  if (!rl.allowed) return c.json({ error: '注册过于频繁，请稍后再试' }, 429);

  const existing = await findAuthUser(email);
  if (existing) return c.json({ error: '该邮箱已注册，请直接登录' }, 409);

  const id = uuidv4();
  const hash = await bcrypt.hash(password, 12);
  const emailLower = email.toLowerCase();
  const t = now();

  await db.execute({
    sql: 'INSERT INTO app_auth_users (id, email, password_hash, is_verified, created_at, updated_at) VALUES (?,?,?,1,?,?)',
    args: [id, emailLower, hash, t, t]
  });

  const displayName = full_name || emailLower.split('@')[0];
  await db.execute({
    sql: 'INSERT INTO profiles (id, full_name, created_at, updated_at) VALUES (?,?,?,?) ON CONFLICT (id) DO NOTHING',
    args: [id, displayName, t, t]
  });

  const isAdmin = await checkIsAdmin(id);
  const ua = c.req.header('User-Agent');
  const { accessToken, refreshToken } = await issueTokenPair(id, emailLower, isAdmin, ua);
  const profile = await getProfile(id);

  bus.publish({ table: 'profiles', eventType: 'INSERT', new: { id, email: emailLower }, userId: id });

  return c.json({ accessToken, refreshToken, user: { id, email: emailLower, is_admin: isAdmin }, profile });
});

// POST /api/auth/login
app.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  if (!email || !password) return c.json({ error: '请输入邮箱和密码' }, 400);

  // Rate limit: 10 login attempts per IP per 15 min
  const ip = c.req.header('x-forwarded-for') || 'unknown';
  const rl = await checkRateLimit(`login:${ip}`, 10, 900);
  if (!rl.allowed) return c.json({ error: '登录尝试过多，请15分钟后再试' }, 429);

  const authUser = await findAuthUser(email);
  if (!authUser) return c.json({ error: '账号不存在，请先注册' }, 401);

  const valid = await bcrypt.compare(password, authUser.password_hash as string);
  if (!valid) {
    // Per-account lockout tracking
    const lockKey = `login_fail:${authUser.id}`;
    const fails = await checkRateLimit(lockKey, 5, 300); // 5 fails per 5 min
    if (!fails.allowed) return c.json({ error: '密码错误次数过多，账户已暂时锁定（5分钟）' }, 429);
    return c.json({ error: '密码错误' }, 401);
  }

  const userId = authUser.id as string;
  const emailStr = authUser.email as string;
  const isAdmin = await checkIsAdmin(userId);
  const ua = c.req.header('User-Agent');
  const { accessToken, refreshToken } = await issueTokenPair(userId, emailStr, isAdmin, ua);
  const profile = await getProfile(userId);

  return c.json({ accessToken, refreshToken, user: { id: userId, email: emailStr, is_admin: isAdmin }, profile });
});

// POST /api/auth/refresh
app.post('/refresh', async (c) => {
  const { refreshToken } = await c.req.json();
  if (!refreshToken) return c.json({ error: '缺少 refresh token' }, 400);

  let payload;
  try {
    payload = await verifyToken(refreshToken);
    if (payload.type !== 'refresh') throw new Error('wrong type');
  } catch {
    return c.json({ error: 'refresh token 无效或已过期' }, 401);
  }

  // Find matching session in Redis
  const sessionIds = await getUserSessionIds(payload.sub);
  let validSessionId: string | null = null;

  for (const sid of sessionIds) {
    const session = await getSession(sid);
    if (!session) continue;
    if (await bcrypt.compare(refreshToken, session.refreshTokenHash)) {
      validSessionId = sid;
      break;
    }
  }

  if (!validSessionId) return c.json({ error: '会话已失效，请重新登录' }, 401);
  await deleteSession(validSessionId, payload.sub);

  const isAdmin = await checkIsAdmin(payload.sub);
  const ua = c.req.header('User-Agent');
  const { accessToken, refreshToken: newRefreshToken } = await issueTokenPair(payload.sub, payload.email, isAdmin, ua);

  return c.json({ accessToken, refreshToken: newRefreshToken });
});

// POST /api/auth/logout
app.post('/logout', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const { refreshToken, allDevices } = await c.req.json().catch(() => ({}));

  if (allDevices) {
    await deleteAllUserSessions(sub);
  } else if (refreshToken) {
    const sessionIds = await getUserSessionIds(sub);
    for (const sid of sessionIds) {
      const session = await getSession(sid);
      if (session && await bcrypt.compare(refreshToken, session.refreshTokenHash)) {
        await deleteSession(sid, sub);
        break;
      }
    }
  } else {
    await deleteAllUserSessions(sub);
  }

  return c.json({ success: true });
});

// GET /api/auth/me
app.get('/me', requireAuth, async (c) => {
  const { sub, email, is_admin } = getAuth(c);
  const profile = await getProfile(sub);
  return c.json({ user: { id: sub, email, is_admin }, profile });
});

// PATCH /api/auth/profile
app.patch('/profile', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const body = await c.req.json();
  // Map frontend field aliases to actual DB column names
  const fieldMap: Record<string, string> = {
    phone: 'contact_phone',
    company: 'company_name',
  };
  const allowed = ['full_name', 'username', 'contact_phone', 'bio', 'company_name',
    'contact_email', 'custom_url', 'avatar_url', 'is_seller', 'preferred_payment_methods'];
  const updates: string[] = [];
  const args: unknown[] = [];
  for (const key of allowed) {
    const bodyKey = Object.keys(fieldMap).find(k => fieldMap[k] === key) ?? key;
    if (key in body || bodyKey in body) {
      const val = body[key] ?? body[bodyKey];
      updates.push(`${key} = ?`);
      args.push(typeof val === 'object' ? JSON.stringify(val) : val);
    }
  }
  if (updates.length === 0) return c.json({ error: '无可更新字段' }, 400);
  updates.push('updated_at = ?');
  args.push(now());
  args.push(sub);
  await db.execute({ sql: `UPDATE profiles SET ${updates.join(', ')} WHERE id = ?`, args });
  await invalidateProfileCache(sub);
  const profile = await getProfile(sub);
  bus.publish({ table: 'profiles', eventType: 'UPDATE', new: profile as Record<string, unknown>, userId: sub });
  return c.json({ profile });
});

// POST /api/auth/change-email
app.post('/change-email', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const { newEmail, password } = await c.req.json();
  if (!newEmail || !password) return c.json({ error: '请提供新邮箱和当前密码' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return c.json({ error: '邮箱格式无效' }, 400);

  const authUser = await findAuthUserById(sub);
  if (!authUser) return c.json({ error: '用户不存在' }, 404);

  const valid = await bcrypt.compare(password, authUser.password_hash as string);
  if (!valid) return c.json({ error: '当前密码错误' }, 400);

  const existing = await findAuthUser(newEmail);
  if (existing && (existing.id as string) !== sub) return c.json({ error: '该邮箱已被其他账户使用' }, 409);

  await db.execute({
    sql: 'UPDATE app_auth_users SET email = ?, updated_at = ? WHERE id = ?',
    args: [newEmail.toLowerCase(), now(), sub]
  });
  await db.execute({
    sql: 'UPDATE profiles SET contact_email = ?, updated_at = ? WHERE id = ?',
    args: [newEmail.toLowerCase(), now(), sub]
  });
  await invalidateProfileCache(sub);
  return c.json({ success: true, message: '邮箱已更新' });
});

// POST /api/auth/change-password
app.post('/change-password', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const { currentPassword, newPassword } = await c.req.json();
  if (!currentPassword || !newPassword) return c.json({ error: '请提供当前密码和新密码' }, 400);
  if (newPassword.length < 6) return c.json({ error: '新密码至少 6 位' }, 400);

  const authUser = await findAuthUserById(sub);
  if (!authUser) return c.json({ error: '用户不存在' }, 404);

  const valid = await bcrypt.compare(currentPassword, authUser.password_hash as string);
  if (!valid) return c.json({ error: '当前密码错误' }, 400);

  const hash = await bcrypt.hash(newPassword, 12);
  await db.execute({ sql: 'UPDATE app_auth_users SET password_hash = ?, updated_at = ? WHERE id = ?', args: [hash, now(), sub] });
  // Invalidate all sessions on password change
  await deleteAllUserSessions(sub);
  return c.json({ success: true });
});

// ── Email sender via Resend API ─────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  // Read SMTP/Resend credentials from DB
  const smtpRow = await db.execute('SELECT host, username, password, from_email, from_name FROM smtp_settings WHERE enabled = 1 LIMIT 1');
  const smtp = smtpRow.rows[0] as Record<string, unknown> | undefined;

  const apiKey = (smtp?.password as string) || '';
  const fromEmail = (smtp?.from_email as string) || 'noreply@nic.rw';
  const fromName = (smtp?.from_name as string) || '域见·你';

  if (!apiKey) {
    console.warn('[EMAIL] No SMTP/Resend API key found — email not sent');
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: `${fromName} <${fromEmail}>`, to: [to], subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[EMAIL] Resend API error:', res.status, err);
  } else {
    console.log(`[EMAIL] Sent to ${to} — subject: ${subject}`);
  }
}

// POST /api/auth/request-reset
app.post('/request-reset', async (c) => {
  const { email } = await c.req.json();
  if (!email) return c.json({ error: '请输入邮箱' }, 400);

  // Rate limit: 3 resets per email per hour
  const rl = await checkRateLimit(`reset:${email.toLowerCase()}`, 3, 3600);
  if (!rl.allowed) return c.json({ error: '请求过于频繁，请稍后再试' }, 429);

  const authUser = await findAuthUser(email);
  if (authUser) {
    const token = uuidv4().replace(/-/g, '');
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await db.execute({
      sql: 'UPDATE app_auth_users SET reset_token = ?, reset_token_expires = ?, updated_at = ? WHERE id = ?',
      args: [token, expires, now(), authUser.id]
    });

    // Send password reset email
    const baseUrl = 'https://nic.rw';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'PingFang SC',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#111;padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:1px;">域见·你</h1>
      <p style="margin:4px 0 0;color:#aaa;font-size:13px;">NIC.RW / NIC.BN 域名交易平台</p>
    </div>
    <div style="padding:36px 32px;">
      <h2 style="margin:0 0 16px;color:#111;font-size:20px;">重置您的密码</h2>
      <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">
        我们收到了对账号 <strong>${email}</strong> 的密码重置请求。点击下方按钮设置新密码，链接有效期 <strong>1 小时</strong>。
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600;letter-spacing:0.5px;">重置密码</a>
      </div>
      <p style="margin:0 0 8px;color:#999;font-size:13px;">如果按钮无法点击，请复制以下链接到浏览器：</p>
      <p style="margin:0 0 24px;color:#666;font-size:12px;word-break:break-all;background:#f5f5f5;padding:10px 14px;border-radius:6px;">${resetUrl}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="margin:0;color:#bbb;font-size:12px;">如果您没有请求重置密码，请忽略此邮件。您的账号仍然安全。</p>
    </div>
  </div>
</body>
</html>`;

    // Send in background — don't block the response
    sendEmail(email, '域见·你 — 重置您的密码', html).catch(e =>
      console.error('[EMAIL] Failed to send reset email:', e)
    );
  }
  return c.json({ success: true, message: '如果该邮箱已注册，您将收到重置密码邮件' });
});

// POST /api/auth/reset-password
app.post('/reset-password', async (c) => {
  const { token, newPassword } = await c.req.json();
  if (!token || !newPassword) return c.json({ error: '缺少必要参数' }, 400);
  if (newPassword.length < 6) return c.json({ error: '密码至少 6 位' }, 400);

  const r = await db.execute({
    sql: 'SELECT * FROM app_auth_users WHERE reset_token = ? AND reset_token_expires > ?',
    args: [token, now()]
  });
  if (!r.rows[0]) return c.json({ error: '重置链接无效或已过期' }, 400);

  const user = r.rows[0];
  const hash = await bcrypt.hash(newPassword, 12);
  await db.execute({
    sql: 'UPDATE app_auth_users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = ? WHERE id = ?',
    args: [hash, now(), user.id]
  });
  await deleteAllUserSessions(user.id as string);
  return c.json({ success: true });
});

export default app;
