import { Hono } from 'hono';
import { put } from '@vercel/blob';
import { requireAuth, getAuth } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const app = new Hono();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf', 'application/zip'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

// POST /api/upload  — authenticated file upload → Vercel Blob
app.post('/', requireAuth, async (c) => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return c.json({ error: '文件上传服务未配置' }, 503);

  const { sub } = getAuth(c);
  const contentType = c.req.header('content-type') || '';

  if (!contentType.includes('multipart/form-data')) {
    return c.json({ error: '请使用 multipart/form-data 上传' }, 400);
  }

  const form = await c.req.formData().catch(() => null);
  if (!form) return c.json({ error: '解析表单失败' }, 400);

  const file = form.get('file') as File | null;
  const folder = (form.get('folder') as string) || 'uploads';

  if (!file) return c.json({ error: '未找到文件字段' }, 400);
  if (!ALLOWED_TYPES.includes(file.type)) {
    return c.json({ error: '不支持该文件类型' }, 400);
  }
  if (file.size > MAX_SIZE) {
    return c.json({ error: `文件不能超过 ${MAX_SIZE / 1024 / 1024}MB` }, 400);
  }

  const ext = file.name.split('.').pop() || 'bin';
  const pathname = `${folder}/${sub}/${uuidv4()}.${ext}`;

  const blob = await put(pathname, file, {
    access: 'public',
    token,
    addRandomSuffix: false,
  });

  return c.json({ url: blob.url, pathname: blob.pathname });
});

export default app;
