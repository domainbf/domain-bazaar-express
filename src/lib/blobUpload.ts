import { apiFetch } from './apiClient';

export interface BlobUploadResult {
  url: string;
  pathname: string;
}

export interface BlobUploadOptions {
  folder?: string;
  onProgress?: (pct: number) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 5 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return '仅支持 JPG、PNG、GIF、WebP、SVG 格式的图片';
  }
  if (file.size > MAX_SIZE) {
    return `图片大小不能超过 5MB，当前大小为 ${Math.round(file.size / 1024)}KB`;
  }
  return null;
}

export async function uploadToBlob(
  file: File,
  options: BlobUploadOptions = {}
): Promise<BlobUploadResult> {
  const { folder = 'uploads' } = options;

  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  // Use our custom JWT-authenticated API server instead of Supabase edge function
  const res = await apiFetch('/upload', {
    method: 'POST',
    body: formData,
    // Remove Content-Type so browser sets multipart boundary automatically
    headers: {},
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '上传失败，请重试' }));
    throw new Error(err.error || '上传失败');
  }

  const result = await res.json();
  if (!result.url) throw new Error('上传失败：未返回文件地址');
  return result as BlobUploadResult;
}

export async function uploadAvatar(file: File): Promise<string> {
  const result = await uploadToBlob(file, { folder: 'avatars' });
  return result.url;
}

export async function uploadEvidence(file: File): Promise<string> {
  const result = await uploadToBlob(file, { folder: 'disputes' });
  return result.url;
}

export async function uploadDomainImage(file: File): Promise<string> {
  const result = await uploadToBlob(file, { folder: 'domains' });
  return result.url;
}
