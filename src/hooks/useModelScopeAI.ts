import { apiGet, apiPatch } from '@/lib/apiClient';

export interface ModelScopeConfig {
  apiKey: string;
  model: string;
}

export type DomainLogoType =
  | 'single'    // 单字符域名：a.com / x.bn（极稀有，最高规格）
  | 'country'   // 国别后缀：abc.cn / shop.jp / trade.uk
  | 'auction'   // 竞价拍卖风格
  | 'hot'       // 热门流行风格
  | 'premium'   // 高端奢华风格
  | 'sold'      // 已成交风格
  | 'tech'      // 科技/开发者风格
  | 'short'     // 2–4 字符短域名
  | 'numeric'   // 纯数字域名：888.com / 666.cn
  | 'general';  // 通用风格

// ─── 已知国别顶级域名集合 ─────────────────────────────────────────────────

const CCTLD_SET = new Set([
  // 主流亚太
  'cn', 'jp', 'kr', 'hk', 'tw', 'sg', 'my', 'th', 'vn', 'id', 'ph', 'in',
  'au', 'nz', 'bn', 'pk', 'bd', 'lk', 'np', 'kh', 'mm', 'la', 'mn',
  // 欧洲
  'uk', 'de', 'fr', 'it', 'es', 'nl', 'ru', 'pl', 'se', 'no', 'dk', 'fi',
  'cz', 'hu', 'ro', 'ua', 'at', 'be', 'ch', 'pt', 'gr', 'ie', 'sk', 'hr',
  'bg', 'si', 'rs', 'ee', 'lv', 'lt', 'lu', 'mt', 'cy', 'is', 'al',
  // 中东 / 非洲
  'ae', 'sa', 'il', 'tr', 'eg', 'ma', 'ng', 'ke', 'za', 'gh', 'et',
  // 美洲
  'us', 'ca', 'mx', 'br', 'ar', 'cl', 'co', 'pe', 've', 'ec',
  // 常用地区性/特殊 ccTLD
  'eu', 'io', 'co', 'tv', 'me', 'cc', 'fm', 'to', 'gg', 'je', 'im',
  'sh', 'ac', 'cx', 'nu', 'ws', 'ki', 'sb', 'vu', 'fj', 'pg',
]);

// ─── 提示词库 ──────────────────────────────────────────────────────────────

const PROMPT_STYLES: Record<DomainLogoType, string[]> = {

  // ── 单字符域名：极稀有资产，要求极致震撼 ──────────────────────────────
  single: [
    'Monumental single-letter sculpture, architectural gravity, solid black geometric form on pure white, museum-quality typographic installation, no ornamentation, absolute minimal',
    'Ultra-condensed single character treated as national monument, razor-sharp black ink on white, extreme scale contrast, Swiss International Style, zero decoration, pure typographic power',
    'Single letter as abstract icon, pure negative space composition, bold architectural silhouette in jet black, high-end gallery poster aesthetic, white background, vector precision',
    'Iconic solitary letterform, Bauhaus-inspired geometric construction, ultra-bold black stroke weight, white ground, optical balance mastered, timeless institutional identity mark',
    'One letter rendered as cast-metal brand stamp, heavy intaglio aesthetic, deep black impression on white, luxury heritage marque feel, square composition, no background texture',
    'Oversized lone character cropped at edges, dramatic typographic fragment, offset composition, pure black on white, editorial fashion magazine cover energy, zero color',
    'Single character as architectural cross-section, technical blueprint precision, hairline to ultra-bold weight range, jet black on white, engineering-firm identity aesthetic',
    'Solitary initial mark with invisible grid alignment, mathematical letterform proportions, solid black on white, Swiss grid system, corporate-standard monochrome brand identity',
  ],

  // ── 国别域名：主权感、地理认同、国际贸易感 ────────────────────────────
  country: [
    'Sovereign national emblem style wordmark, precise geometry referencing cartographic heritage, deep black ink on white, official document aesthetic, authoritative monochrome mark',
    'International trade brand, bold sans-serif wordmark with subtle map-pin or compass rose micro-element, pure black on white, global commerce identity, clean professional monochrome',
    'Geographic identity logo, crisp architectural letterforms suggesting border and territory, ink-stamp official aesthetic, pure black on white, institutional monochrome precision',
    'National domain authority mark, refined serif-meets-modern hybrid letterforms, subtle latitude-line underline detail, black on white, diplomatic-level brand refinement, zero color',
    'Cross-border commerce emblem, condensed uppercase wordmark with passport-stamp framing element, jet black on white, export-quality brand identity, structured monochrome composition',
    'Country-code identity badge, octagonal or shield frame enclosing domain text, heavy black line weight, white fill, treaty-document credibility, authoritative national scale',
    'Bilateral trade wordmark, dual visual weight letterforms suggesting origin and destination, pure black on white, global registry brand style, professional monochrome identity system',
    'Regional digital identity mark, letterforms with subtle aerial-map negative-space texture, deep black on white, land-authority official style, high-contrast monochrome logo',
  ],

  // ── 竞拍域名 ────────────────────────────────────────────────────────────
  auction: [
    'Bold dramatic auction-house emblem, heavy black ink on white, sharp angular letterforms, intense weight contrast, gavel motif as subtle geometric background element, high-impact monochrome',
    'Aggressive typographic logo, thick slab-serif letterforms, auction-bid urgency energy, heavy black ink strokes, white negative-space cuts, ultra-bold monochrome composition',
    'Dark intense brand mark, stark black-white contrast, oversized letterform cropped composition, editorial financial magazine style, no color, crisp print-ready identity',
    'Powerful monochrome wordmark with dynamic diagonal slash element, auction energy, hand-crafted letterpress aesthetic, pure black on white, strong visual tension',
    'Hammer-strike typographic logo, compressed ultra-bold letterforms, high drama black on white, notary stamp aesthetic, institutional authority with competitive energy',
    'Live-bid event identity, oversized stencil-cut letterforms, raw black ink on white, industrial urgency, bold monochrome mark with zero decorative elements',
    'Premium gavel badge, circular or hexagonal frame, centered letterform focal point, auction house masthead style, pristine black and white, authoritative monochrome seal',
  ],

  // ── 热门域名 ────────────────────────────────────────────────────────────
  hot: [
    'Sleek minimal wordmark, thin elegant strokes, high-fashion editorial typographic logo, pure black letterforms on white ground, airy letter-spacing, refined monochrome identity',
    'Modern geometric brand mark, clean circles and lines, Swiss design grid logic, black on white, no texture, flat monochrome logo system, contemporary startup aesthetic',
    'Confident sans-serif logo with subtle custom ligature, editorial black and white, balanced whitespace proportions, forward-leaning professional identity, monochrome only',
    'Flowing calligraphic letterforms rendered in pure black ink, white background, organic brush energy channeled into precision, high-contrast monochrome logo mark',
    'Trend-forward typographic identity, variable-weight letterforms, fashion-forward editorial rhythm, pure black on white, magazine cover masthead energy, zero color',
    'Minimal dot-accent wordmark, precision-spaced sans-serif, single punctuation mark elevated to brand element, jet black on white, tech-company aesthetic, clean monochrome',
    'High-velocity condensed wordmark, motion-blur inspired letterform compression, bold black strokes on white, contemporary digital-brand energy, flat monochrome design',
  ],

  // ── 高端域名 ────────────────────────────────────────────────────────────
  premium: [
    'Ultra-luxury monogram seal, fine hairline strokes, classical heraldic composition modernized for digital, pristine white and deep black, premium jewelry-house aesthetic',
    'Minimal high-end wordmark, Helvetica-level proportional precision, generous whitespace orchestration, single-weight variation, Chanel-inspired timeless elegance, pure monochrome',
    'Premium emblem with geometric frame, ultra-thin border elements, centered letterform focal point, luxury real-estate brand style, crisp black on white only',
    'Elegant editorial logotype, extreme contrast between hairline and ultra-bold letterform weights, luxury magazine masthead style, high-end monochrome typographic identity',
    'Haute couture brand mark, hand-lettered calligraphic initial surrounded by engraved-line ornament, black on white, couture atelier aesthetic, no color permitted',
    'Luxury heritage wordmark, old-cut letterform proportions modernized, deep black on pure white, private banking brand style, quiet authority, refined monochrome',
    'Collector-grade typographic emblem, letterpress registration texture, limited-edition stamp character, premium black on white, artisanal print-culture identity mark',
    'Fine-jewelry level monogram, interlocking letterforms with mathematical symmetry, hairline construction lines, absolute black on white, ultra-premium minimalist identity',
  ],

  // ── 已售域名 ────────────────────────────────────────────────────────────
  sold: [
    'Celebratory achievement stamp mark, bold checkmark geometry integrated into letterforms, black on white, completed-transaction energy, strong confident monochrome identity',
    'Triumphant wordmark with subtle award-ribbon element, classic black ink on white, commemorative certificate aesthetic, authoritative monochrome brand mark',
    'Clean success badge, circular or square frame composition, bold letterforms, black and white only, professional sold-property style, institutional monochrome seal',
    'Bold transaction-complete stamp, rectangular border with letter-press texture aesthetic, heavy black ink, crisp white background, official-document authenticity',
    'Notarized completion mark, double-border frame with central letterform, deep black on white, registry-document character, formal institutional monochrome',
    'Deal-closed emblem, bold diagonal stamp element over wordmark, black on white, decisive authority, final-notice character, high-contrast monochrome design',
  ],

  // ── 科技/开发者域名 ─────────────────────────────────────────────────────
  tech: [
    'Precise technical monogram, circuit-trace inspired geometric construction, pixel-perfect black on white, developer-tool brand aesthetic, monochrome identity system',
    'Angular tech wordmark, sharp-corner letterforms with subtle grid reference, binary-pattern negative space, high-contrast black and white, digital precision brand',
    'Minimalist code-style logo, monospaced letterform rhythm, terminal cursor or bracket detail, pure black on white, developer-culture monochrome identity',
    'Geometric tech icon, hexagonal or modular tile structure, abstract node-network implied texture, jet black on white, clean scalable API-company mark',
    'Command-line aesthetic wordmark, typewriter-precision letterforms, blinking cursor element, pure black on white, open-source community brand energy',
    'Isometric letter construction, 3D-wireframe illusion rendered in flat black lines on white, technical precision, engineering-visualization aesthetic, zero color',
    'Circuit-board letterform logo, copper-trace paths forming letter shapes, PCB design aesthetic, black on white, hardware startup brand identity, monochrome',
    'Matrix-grid wordmark, letterforms constructed from uniform square pixels, retro-digital precision, pure black on white, game-engine developer aesthetic',
  ],

  // ── 短域名（2–4 字符） ───────────────────────────────────────────────────
  short: [
    'Bold letter-pair mark, geometric construction, iconic symbol-mark composition, pure black on white, instantly recognizable premium monochrome identity',
    'Abstract initials interlock, negative space carves secondary letterform, black and white optical-illusion mark, sophisticated brand symbol with intellectual depth',
    'Monumental condensed wordmark, 2–4 letterforms treated as architectural objects, dramatic scale contrast, pure monochrome, gallery-installation inspired',
    'Contoured letter outline filled with parallel-line crosshatch texture, printmaking etching aesthetic, bold mono logo, pure black and white artisanal quality',
    'Stencil-cut 3-letter mark, industrial spray-paint precision, raw black on white, heavy weight, street-typography energy distilled into brand mark',
    'Interlocking diphthong ligature, custom letterform fusion, negative space creates third shape, black on white, clever optical brand identity',
    'Sans-serif abbreviation mark, optical kerning mastery, each letter individually scaled for visual balance, pure black on white, premium condensed identity',
    'Letterform stack, vertical typographic composition for short domain initials, architectural column structure, jet black on white, modernist identity system',
  ],

  // ── 数字域名（纯数字或以数字为主） ─────────────────────────────────────
  numeric: [
    'Bold numeral composition, oversized digit treated as architectural element, heavy black on white, financial-sector brand precision, monochrome typographic identity',
    'Number sequence as abstract pattern, geometric rhythm of digit shapes, pure black on white, data-driven aesthetic, clean Swiss-grid monochrome logo',
    'Lucky-number badge design, traditional seal format modernized, compact circular or square frame, black on white, auspicious heritage meets contemporary design',
    'Numeral ligature mark, digits interlocked with mathematical elegance, black on white, financial institution brand style, authoritative monochrome emblem',
    'Digital-display numeral aesthetic, segmented-display letterform inspiration, tech-meets-heritage, pure black on white, precision monochrome identity',
    'Monument-scale digit mark, single or double number treated as sculptural form, pure black on white, gallery poster energy, zero ornamentation',
  ],

  // ── 通用域名 ────────────────────────────────────────────────────────────
  general: [
    'Clean professional wordmark, balanced neo-grotesque typography, domain-registrar brand credibility, pure black on white, trustworthy monochrome identity',
    'Friendly approachable logo, subtly rounded letterforms, domain globe icon micro-element, black and white only, modern web-service company aesthetic',
    'Sharp contemporary brand mark, precise letter spacing, minimal horizontal accent line, confident black ink on white, professional monochrome identity system',
    'Classic timeless wordmark, optically balanced proportions, subtle period or dot accent, black and white, enduring institutional brand quality',
    'Editorial wordmark, confident variable-weight typography, subtle underline treatment, pure black on white, independent media brand character, monochrome',
    'Digital-native brand mark, clean geometry with micro-grid reference, pure black on white, SaaS company identity aesthetic, reliable monochrome system',
    'Authoritative domain wordmark, high x-height sans-serif, generous side-bearing, black on white, registry-level brand trustworthiness, professional monochrome',
  ],
};

// ─── 检测域名类型 ─────────────────────────────────────────────────────────

function detectLogoType(domainName: string, category?: string): DomainLogoType {
  if (category === 'premium' || category === 'high_value') return 'premium';
  if (category === 'dev' || category === 'tech') return 'tech';

  const lower = domainName.toLowerCase();
  const parts = lower.split('.');
  const base = parts[0];
  const tld = parts.length > 1 ? parts[parts.length - 1] : '';

  if (base.length === 1) return 'single';
  if (/^\d+$/.test(base)) return 'numeric';
  if (tld.length === 2 && CCTLD_SET.has(tld)) return 'country';
  if (base.length <= 4) return 'short';
  if (/^(ai|tech|dev|code|api|cloud|data|app|web|net|soft|byte|bit|pixel|hack|open|smart|cyber|node|stack|saas|paas|faas|k8s|devops)/.test(base)) return 'tech';

  return 'general';
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── 构建提示词 ──────────────────────────────────────────────────────────

export function buildLogoPrompt(domainName: string, type?: DomainLogoType, category?: string): string {
  const resolvedType = type || detectLogoType(domainName, category);
  const parts = domainName.split('.');
  const base = parts[0].toUpperCase();
  const tld = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
  const stylePrompt = pickRandom(PROMPT_STYLES[resolvedType]);

  let subject: string;
  if (base.length === 1) {
    subject = `for the ultra-premium single-character domain "${domainName}", featuring the solitary letter "${base}"`;
  } else if (resolvedType === 'country') {
    subject = `for the country-code domain "${domainName}", featuring the letters "${base}" with national top-level domain ".${tld}"`;
  } else if (resolvedType === 'numeric') {
    subject = `for the numeric domain "${domainName}", featuring the number "${base}"`;
  } else if (base.length <= 4) {
    subject = `for the domain "${domainName}", featuring the short characters "${base}"`;
  } else {
    subject = `for the domain "${domainName}", with the text "${base}"${tld ? ` and TLD ".${tld}"` : ''}`;
  }

  const negativeHints = resolvedType === 'country'
    ? 'national flags, map outlines, literal geography, color, colorful, photographic'
    : 'color, colorful, gradient, rainbow, shadow, 3d render, realistic photo, photography, texture background';

  return `${stylePrompt}, created ${subject}. MANDATORY CONSTRAINT: pure black and white ONLY — solid black (#000000) and solid white (#FFFFFF), absolutely no gray, no color, no tonal variation. Square 1:1 format, white background, professional vector-style logo artwork suitable for print and screen at any scale. Negative: ${negativeHints}`;
}

// ─── 模型配置表 ─────────────────────────────────────────────────────────
// ModelScope 平台经验证的模型 ID 及其调用方式
// asyncRequired: true = 不支持同步调用，必须使用异步模式+轮询

export const MS_MODELS: Array<{ id: string; label: string; asyncRequired: boolean; free: boolean }> = [
  { id: 'black-forest-labs/FLUX.1-schnell', label: 'FLUX.1 Schnell（速度最快，免费推荐）', asyncRequired: false, free: true },
  { id: 'black-forest-labs/FLUX.1-dev',    label: 'FLUX.1 Dev（质量更高，异步模式）',    asyncRequired: true,  free: false },
  { id: 'AI-ModelScope/stable-diffusion-xl-base-1.0', label: 'Stable Diffusion XL（均衡，异步模式）', asyncRequired: true, free: true },
];

const MS_API_BASE = 'https://api-inference.modelscope.cn/v1';

// ─── ModelScope 配置 ─────────────────────────────────────────────────────

async function getModelScopeConfig(): Promise<ModelScopeConfig | null> {
  const settings = await apiGet<Record<string, string>>('/data/site-settings');
  const apiKey = settings?.modelscope_api_key || '';
  if (!apiKey) return null;
  return {
    apiKey,
    model: settings?.modelscope_model || 'black-forest-labs/FLUX.1-schnell',
  };
}

// ─── 异步任务轮询 ─────────────────────────────────────────────────────────
// ModelScope 异步任务接口：GET /v1/tasks/{task_id}
// 状态：PENDING → RUNNING → SUCCEEDED / FAILED

async function pollAsyncTask(
  taskId: string,
  apiKey: string,
  maxWaitMs = 120_000,
  intervalMs = 2_500,
): Promise<string> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, intervalMs));
    const res = await fetch(`${MS_API_BASE}/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      const t = await res.text().catch(() => res.statusText);
      throw new Error(`轮询任务失败（${res.status}）：${t}`);
    }
    const json = await res.json();
    const status: string = json?.task_status || json?.status || '';
    if (status === 'SUCCEEDED') {
      const url =
        json?.task_result?.images?.[0]?.url ||
        json?.result?.images?.[0]?.url ||
        json?.output?.images?.[0]?.url ||
        json?.images?.[0]?.url ||
        json?.data?.[0]?.url ||
        '';
      if (!url) throw new Error('异步任务完成但未返回图片 URL');
      return url;
    }
    if (status === 'FAILED' || status === 'ERROR') {
      const msg = json?.task_result?.message || json?.message || '任务失败';
      throw new Error(`生成任务失败：${msg}`);
    }
    // PENDING / RUNNING → 继续等待
  }
  throw new Error('生成超时（超过 120 秒），请稍后重试或切换为 FLUX.1 Schnell 模型');
}

// ─── 发起图像生成请求 ─────────────────────────────────────────────────────

async function callImageGeneration(
  prompt: string,
  model: string,
  apiKey: string,
  forceAsync: boolean,
): Promise<string> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  if (forceAsync) headers['X-ModelScope-Async-Mode'] = 'true';

  const body = JSON.stringify({
    model,
    prompt,
    negative_prompt: 'color, colorful, gradient, rainbow, red, blue, green, yellow, purple, orange, pink, brown, teal, cyan, shadow, 3d render, realistic photo, photography, blurry',
    n: 1,
    size: '512x512',
  });

  const res = await fetch(`${MS_API_BASE}/images/generations`, { method: 'POST', headers, body });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    let errMsg = errText;
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson?.message || errJson?.error?.message || errJson?.errors?.message || errText;
    } catch { /* keep raw */ }

    // 模型不存在
    if (errMsg.toLowerCase().includes('model not exists') || errMsg.toLowerCase().includes('not found')) {
      throw new Error(`模型不存在：${model}。请在后台更换为 "FLUX.1 Schnell（推荐）" 模型`);
    }

    // 需要异步模式 → 自动重试
    if (!forceAsync && (errMsg.toLowerCase().includes('async') || errMsg.toLowerCase().includes('asynchronous'))) {
      return callImageGeneration(prompt, model, apiKey, true);
    }

    if (res.status === 401) {
      throw new Error(`API 认证失败（401）：密钥无效或未绑定阿里云账号，请前往 modelscope.cn → 账户设置 → 绑定阿里云后重试`);
    }

    throw new Error(`ModelScope API 错误 ${res.status}: ${errMsg}`);
  }

  const json = await res.json();

  // 同步返回图片 URL
  const syncUrl =
    json?.data?.[0]?.url ||
    json?.images?.[0]?.url ||
    json?.output?.images?.[0]?.url ||
    json?.url ||
    '';
  if (syncUrl) return syncUrl;

  // 异步任务：有 task_id，进入轮询
  const taskId = json?.task_id || json?.id || '';
  if (taskId) return pollAsyncTask(taskId, apiKey);

  throw new Error('API 未返回图片 URL 或任务 ID，请检查模型或密钥是否正确');
}

// ─── 生成单个域名 Logo ────────────────────────────────────────────────────

export async function generateDomainLogo(
  domainName: string,
  config: ModelScopeConfig,
  type?: DomainLogoType,
  category?: string
): Promise<string> {
  const prompt = buildLogoPrompt(domainName, type, category);
  const modelMeta = MS_MODELS.find(m => m.id === config.model);
  const forceAsync = modelMeta?.asyncRequired ?? false;
  return callImageGeneration(prompt, config.model, config.apiKey, forceAsync);
}

// ─── 生成并保存单个域名 Logo ─────────────────────────────────────────────

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
      onProgress?.('未配置 ModelScope API，跳过 Logo 生成');
      return null;
    }
    onProgress?.(`正在生成 ${domainName} 的域名 Logo…`);
    const imageUrl = await generateDomainLogo(domainName, config, type, category);
    await apiPatch('/data/site-settings', { updates: { [`domain_logo_${domainId}`]: imageUrl } });
    onProgress?.(`✓ ${domainName} Logo 生成成功`);
    return imageUrl;
  } catch (err: any) {
    onProgress?.(`✗ ${domainName} Logo 生成失败: ${err.message}`);
    return null;
  }
}

// ─── 读取域名 Logo URL ────────────────────────────────────────────────────

export async function getDomainLogoUrl(domainId: string): Promise<string | null> {
  const settings = await apiGet<Record<string, string>>('/data/site-settings');
  return settings?.[`domain_logo_${domainId}`] || null;
}

// ─── 批量生成 Logo ────────────────────────────────────────────────────────

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
    onProgress?.(`生成 ${d.name} 的 Logo…`, domains.length, i);
    try {
      const url = await generateDomainLogo(d.name, config, d.type, d.category);
      await apiPatch('/data/site-settings', { updates: { [`domain_logo_${d.id}`]: url } });
      success++;
    } catch {
      failed++;
    }
    if (i < domains.length - 1) await new Promise(r => setTimeout(r, 900));
  }
  onProgress?.(`完成！成功 ${success} 个，失败 ${failed} 个`, domains.length, domains.length);
  return { success, failed };
}

export { getModelScopeConfig };
