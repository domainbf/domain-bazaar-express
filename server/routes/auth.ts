import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../jwt.js';
import { requireAuth, getAuth } from '../middleware/auth.js';
import { bus } from '../eventBus.js';

const app = new Hono();

function now() {
  return new Date().toISOString();
}

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
  const r = await db.execute({
    sql: 'SELECT * FROM profiles WHERE id = ?',
    args: [userId]
  });
  return r.rows[0] || null;
}

async function checkIsAdmin(userId: string): Promise<boolean> {
  const r = await db.execute({
    sql: "SELECT 1 FROM admin_roles WHERE user_id = ? AND role = 'admin'",
    args: [userId]
  });
  return r.rows.length > 0;
}

async function issueTokenPair(userId: string, email: string, isAdmin: boolean, userAgent?: string) {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({ sub: userId, email, is_admin: isAdmin }),
    signRefreshToken({ sub: userId, email, is_admin: isAdmin })
  ]);
  const sessionId = uuidv4();
  const refreshHash = await bcrypt.hash(refreshToken, 6);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await db.execute({
    sql: 'INSERT INTO app_sessions (id, user_id, refresh_token_hash, expires_at, user_agent, created_at) VALUES (?,?,?,?,?,?)',
    args: [sessionId, userId, refreshHash, expiresAt, userAgent || null, now()]
  });
  return { accessToken, refreshToken, sessionId };
}

// POST /api/auth/register
app.post('/register', async (c) => {
  const { email, password, full_name } = await c.req.json();
  if (!email || !password) return c.json({ error: '邮箱和密码不能为空' }, 400);
  if (password.length < 6) return c.json({ error: '密码至少 6 位' }, 400);

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

  // Create profile
  const displayName = full_name || emailLower.split('@')[0];
  const existingProfile = await getProfile(id);
  if (!existingProfile) {
    await db.execute({
      sql: 'INSERT OR IGNORE INTO profiles (id, full_name, created_at, updated_at) VALUES (?,?,?,?)',
      args: [id, displayName, t, t]
    });
  }

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

  let authUser = await findAuthUser(email);

  if (!authUser) {
    // Try to migrate from Supabase profiles (user exists there but not in app_auth_users yet)
    // We can't verify password against Supabase without calling their API
    return c.json({ error: '账号不存在，请先注册' }, 401);
  }

  const valid = await bcrypt.compare(password, authUser.password_hash as string);
  if (!valid) return c.json({ error: '密码错误' }, 401);

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

  const sessions = await db.execute({
    sql: 'SELECT * FROM app_sessions WHERE user_id = ? AND expires_at > ?',
    args: [payload.sub, now()]
  });

  let validSession = null;
  for (const s of sessions.rows) {
    if (await bcrypt.compare(refreshToken, s.refresh_token_hash as string)) {
      validSession = s;
      break;
    }
  }
  if (!validSession) return c.json({ error: '会话已失效，请重新登录' }, 401);

  await db.execute({ sql: 'DELETE FROM app_sessions WHERE id = ?', args: [validSession.id] });

  const isAdmin = await checkIsAdmin(payload.sub);
  const ua = c.req.header('User-Agent');
  const { accessToken, refreshToken: newRefreshToken } = await issueTokenPair(payload.sub, payload.email, isAdmin, ua);

  return c.json({ accessToken, refreshToken: newRefreshToken });
});

// POST /api/auth/logout
app.post('/logout', requireAuth, async (c) => {
  const { sub } = getAuth(c);
  const { refreshToken } = await c.req.json().catch(() => ({}));

  if (refreshToken) {
    const sessions = await db.execute({
      sql: 'SELECT * FROM app_sessions WHERE user_id = ?',
      args: [sub]
    });
    for (const s of sessions.rows) {
      if (await bcrypt.compare(refreshToken, s.refresh_token_hash as string)) {
        await db.execute({ sql: 'DELETE FROM app_sessions WHERE id = ?', args: [s.id] });
        break;
      }
    }
  } else {
    await db.execute({ sql: 'DELETE FROM app_sessions WHERE user_id = ?', args: [sub] });
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
  const allowed = ['full_name', 'username', 'phone', 'bio', 'company', 'website', 'avatar_url',
    'is_seller', 'preferred_language', 'preferred_payment_methods', 'notification_preferences'];
  const updates: string[] = [];
  const args: unknown[] = [];
  for (const key of allowed) {
    if (key in body) {
      updates.push(`${key} = ?`);
      const val = body[key];
      args.push(typeof val === 'object' ? JSON.stringify(val) : val);
    }
  }
  if (updates.length === 0) return c.json({ error: '无可更新字段' }, 400);
  updates.push('updated_at = ?');
  args.push(now());
  args.push(sub);
  await db.execute({ sql: `UPDATE profiles SET ${updates.join(', ')} WHERE id = ?`, args });
  const profile = await getProfile(sub);
  bus.publish({ table: 'profiles', eventType: 'UPDATE', new: profile as Record<string, unknown>, userId: sub });
  return c.json({ profile });
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
  await db.execute({ sql: 'DELETE FROM app_sessions WHERE user_id = ?', args: [sub] });
  return c.json({ success: true });
});

// POST /api/auth/request-reset
app.post('/request-reset', async (c) => {
  const { email } = await c.req.json();
  if (!email) return c.json({ error: '请输入邮箱' }, 400);
  const authUser = await findAuthUser(email);
  // Always return success to prevent enumeration
  if (authUser) {
    const token = uuidv4().replace(/-/g, '');
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await db.execute({
      sql: 'UPDATE app_auth_users SET reset_token = ?, reset_token_expires = ?, updated_at = ? WHERE id = ?',
      args: [token, expires, now(), authUser.id]
    });
    // In production: send email with reset link. For now, log it.
    console.log(`[PASSWORD RESET] token for ${email}: ${token}`);
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
  await db.execute({ sql: 'DELETE FROM app_sessions WHERE user_id = ?', args: [user.id] });
  return c.json({ success: true });
});

export default app;
