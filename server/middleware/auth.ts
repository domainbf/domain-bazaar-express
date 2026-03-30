import { Context, Next } from 'hono';
import { verifyToken, JWTPayload } from '../jwt.js';

export async function requireAuth(c: Context, next: Next) {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: '未登录' }, 401);
  }
  const token = header.slice(7);
  try {
    const payload = await verifyToken(token);
    if (payload.type !== 'access') {
      return c.json({ error: '无效 token 类型' }, 401);
    }
    c.set('jwtPayload', payload as JWTPayload);
    await next();
  } catch {
    return c.json({ error: 'token 已失效，请重新登录' }, 401);
  }
}

export function getAuth(c: Context): JWTPayload {
  return c.get('jwtPayload') as JWTPayload;
}
