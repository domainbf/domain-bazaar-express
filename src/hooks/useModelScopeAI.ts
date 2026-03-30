import { supabase } from '@/integrations/supabase/client';

export interface ModelScopeConfig {
  apiKey: string;
  model: string;
}

export type DomainLogoType = 'auction' | 'hot' | 'premium' | 'sold' | 'tech' | 'short' | 'general';

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

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const PROMPT_STYLES = {
  auction: [
    'Bold dramatic auction-house emblem, heavy black ink on white, sharp angular letterforms, intense weight contrast, gavel motif subtle background element, high-impact monochrome',
    'Aggressive typographic logo, thick slab-serif letterforms, auction bidding energy, heavy black ink strokes, white negative space cuts, ultra-bold monochrome design',
    'Dark intense brand mark, stark black and white contrast, oversized letterform cropped composition, editorial magazine style, no color, crisp print-ready',
    'Powerful monochrome wordmark with dynamic diagonal slash element, auction energy, hand-crafted letterpress aesthetic, pure black on white, strong visual tension',
  ],
  hot: [
    'Sleek minimal wordmark, thin elegant strokes, high-fashion magazine typographic logo, pure black letterforms on white ground, airy spacing, refined monochrome',
    'Modern geometric brand mark, clean circles and lines, Swiss design grid, black on white, no texture, flat monochrome logo system, contemporary startup aesthetic',
    'Confident sans-serif logo with subtle ligature detail, editorial black and white, balanced whitespace, professional clean identity, monochrome only',
    'Flowing calligraphic letterforms rendered in pure black ink, white background, organic brush energy meets precision, high-contrast monochrome logo',
  ],
  premium: [
    'Ultra-luxury monogram seal, fine hairline strokes, classical heraldic composition modernized, pristine white and deep black, premium jewelry brand aesthetic',
    'Minimal high-end wordmark, Helvetica-inspired precision, generous whitespace, single weight variation, Chanel-inspired elegance, pure monochrome',
    'Premium emblem with geometric frame, thin border elements, centered letterform focal point, luxury real estate brand style, crisp black and white only',
    'Elegant editorial logotype, contrast between ultra-thin and ultra-bold letterforms, luxury magazine masthead style, high-end black and white typographic identity',
  ],
  sold: [
    'Celebratory achievement stamp mark, bold checkmark integrated into letterforms, black on white, completed-deal energy, strong confident monochrome',
    'Triumphant wordmark with subtle award ribbon element, classic black ink on white, commemorative certificate aesthetic, authoritative monochrome logo',
    'Clean success mark with circular badge composition, black and white only, professional sold-property style, institutional monochrome seal design',
    'Bold transaction-complete badge, rectangular stamp with letter-press texture aesthetic, heavy black ink, crisp white background, official document style',
  ],
  tech: [
    'Precise technical monogram, circuit-board inspired geometric elements, crisp pixel-perfect black on white, developer tool brand aesthetic, monochrome',
    'Angular tech wordmark with subtle grid reference, sharp corners, binary-inspired negative space pattern, high-contrast black and white, digital precision',
    'Minimalist code-style logo, monospaced letterforms, terminal cursor detail, pure black on white background, developer-culture monochrome brand',
    'Geometric tech icon with hexagonal structure, abstract node network subtle texture, jet black and white, clean scalable mark, API-company aesthetic',
  ],
  short: [
    'Oversized single or double letter mark, bold geometric construction, iconic symbol mark style, pure black on white, instantly recognizable monochrome',
    'Abstract initials interlock, negative space creates secondary letterform, black and white optical illusion mark, sophisticated brand symbol',
    'Monumental typographic mark, single letterform treated as architectural object, dramatic scale contrast, pure monochrome, gallery-art inspired',
    'Contoured letter outline filled with crosshatch texture, printmaking aesthetic, one or two character bold mono logo, pure black and white artisanal feel',
  ],
  general: [
    'Clean professional wordmark, balanced sans-serif typography, domain registrar brand style, pure black on white, trustworthy monochrome identity',
    'Friendly approachable logo, rounded letterforms, small subtle domain globe icon accent, black and white only, modern web company aesthetic',
    'Sharp contemporary brand mark, precise letter spacing, minimal accent line detail, confident black ink on white, professional monochrome logo',
    'Classic timeless wordmark, proportional letterforms, subtle underline or dot accent, black and white, enduring professional brand identity',
  ],
};

function detectLogoType(domainName: string, category?: string): DomainLogoType {
  if (category === 'premium' || category === 'high_value') return 'premium';
  if (category === 'dev') return 'tech';
  const base = domainName.split('.')[0].toLowerCase();
  if (base.length <= 3) return 'short';
  if (/^(ai|tech|dev|code|api|cloud|data|io|app)/.test(base)) return 'tech';
  return 'general';
}

export function buildLogoPrompt(domainName: string, type?: DomainLogoType, category?: string): string {
  const resolvedType = type || detectLogoType(domainName, category);
  const base = domainName.split('.')[0].toUpperCase();
  const ext = domainName.includes('.') ? domainName.split('.').slice(1).join('.').toUpperCase() : '';
  const stylePrompt = pickRandom(PROMPT_STYLES[resolvedType]);
  
  const subject = base.length <= 4
    ? `for the domain "${domainName}", featuring the letters "${base}"`
    : `for the domain "${domainName}", with the text "${base}"${ext ? ` and TLD ".${ext}"` : ''}`;

  return `${stylePrompt}, created ${subject}. CRITICAL: pure black and white ONLY, no gray tones, no color whatsoever, solid black (#000000) and solid white (#FFFFFF) only, square format 1:1, logo/brand identity design, white background, professional vector-style artwork`;
}

const MODEL_ENDPOINTS: Record<string, string> = {
  'iic/Z-Image-Turbo': 'https://api-inference.modelscope.cn/v1/images/generations',
  'stabilityai/stable-diffusion-xl-base-1.0': 'https://api-inference.modelscope.cn/v1/images/generations',
  'black-forest-labs/FLUX.1-schnell': 'https://api-inference.modelscope.cn/v1/images/generations',
  'black-forest-labs/FLUX.1-dev': 'https://api-inference.modelscope.cn/v1/images/generations',
};

export async function generateDomainLogo(
  domainName: string,
  config: ModelScopeConfig,
  type?: DomainLogoType,
  category?: string
): Promise<string> {
  const prompt = buildLogoPrompt(domainName, type, category);
  const endpoint = MODEL_ENDPOINTS[config.model] || MODEL_ENDPOINTS['iic/Z-Image-Turbo'];

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${config.apiKey}`,
    'Content-Type': 'application/json',
  };

  const body = {
    model: config.model,
    prompt,
    negative_prompt: 'color, colorful, gradient, rainbow, red, blue, green, yellow, purple, orange, pink, brown, teal, cyan, shadow, 3d render, realistic photo, photography',
    n: 1,
    size: '512x512',
  };

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
  const imageUrl = json?.data?.[0]?.url || json?.images?.[0]?.url || json?.url || '';

  if (!imageUrl) {
    throw new Error('API 未返回图片URL，请检查模型或密钥是否正确');
  }
  return imageUrl;
}

export async function generateAndSaveDomainLogo(
  domainId: string,
  domainName: string,
  onProgress?: (msg: string) => void,
  type?: DomainLogoType,
  category?: string
): Promise<string | null> {
  try {
    const config = await getModelScopeConfig();
    if (!config) {
      onProgress?.('未配置 ModelScope API，跳过logo生成');
      return null;
    }
    onProgress?.(`正在生成 ${domainName} 的域名Logo...`);
    const imageUrl = await generateDomainLogo(domainName, config, type, category);
    await supabase.from('site_settings').upsert(
      {
        key: `domain_logo_${domainId}`,
        value: imageUrl,
        section: 'domain_logos',
        type: 'text',
        description: `AI Logo for domain ${domainName}`,
      },
      { onConflict: 'key' }
    );
    onProgress?.(`✓ ${domainName} Logo 生成成功！`);
    return imageUrl;
  } catch (err: any) {
    onProgress?.(`✗ ${domainName} Logo 生成失败: ${err.message}`);
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

export async function batchGenerateLogos(
  domains: Array<{ id: string; name: string; category?: string; type?: DomainLogoType }>,
  onProgress?: (msg: string, total: number, done: number) => void
): Promise<{ success: number; failed: number }> {
  const config = await getModelScopeConfig();
  if (!config) {
    onProgress?.('未配置 ModelScope API Key', domains.length, 0);
    return { success: 0, failed: domains.length };
  }
  let success = 0;
  let failed = 0;
  for (let i = 0; i < domains.length; i++) {
    const d = domains[i];
    onProgress?.(`生成 ${d.name} 的Logo...`, domains.length, i);
    try {
      const url = await generateDomainLogo(d.name, config, d.type, d.category);
      await supabase.from('site_settings').upsert(
        { key: `domain_logo_${d.id}`, value: url, section: 'domain_logos', type: 'text', description: `AI Logo for ${d.name}` },
        { onConflict: 'key' }
      );
      success++;
    } catch {
      failed++;
    }
    if (i < domains.length - 1) await new Promise(r => setTimeout(r, 800));
  }
  onProgress?.(`完成！成功 ${success} 个，失败 ${failed} 个`, domains.length, domains.length);
  return { success, failed };
}

export { getModelScopeConfig };
