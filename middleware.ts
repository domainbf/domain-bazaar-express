// Vercel Edge Middleware.
// Detects crawler / social-preview User-Agents on public routes and rewrites
// them to /api/seo so the response HTML carries fully-hydrated head tags
// (title, description, canonical, hreflang, og:*, twitter:*, JSON-LD)
// without waiting for client-side JS. Real users are passed through untouched.

export const config = {
  matcher: [
    // Only public content routes — skip static assets and API.
    '/((?!_next|api|assets|icons|favicon|robots.txt|sitemap.xml|manifest.webmanifest|.*\\..*).*)',
  ],
};

const BOT_UA = /bot|crawler|spider|slurp|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|embedly|pinterest|redditbot|applebot|bingpreview|googlebot|google-inspectiontool|yandex|baiduspider|duckduckbot|ahrefsbot|semrushbot|petalbot|bytespider|mj12bot|dotbot|chatgpt|gptbot|claudebot|perplexitybot|oai-searchbot|ccbot|anthropic-ai/i;

export default function middleware(req: Request) {
  const url = new URL(req.url);
  const ua = req.headers.get('user-agent') || '';
  if (!BOT_UA.test(ua)) return; // pass-through for real users

  // Also let the SEO endpoint force-render via ?seo=1 for QA.
  const rewritten = new URL('/api/seo', url);
  rewritten.searchParams.set('path', url.pathname);
  if (url.search) rewritten.searchParams.set('query', url.search.slice(1));

  return new Response(null, {
    status: 200,
    headers: { 'x-middleware-rewrite': rewritten.toString() },
  });
}
