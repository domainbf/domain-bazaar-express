const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const WHOIS_API_BASE = 'https://xrw-tau.vercel.app/api/lookup';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();

    if (!domain) {
      return new Response(
        JSON.stringify({ success: false, error: '域名参数不能为空' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let cleanDomain = domain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^(https?:\/\/)?/i, '');
    cleanDomain = cleanDomain.replace(/\/.*$/, '');

    console.log('Querying WHOIS for domain:', cleanDomain);

    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let response;
    try {
      response = await fetch(`${WHOIS_API_BASE}?query=${encodeURIComponent(cleanDomain)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const isTimeout = fetchErr instanceof DOMException && fetchErr.name === 'AbortError';
      console.error('WHOIS fetch error:', fetchErr);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: isTimeout ? 'WHOIS查询超时，请稍后重试' : '无法连接WHOIS服务，请稍后重试'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('WHOIS API error:', response.status);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: '查询频率超限，请稍后再试' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // For 500 or other server errors, return graceful error instead of forwarding status
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `该域名的WHOIS信息暂时无法查询（上游服务错误: ${response.status}），请稍后重试` 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let data;
    try {
      data = await response.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'WHOIS查询返回了无效的数据格式' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('WHOIS query successful for:', cleanDomain);

    if (!data.status) {
      return new Response(
        JSON.stringify({ success: false, error: data.error || '该域名的WHOIS信息暂时不可用' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = data.result || {};

    // Map status array to statusTags
    const statusTags = (result.status || []).map((s: any) => s.status || s);

    // Determine registration status
    const isRegistered = !!result.registrar;
    const statusCode = isRegistered ? 1 : 0;

    const whoisInfo = {
      domain: result.domain || cleanDomain,
      status: statusCode,
      statusText: isRegistered ? '已注册' : '未注册',
      registrar: result.registrar || null,
      registrarUrl: result.registrarURL || null,
      createdDate: result.creationDate || null,
      updatedDate: result.updatedDate || null,
      expiryDate: result.expirationDate || null,
      nameServers: result.nameServers || [],
      dnsSec: result.dnssec || null,
      registrant: null,
      tld: cleanDomain.split('.').pop() || null,
      tags: [],
      statusTags,
      timezone: null,
      rdap: data.source === 'rdap',
      domainAge: result.domainAge || null,
      remainingDays: result.remainingDays || null,
    };

    return new Response(
      JSON.stringify({ success: true, data: whoisInfo }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error querying WHOIS:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return new Response(
      JSON.stringify({ success: false, error: `WHOIS查询失败: ${errorMessage}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
