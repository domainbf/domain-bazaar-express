import { supabase } from '@/integrations/supabase/client';

export interface BlobUploadResult {
  url: string;
  pathname: string;
}

export interface BlobUploadOptions {
  folder?: string;
  bucket?: string;
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
  const { folder = 'uploads', bucket = 'domain-logos', onProgress } = options;

  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('请先登录后再上传文件');

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const pathname = `${folder}/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  onProgress?.(30);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(pathname, file, { contentType: file.type, upsert: true, cacheControl: '31536000' });
  if (error) throw new Error(error.message || '上传失败');

  onProgress?.(100);
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(pathname);
  if (!pub?.publicUrl) throw new Error('上传失败：未返回文件地址');
  return { url: pub.publicUrl, pathname };
}


export async function uploadAvatar(file: File): Promise<string> {
  const result = await uploadToBlob(file, { folder: 'avatars', bucket: 'avatars' });
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
