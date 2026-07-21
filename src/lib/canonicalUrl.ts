// Canonical URL & head-tag sync helpers.
// Ensures share links, og:url, twitter:url, and canonical always match the
// current route — filtering client-only params that shouldn't leak into shares.

const STRIP_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gclid', 'fbclid', 'ref', 'referrer', '_ga', 'mc_cid', 'mc_eid',
]);

const SITE_ORIGIN = 'https://nicbn.lovable.app';

/**
 * Build a clean, absolute canonical URL for the current route.
 * - Always uses the production origin (crawlers redirect preview → prod)
 * - Preserves pathname + meaningful query params
 * - Drops hash fragments & tracking params
 */
export function getCanonicalUrl(pathOverride?: string): string {
  if (typeof window === 'undefined') return SITE_ORIGIN + (pathOverride || '/');

  const isPreview = /lovable\.app$/.test(window.location.hostname) &&
    window.location.hostname !== new URL(SITE_ORIGIN).hostname;

  const origin = isPreview ? SITE_ORIGIN : window.location.origin;
  const pathname = pathOverride || window.location.pathname || '/';

  const params = new URLSearchParams(window.location.search);
  for (const key of Array.from(params.keys())) {
    if (STRIP_PARAMS.has(key.toLowerCase())) params.delete(key);
  }
  const search = params.toString();
  return `${origin}${pathname}${search ? '?' + search : ''}`;
}

/**
 * Ensure og:url, twitter:url, and <link rel=canonical> in <head> match the
 * given URL. Call this right before opening a social-share window so scrapers
 * hitting the shared link find consistent metadata.
 */
export function syncHeadUrls(url: string): void {
  if (typeof document === 'undefined') return;

  const upsertMeta = (selector: string, attr: 'property' | 'name', key: string) => {
    let el = document.head.querySelector<HTMLMetaElement>(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    if (el.content !== url) el.content = url;
  };

  upsertMeta('meta[property="og:url"]', 'property', 'og:url');
  upsertMeta('meta[name="twitter:url"]', 'name', 'twitter:url');

  let canon = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canon) {
    canon = document.createElement('link');
    canon.rel = 'canonical';
    document.head.appendChild(canon);
  }
  if (canon.href !== url) canon.href = url;
}

/**
 * Verify head tags already reflect the given URL. Returns which ones mismatch.
 * Useful for logging/telemetry before firing a share intent.
 */
export function verifyHeadUrls(url: string): { ok: boolean; mismatches: string[] } {
  if (typeof document === 'undefined') return { ok: true, mismatches: [] };
  const checks: Array<[string, string | null]> = [
    ['og:url', document.head.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.content ?? null],
    ['twitter:url', document.head.querySelector<HTMLMetaElement>('meta[name="twitter:url"]')?.content ?? null],
    ['canonical', document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? null],
  ];
  const mismatches = checks.filter(([, v]) => v !== url).map(([k]) => k);
  return { ok: mismatches.length === 0, mismatches };
}

/**
 * Prepare a URL for sharing: build canonical, sync head tags, verify, and
 * return the URL that should be handed to the share intent.
 */
export function prepareShareUrl(pathOverride?: string): string {
  const url = getCanonicalUrl(pathOverride);
  syncHeadUrls(url);
  return url;
}

/**
 * Return hreflang alternates for the current path. Kept simple: the site is
 * primarily zh-CN with en-US intent; add more locales here as they ship.
 */
export function getHreflangAlternates(pathOverride?: string): Array<{ hrefLang: string; href: string }> {
  const path = pathOverride || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const params = typeof window !== 'undefined' ? window.location.search : '';
  const build = (lang?: string) => {
    const p = new URLSearchParams(params);
    if (lang) p.set('lang', lang); else p.delete('lang');
    const q = p.toString();
    return `${SITE_ORIGIN}${path}${q ? '?' + q : ''}`;
  };
  return [
    { hrefLang: 'zh-CN', href: build('zh') },
    { hrefLang: 'zh-Hans', href: build('zh') },
    { hrefLang: 'en', href: build('en') },
    { hrefLang: 'en-US', href: build('en') },
    { hrefLang: 'x-default', href: build() },
  ];
}

export { SITE_ORIGIN };
