// Build-time sitemap generator. Runs on prebuild.
// Emits public/sitemap.xml with (a) all public static routes, (b) every
// domain listing from Supabase, (c) hreflang alternates for zh/en per URL.

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE_URL = 'https://nicbn.lovable.app';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://trqxaizkwuizuhlfmdup.supabase.co';
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycXhhaXprd3VpenVobGZtZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2ODk1NzcsImV4cCI6MjA1MDI2NTU3N30.uv3FElLBTsCNr3Vg4PooW7h1o2ZlivAFGawFH-Zqxns';

interface Entry {
  path: string;
  lastmod?: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
}

const staticEntries: Entry[] = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/marketplace', changefreq: 'daily', priority: '0.9' },
  { path: '/auctions', changefreq: 'hourly', priority: '0.9' },
  { path: '/valuation', changefreq: 'weekly', priority: '0.7' },
  { path: '/sell', changefreq: 'monthly', priority: '0.7' },
  { path: '/domain-monitor', changefreq: 'weekly', priority: '0.6' },
  { path: '/escrow', changefreq: 'monthly', priority: '0.6' },
  { path: '/platform-services', changefreq: 'monthly', priority: '0.6' },
  { path: '/community', changefreq: 'weekly', priority: '0.6' },
  { path: '/faq', changefreq: 'monthly', priority: '0.5' },
  { path: '/help', changefreq: 'monthly', priority: '0.5' },
  { path: '/contact', changefreq: 'monthly', priority: '0.5' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/disclaimer', changefreq: 'yearly', priority: '0.3' },
];

async function fetchDomains(): Promise<Entry[]> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/domain_listings?select=name,status,updated_at&limit=5000`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) {
      console.warn('[sitemap] Supabase fetch failed:', res.status);
      return [];
    }
    const rows = (await res.json()) as Array<{ name: string; status: string; updated_at: string }>;
    return rows
      .filter((r) => r.name && ['available', 'reserved', 'pending', 'sold'].includes(r.status))
      .map<Entry>((r) => ({
        path: `/domain/${encodeURIComponent(r.name)}`,
        lastmod: r.updated_at ? new Date(r.updated_at).toISOString().split('T')[0] : undefined,
        changefreq: r.status === 'sold' ? 'monthly' : 'daily',
        priority: r.status === 'available' ? '0.8' : '0.5',
      }));
  } catch (e) {
    console.warn('[sitemap] domain fetch error:', (e as Error).message);
    return [];
  }
}

function xhtmlAlternates(path: string): string {
  const build = (lang?: string) => `${BASE_URL}${path}${lang ? `?lang=${lang}` : ''}`;
  return [
    `    <xhtml:link rel="alternate" hreflang="zh-CN" href="${build('zh')}" />`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${build('en')}" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${build()}" />`,
  ].join('\n');
}

function render(entries: Entry[]): string {
  const urls = entries.map((e) => {
    const lines = [
      '  <url>',
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      `    <changefreq>${e.changefreq}</changefreq>`,
      `    <priority>${e.priority}</priority>`,
      xhtmlAlternates(e.path),
      '  </url>',
    ].filter(Boolean);
    return lines.join('\n');
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
  ].join('\n');
}

async function main() {
  const domainEntries = await fetchDomains();
  const all = [...staticEntries, ...domainEntries];
  const xml = render(all);
  writeFileSync(resolve('public/sitemap.xml'), xml);
  console.log(`[sitemap] wrote ${all.length} entries (${staticEntries.length} static + ${domainEntries.length} domains)`);
}

main().catch((e) => {
  console.error('[sitemap] fatal:', e);
  process.exit(1);
});
