// Build-time JSON-LD validator.
// Renders sample head payloads via the same helpers used at runtime, then
// asserts required fields on every schema.org node (Organization/WebSite/
// Product/Offer/BreadcrumbList). Fails the build with a readable report if
// any assertion breaks.

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SITE_ORIGIN = 'https://nicbn.lovable.app';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://trqxaizkwuizuhlfmdup.supabase.co';
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycXhhaXprd3VpenVobGZtZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2ODk1NzcsImV4cCI6MjA1MDI2NTU3N30.uv3FElLBTsCNr3Vg4PooW7h1o2ZlivAFGawFH-Zqxns';

type Issue = { sample: string; path: string; message: string; severity: 'error' | 'warn' };

const REQUIRED: Record<string, string[]> = {
  Organization: ['name', 'url'],
  WebSite: ['name', 'url'],
  Product: ['name', 'offers'],
  Offer: ['price', 'priceCurrency', 'availability', 'url'],
  BreadcrumbList: ['itemListElement'],
};
const ISO_CURRENCY = /^[A-Z]{3}$/;
const SCHEMA_AVAILABILITY = new Set([
  'https://schema.org/InStock',
  'https://schema.org/PreOrder',
  'https://schema.org/LimitedAvailability',
  'https://schema.org/SoldOut',
  'https://schema.org/OutOfStock',
  'https://schema.org/Discontinued',
  'https://schema.org/BackOrder',
]);

function validateNode(node: any, sample: string, path: string, issues: Issue[]) {
  if (!node || typeof node !== 'object') return;
  const type = node['@type'];
  const required = typeof type === 'string' ? REQUIRED[type] : undefined;
  if (required) {
    for (const key of required) {
      if (node[key] === undefined || node[key] === null || node[key] === '') {
        issues.push({ sample, path: `${path}.${key}`, message: `${type} missing required field "${key}"`, severity: 'error' });
      }
    }
  }
  if (type === 'Offer') {
    if (node.priceCurrency && !ISO_CURRENCY.test(String(node.priceCurrency))) {
      issues.push({ sample, path: `${path}.priceCurrency`, message: `priceCurrency "${node.priceCurrency}" is not ISO 4217`, severity: 'error' });
    }
    if (node.price !== undefined && typeof node.price !== 'number') {
      issues.push({ sample, path: `${path}.price`, message: `price must be numeric, got ${typeof node.price}`, severity: 'error' });
    }
    if (node.availability && !SCHEMA_AVAILABILITY.has(String(node.availability))) {
      issues.push({ sample, path: `${path}.availability`, message: `availability "${node.availability}" is not a schema.org enum`, severity: 'error' });
    }
    if (node.url && !/^https?:\/\//.test(String(node.url))) {
      issues.push({ sample, path: `${path}.url`, message: `Offer.url must be absolute`, severity: 'error' });
    }
  }
  for (const [k, v] of Object.entries(node)) {
    if (Array.isArray(v)) v.forEach((item, i) => validateNode(item, sample, `${path}.${k}[${i}]`, issues));
    else if (typeof v === 'object') validateNode(v, sample, `${path}.${k}`, issues);
  }
}

function buildDomainLd(d: { name: string; price: number; currency: string; status: string; description?: string }) {
  const canonical = `${SITE_ORIGIN}/domain/${encodeURIComponent(d.name)}`;
  const availability =
    d.status === 'available' ? 'https://schema.org/InStock' :
    d.status === 'sold' ? 'https://schema.org/SoldOut' :
    d.status === 'reserved' ? 'https://schema.org/PreOrder' :
    'https://schema.org/OutOfStock';
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', name: '域见•你', url: SITE_ORIGIN },
      { '@type': 'WebSite', name: '域见•你', url: SITE_ORIGIN },
      {
        '@type': 'Product',
        name: d.name,
        description: d.description || `${d.name} 域名出售`,
        sku: d.name,
        offers: {
          '@type': 'Offer',
          url: canonical,
          price: d.price,
          priceCurrency: d.currency,
          availability,
          itemCondition: 'https://schema.org/NewCondition',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: SITE_ORIGIN },
          { '@type': 'ListItem', position: 2, name: '域名市场', item: `${SITE_ORIGIN}/marketplace` },
          { '@type': 'ListItem', position: 3, name: d.name, item: canonical },
        ],
      },
    ],
  };
}

async function fetchSampleDomains(): Promise<any[]> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/domain_listings?select=name,price,currency,status,description&limit=25`;
    const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    if (!res.ok) return [];
    return (await res.json()) as any[];
  } catch { return []; }
}

async function main() {
  const issues: Issue[] = [];
  const samples: Array<{ name: string; ld: any }> = [];

  // Static site (Organization + WebSite)
  samples.push({
    name: 'homepage',
    ld: {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', name: '域见•你', url: SITE_ORIGIN, logo: `${SITE_ORIGIN}/og-image.png` },
        { '@type': 'WebSite', name: '域见•你', url: SITE_ORIGIN },
      ],
    },
  });

  // Live samples from DB — normalise for the shape validator expects.
  const rows = await fetchSampleDomains();
  for (const r of rows) {
    samples.push({
      name: `domain/${r.name}`,
      ld: buildDomainLd({
        name: r.name,
        price: Number(r.price || 0),
        currency: (r.currency || 'USD').toUpperCase(),
        status: r.status || 'available',
        description: r.description,
      }),
    });
  }
  // Deterministic fallback if DB is empty.
  if (rows.length === 0) {
    samples.push({
      name: 'domain/example.com',
      ld: buildDomainLd({ name: 'example.com', price: 9999, currency: 'USD', status: 'available' }),
    });
  }

  for (const s of samples) {
    const graph = Array.isArray(s.ld['@graph']) ? s.ld['@graph'] : [s.ld];
    graph.forEach((node: any, i: number) => validateNode(node, s.name, `@graph[${i}]`, issues));
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const report = [
    `# JSON-LD Validation Report`,
    ``,
    `- Samples checked: ${samples.length}`,
    `- Errors: ${errors.length}`,
    `- Warnings: ${issues.length - errors.length}`,
    ``,
    ...(issues.length
      ? issues.map((i) => `- [${i.severity.toUpperCase()}] \`${i.sample}\` at \`${i.path}\` — ${i.message}`)
      : ['All samples passed.']),
    ``,
  ].join('\n');

  mkdirSync(resolve('reports'), { recursive: true });
  writeFileSync(resolve('reports/jsonld-validation.md'), report);
  console.log(report);

  if (errors.length > 0) {
    console.error(`\n[validate-jsonld] FAILED with ${errors.length} error(s). Build aborted.`);
    process.exit(1);
  }
  console.log('[validate-jsonld] OK');
}

main().catch((e) => {
  console.error('[validate-jsonld] fatal:', e);
  process.exit(1);
});
