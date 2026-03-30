import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get('BLOB_READ_WRITE_TOKEN');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Blob storage not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contentType = req.headers.get('content-type') || '';

    let file: Blob;
    let fileType: string;
    let folder = 'uploads';
    let originalName = 'file';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const fileEntry = formData.get('file') as File | null;
      if (!fileEntry) {
        return new Response(JSON.stringify({ error: '没有上传文件' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      file = fileEntry;
      fileType = fileEntry.type;
      originalName = fileEntry.name;
      folder = (formData.get('folder') as string) || 'uploads';
    } else {
      // Raw binary body with headers
      fileType = req.headers.get('x-file-type') || 'application/octet-stream';
      originalName = req.headers.get('x-file-name') || 'file';
      folder = req.headers.get('x-folder') || 'uploads';
      file = new Blob([await req.arrayBuffer()], { type: fileType });
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(fileType)) {
      return new Response(JSON.stringify({ error: '不支持的文件格式，仅支持 JPG、PNG、GIF、WebP、SVG' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return new Response(JSON.stringify({ error: `文件过大，最大支持 5MB` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate unique filename
    const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const uniqueName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Upload to Vercel Blob REST API
    const blobRes = await fetch(`https://blob.vercel-storage.com/${uniqueName}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': fileType,
        'x-api-version': '7',
        'x-cache-control-max-age': '31536000',
      },
      body: file,
    });

    if (!blobRes.ok) {
      const errText = await blobRes.text();
      console.error('Vercel Blob error:', blobRes.status, errText);
      return new Response(JSON.stringify({ error: '上传失败，请重试' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await blobRes.json();

    return new Response(JSON.stringify({ url: result.url, pathname: result.pathname }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('upload-blob error:', err);
    return new Response(JSON.stringify({ error: err.message || '上传失败' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
