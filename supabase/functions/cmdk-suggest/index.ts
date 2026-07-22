// AI-powered command palette suggestions.
// Returns related domain keyword ideas + suggested TLDs for the query.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { query } = await req.json();
    const q = String(query || '').trim().slice(0, 60);
    if (!q) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content:
              '你是域名投资顾问。基于用户输入，返回相关联的英文短单词/组合域名想法。' +
              '只返回 JSON，形如 {"suggestions":[{"name":"example.com","reason":"品牌向"}]}，最多 6 条。' +
              '优先常见 TLD (.com/.io/.ai/.co)，长度 ≤ 12。',
          },
          { role: 'user', content: `关键词: ${q}` },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ suggestions: [], error: t.slice(0, 200) }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content || '{}';
    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { suggestions: [] };
    }
    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions
          .filter((s: any) => s && typeof s.name === 'string')
          .slice(0, 6)
          .map((s: any) => ({ name: String(s.name).toLowerCase().slice(0, 40), reason: String(s.reason || '').slice(0, 60) }))
      : [];

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ suggestions: [], error: err instanceof Error ? err.message : 'error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
