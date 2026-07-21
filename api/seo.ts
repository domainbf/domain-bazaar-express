// SSR-lite head injector for crawlers.
// Fetches the built index.html shell from the same deployment, then replaces
// its <head> tags with per-route metadata (title, description, canonical,
// hreflang, og:*, twitter:*, JSON-LD). Called by middleware.ts on bot UAs.

import type { VercelRequest, VercelResponse } from '@vercel/node';

const SITE_ORIGIN = 'https://nicbn.lovable.app';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://trqxaizkwuizuhlfmdup.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '';

type DomainRow = {
  id: string;
  name: string;
  price: number | null;
  currency: string | null;
  status: string | null;
  category: string | null;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
};

async function fetchDomain(name: string): Promise<DomainRow | null> {
  if (!SUPABASE_KEY) return null;
  try {
    const url = `${SUPABASE_URL}/rest/v1/domain_listings?name=eq.${encodeURIComponent(name)}&select=id,name,price,currency,status,category,description,created_at,updated_at&limit=1`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as DomainRow[];
    return rows[0] || null;
  } catch {
    return null;
  }
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const availabilityFor = (status?: string | null) => {
  switch (status) {
    case 'available': return 'https://schema.org/InStock';
    case 'reserved': return 'https://schema.org/PreOrder';
    case 'pending': return 'https://schema.org/LimitedAvailability';
    case 'sold': return 'https://schema.org/SoldOut';
    default: return 'https://schema.org/OutOfStock';
  }
};

function hreflangLinks(path: string) {
  const build = (lang?: string) => {
    const q = lang ? `?lang=${lang}` : '';
    return `${SITE_ORIGIN}${path}${q}`;
  };
  return [
    `<link rel="alternate" hreflang="zh-CN" href="${build('zh')}" />`,
    `<link rel="alternate" hreflang="zh-Hans" href="${build('zh')}" />`,
    `<link rel="alternate" hreflang="en" href="${build('en')}" />`,
    `<link rel="alternate" hreflang="en-US" href="${build('en')}" />`,
    `<link rel="alternate" hreflang="x-default" href="${build()}" />`,
  ].join('\n    ');
}

function ogImageFor(domain?: DomainRow | null) {
  if (!domain) return `${SITE_ORIGIN}/og-image.png`;
  const v = domain.updated_at ? Date.parse(domain.updated_at) : Date.now();
  const params = new URLSearchParams({
    d: domain.name,
    p: String(domain.price || 0),
    c: (domain.currency || 'USD').toUpperCase(),
    s: domain.status || 'available',
    v: String(v),
  });
  return `${SUPABASE_URL}/functions/v1/og-image?${params.toString()}`;
}

function buildHead(path: string, domain: DomainRow | null): string {
  const canonical = `${SITE_ORIGIN}${path}`;
  const isDomain = path.startsWith('/domain/') && !!domain;

  let title = '域见•你 — 精品域名交易平台｜安全托管·AI估值·域名拍卖';
  let description = '域见•你（NIC.BN）是专业的精品域名交易平台，提供域名一口价出售、竞价拍卖、AI 智能估值、第三方托管、DNS 域名监控与安全过户服务。';
  let ogType = 'website';
  const ldGraph: unknown[] = [
    {
      '@type': 'Organization',
      name: '域见•你',
      alternateName: ['NIC.BN'],
      url: SITE_ORIGIN,
      logo: `${SITE_ORIGIN}/og-image.png`,
    },
    {
      '@type': 'WebSite',
      name: '域见•你',
      url: SITE_ORIGIN,
      inLanguage: 'zh-CN',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_ORIGIN}/marketplace?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ];

  if (isDomain && domain) {
    const currency = (domain.currency || 'USD').toUpperCase();
    const price = Number(domain.price || 0);
    const symbol = currency === 'CNY' ? '¥' : currency === 'USD' ? '$' : '';
    const priceText = `${symbol}${price.toLocaleString()}`;
    title = `${domain.name} - ${domain.category === 'premium' ? '精品' : '优质'}域名出售 | 域见•你`;
    description = domain.description
      ? `${domain.name} 域名出售，价格${priceText}。${String(domain.description).slice(0, 100)}`
      : `${domain.name} 优质域名出售，一口价${priceText}。立即购买或提交报价，安全交易有保障。`;
    ogType = 'product';
    ldGraph.push({
      '@type': 'Product',
      name: domain.name,
      description: domain.description || `${domain.name} 域名出售`,
      category: 'Domain Name',
      sku: domain.name,
      brand: { '@type': 'Brand', name: '域见•你' },
      offers: {
        '@type': 'Offer',
        url: canonical,
        priceCurrency: currency,
        price,
        priceSpecification: {
          '@type': 'PriceSpecification',
          price,
          priceCurrency: currency,
          valueAddedTaxIncluded: false,
        },
        availability: availabilityFor(domain.status),
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@type': 'Organization', name: '域见•你', url: SITE_ORIGIN },
      },
    });
    ldGraph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '首页', item: SITE_ORIGIN },
        { '@type': 'ListItem', position: 2, name: '域名市场', item: `${SITE_ORIGIN}/marketplace` },
        { '@type': 'ListItem', position: 3, name: domain.name, item: canonical },
      ],
    });
  }

  const ogImage = ogImageFor(domain);
  const ldJson = JSON.stringify({ '@context': 'https://schema.org', '@graph': ldGraph });

  return `
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <meta http-equiv="content-language" content="zh-CN" />
    <link rel="canonical" href="${canonical}" />
    ${hreflangLinks(path)}
    <meta property="og:type" content="${ogType}" />
    <meta property="og:site_name" content="域见•你" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="zh_CN" />
    <meta property="og:locale:alternate" content="en_US" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:url" content="${canonical}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
    <meta name="geo.region" content="CN" />
    <script type="application/ld+json">${ldJson.replace(/</g, '\\u003c')}</script>
  `.trim();
}

let cachedShell: string | null = null;
async function loadShell(origin: string): Promise<string> {
  if (cachedShell) return cachedShell;
  try {
    const res = await fetch(`${origin}/index.html`, { headers: { 'user-agent': 'seo-ssr-fetch' } });
    if (res.ok) {
      cachedShell = await res.text();
      return cachedShell;
    }
  } catch {}
  return '<!doctype html><html lang="zh-CN"><head></head><body><div id="root"></div></body></html>';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = String(req.query.path || '/');
  const origin = `https://${req.headers.host || SITE_ORIGIN.replace('https://', '')}`;

  let domain: DomainRow | null = null;
  const domainMatch = path.match(/^\/domain\/([^/?#]+)/);
  if (domainMatch) {
    domain = await fetchDomain(decodeURIComponent(domainMatch[1]));
  }

  const shell = await loadShell(origin);
  const head = buildHead(path, domain);
  const html = shell.replace(/<head>[\s\S]*?<\/head>/i, `<head>${head}\n  </head>`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  res.setHeader('x-ssr-seo', domain ? 'domain' : 'static');
  res.status(200).send(html);
}
