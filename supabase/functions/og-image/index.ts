// Dynamic Open Graph image generator.
// Takes ?d=<domain>&p=<price>&c=<currency>&s=<status>&v=<cache-buster>
// Returns 1200x630 PNG (or SVG fallback) suitable for og:image / twitter:image.
// Uses satori + resvg-wasm — pure WASM, runs on Supabase Edge Functions.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import satori from 'npm:satori@0.10.13';
import { Resvg, initWasm } from 'npm:@resvg/resvg-wasm@2.6.2';

// Lazy-init the resvg WASM once per cold start.
let wasmReady: Promise<void> | null = null;
async function ensureWasm() {
  if (!wasmReady) {
    wasmReady = fetch('https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm')
      .then((r) => r.arrayBuffer())
      .then((buf) => initWasm(buf));
  }
  await wasmReady;
}

// Load a CJK-capable font (Noto Sans SC) once.
let fontCache: ArrayBuffer | null = null;
async function loadFont(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;
  const res = await fetch(
    'https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Bold.otf',
  );
  fontCache = await res.arrayBuffer();
  return fontCache;
}

const escapeText = (s: string) => (s || '').slice(0, 60);

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const domain = escapeText(url.searchParams.get('d') || 'nicbn.lovable.app');
    const price = Number(url.searchParams.get('p') || 0);
    const currency = (url.searchParams.get('c') || 'USD').toUpperCase();
    const status = url.searchParams.get('s') || 'available';

    const symbol = currency === 'CNY' ? '¥' : currency === 'USD' ? '$' : '';
    const priceText = price > 0 ? `${symbol}${price.toLocaleString()}` : '欢迎报价';
    const statusMap: Record<string, string> = {
      available: '在售',
      reserved: '预留',
      pending: '交易中',
      sold: '已售出',
    };
    const statusText = statusMap[status] || '在售';
    const statusColor = status === 'sold' ? '#ef4444' : status === 'available' ? '#10b981' : '#f59e0b';

    await ensureWasm();
    const fontData = await loadFont();

    const svg = await satori(
      {
        type: 'div',
        props: {
          style: {
            width: '1200px',
            height: '630px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '72px',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 60%, #16213e 100%)',
            color: 'white',
            fontFamily: 'Noto Sans SC',
          },
          children: [
            {
              type: 'div',
              props: {
                style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '32px', opacity: 0.8 },
                children: [
                  { type: 'div', props: { children: '域见•你 · NIC.BN' } },
                  {
                    type: 'div',
                    props: {
                      style: {
                        padding: '8px 24px',
                        borderRadius: '999px',
                        background: statusColor,
                        color: '#0a0a0a',
                        fontSize: '28px',
                      },
                      children: statusText,
                    },
                  },
                ],
              },
            },
            {
              type: 'div',
              props: {
                style: { display: 'flex', flexDirection: 'column', gap: '24px' },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: domain.length > 22 ? '96px' : '140px',
                        letterSpacing: '-4px',
                        lineHeight: 1,
                        wordBreak: 'break-all',
                      },
                      children: domain,
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: { display: 'flex', alignItems: 'baseline', gap: '16px' },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: { fontSize: '72px', color: '#22d3ee', letterSpacing: '-2px' },
                            children: priceText,
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: { fontSize: '32px', opacity: 0.6 },
                            children: currency,
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              type: 'div',
              props: {
                style: { fontSize: '28px', opacity: 0.7 },
                children: '精品域名一口价 · 竞价拍卖 · AI 估值 · 安全托管',
              },
            },
          ],
        },
      },
      {
        width: 1200,
        height: 630,
        fonts: [{ name: 'Noto Sans SC', data: fontData, weight: 700, style: 'normal' }],
      },
    );

    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    const png = resvg.render().asPng();

    return new Response(png, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('[og-image]', err);
    return new Response(JSON.stringify({ error: String((err as Error).message) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
