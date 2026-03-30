import { Hono } from 'hono';
import { put, getDownloadUrl } from '@vercel/blob';
import { requireAuth, getAuth } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const app = new Hono();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

// POST /api/upload  — authenticated file upload → Vercel Blob (private store)
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
    return c.json({ error: '不支持该文件类型（仅 JPG/PNG/GIF/WebP/SVG/PDF）' }, 400);
  }
  if (file.size > MAX_SIZE) {
    return c.json({ error: `文件不能超过 ${MAX_SIZE / 1024 / 1024}MB` }, 400);
  }

  const ext = file.name.split('.').pop() || 'bin';
  const pathname = `${folder}/${sub}/${uuidv4()}.${ext}`;

  const blob = await put(pathname, file, {
    access: 'public',   // will fall back to private below if needed
    token,
    addRandomSuffix: false,
  }).catch(async (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('private store')) {
      // Private store — upload with private access; return a 1-hour signed download URL
      return put(pathname, file, { access: 'private', token, addRandomSuffix: true });
    }
    throw err;
  });

  // For private blobs generate a short-lived signed URL (1 hour)
  let serveUrl = blob.url;
  if (blob.url.includes('.private.')) {
    try {
      serveUrl = await getDownloadUrl(blob.url, { token, expiresIn: 3600 });
    } catch {
      serveUrl = blob.url; // fallback
    }
  }

  return c.json({ url: serveUrl, storageUrl: blob.url, pathname: blob.pathname });
});

// GET /api/upload/signed?url=<blob_url>  — generate a fresh signed URL for a private blob
// (call this when a stored blob URL has expired)
app.get('/signed', requireAuth, async (c) => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return c.json({ error: '文件上传服务未配置' }, 503);

  const blobUrl = c.req.query('url');
  if (!blobUrl) return c.json({ error: '缺少 url 参数' }, 400);

  const signedUrl = await getDownloadUrl(blobUrl, { token, expiresIn: 3600 });
  return c.json({ url: signedUrl });
});

export default app;
