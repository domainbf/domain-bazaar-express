import { supabase } from '@/integrations/supabase/client';

export interface ModelScopeConfig {
  apiKey: string;
  model: string;
}

async function getModelScopeConfig(): Promise<ModelScopeConfig | null> {
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['modelscope_api_key', 'modelscope_model']);
  if (!data?.length) return null;
  const map: Record<string, string> = {};
  data.forEach(r => { map[r.key] = r.value || ''; });
  if (!map['modelscope_api_key']) return null;
  return {
    apiKey: map['modelscope_api_key'],
    model: map['modelscope_model'] || 'iic/Z-Image-Turbo',
  };
}

function buildLogoPrompt(domainName: string): string {
  const name = domainName.split('.')[0].toUpperCase();
  return `Minimalist monochrome logo for the domain "${domainName}". Clean bold typography spelling "${name}", flat design, pure black on white background, no gradients, no colors, professional brand mark, simple geometric style, high contrast, suitable for both dark and light backgrounds.`;
}

const MODEL_ENDPOINTS: Record<string, string> = {
  'iic/Z-Image-Turbo': 'https://api-inference.modelscope.cn/v1/images/generations',
  'flux.1': 'https://api-inference.modelscope.cn/v1/images/generations',
  'qwen-vl-plus': 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
};

export async function generateDomainLogo(domainName: string, config: ModelScopeConfig): Promise<string> {
  const prompt = buildLogoPrompt(domainName);
  const endpoint = MODEL_ENDPOINTS[config.model] || MODEL_ENDPOINTS['iic/Z-Image-Turbo'];

  const isDashScope = endpoint.includes('dashscope');

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${config.apiKey}`,
    'Content-Type': 'application/json',
  };

  let body: object;
  if (isDashScope) {
    body = {
      model: config.model,
      input: { prompt },
      parameters: { size: '512*512', n: 1, style: '<auto>' },
    };
  } else {
    body = {
      model: config.model,
      prompt,
      n: 1,
      size: '512x512',
    };
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`ModelScope API 错误 ${res.status}: ${errText}`);
  }

  const json = await res.json();

  let imageUrl = '';
  if (isDashScope) {
    imageUrl = json?.output?.results?.[0]?.url || json?.output?.url || '';
  } else {
    imageUrl = json?.data?.[0]?.url || json?.images?.[0]?.url || json?.url || '';
  }

  if (!imageUrl) {
    throw new Error('API 未返回图片URL，请检查模型或密钥是否正确');
  }
  return imageUrl;
}

export async function generateAndSaveDomainLogo(
  domainId: string,
  domainName: string,
  onProgress?: (msg: string) => void
): Promise<string | null> {
  try {
    const config = await getModelScopeConfig();
    if (!config) {
      onProgress?.('未配置 ModelScope API，跳过logo生成');
      return null;
    }
    onProgress?.('正在生成域名Logo...');
    const imageUrl = await generateDomainLogo(domainName, config);
    await supabase.from('site_settings').upsert(
      { key: `domain_logo_${domainId}`, value: imageUrl, section: 'domain_logos', type: 'text', description: `Logo for domain ${domainName}` },
      { onConflict: 'key' }
    );
    onProgress?.('Logo 生成成功！');
    return imageUrl;
  } catch (err: any) {
    onProgress?.(`Logo 生成失败: ${err.message}`);
    return null;
  }
}

export async function getDomainLogoUrl(domainId: string): Promise<string | null> {
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', `domain_logo_${domainId}`)
    .maybeSingle();
  return data?.value || null;
}

export { getModelScopeConfig };
