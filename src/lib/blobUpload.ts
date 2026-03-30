import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = 'https://trqxaizkwuizuhlfmdup.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycXhhaXprd3VpenVobGZtZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2ODk1NzcsImV4cCI6MjA1MDI2NTU3N30.uv3FElLBTsCNr3Vg4PooW7h1o2ZlivAFGawFH-Zqxns';

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

  const { data: { session } } = await supabase.auth.getSession();
  const authToken = session?.access_token;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const res = await fetch(`${SUPABASE_URL}/functions/v1/upload-blob`, {
    method: 'POST',
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      apikey: SUPABASE_ANON_KEY,
    },
    body: formData,
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
