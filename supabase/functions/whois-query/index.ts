const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const WHOIS_API_BASE = 'https://xrw-tau.vercel.app/api/lookup';
const WHOIS_FALLBACK = 'https://api.whoisfreaks.com/v1.0/whois';

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
    cleanDomain = cleanDomain.replace(/^www\./, '');

    console.log('Querying WHOIS for domain:', cleanDomain);

    // Try primary API
    let whoisInfo = await queryPrimaryApi(cleanDomain);
    
    if (!whoisInfo) {
      console.log('Primary API failed, returning partial data');
      whoisInfo = {
        domain: cleanDomain,
        status: -1,
        statusText: '查询受限',
        registrar: null,
        registrarUrl: null,
        createdDate: null,
        updatedDate: null,
        expiryDate: null,
        nameServers: [],
        dnsSec: null,
        registrant: null,
        tld: cleanDomain.split('.').pop() || null,
        tags: [],
        statusTags: [],
        timezone: null,
        rdap: false,
        domainAge: null,
        remainingDays: null,
      };
    }

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

async function queryPrimaryApi(cleanDomain: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(`${WHOIS_API_BASE}?query=${encodeURIComponent(cleanDomain)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('WHOIS API error:', response.status);
      return null;
    }

    let data;
    try {
      data = await response.json();
    } catch {
      return null;
    }

    if (!data.status) {
      return null;
    }

    const result = data.result || {};
    const statusTags = (result.status || []).map((s: any) => typeof s === 'string' ? s : (s.status || JSON.stringify(s)));
    const isRegistered = !!result.registrar;
    const statusCode = isRegistered ? 1 : 0;

    // Parse dates more robustly
    const parseDate = (d: any): string | null => {
      if (!d) return null;
      if (typeof d === 'string') return d;
      if (typeof d === 'object' && d.$date) return d.$date;
      return String(d);
    };

    return {
      domain: result.domain || cleanDomain,
      status: statusCode,
      statusText: isRegistered ? '已注册' : '未注册',
      registrar: result.registrar || null,
      registrarUrl: result.registrarURL || result.registrar_url || null,
      createdDate: parseDate(result.creationDate || result.creation_date || result.created),
      updatedDate: parseDate(result.updatedDate || result.updated_date || result.updated),
      expiryDate: parseDate(result.expirationDate || result.expiration_date || result.expires),
      nameServers: Array.isArray(result.nameServers) ? result.nameServers : 
                   (Array.isArray(result.name_servers) ? result.name_servers : []),
      dnsSec: result.dnssec || result.dnsSec || null,
      registrant: result.registrant || null,
      tld: cleanDomain.split('.').pop() || null,
      tags: [],
      statusTags,
      timezone: null,
      rdap: data.source === 'rdap',
      domainAge: result.domainAge || result.domain_age || null,
      remainingDays: result.remainingDays || result.remaining_days || null,
    };
  } catch (fetchErr) {
    clearTimeout(timeoutId);
    const isTimeout = fetchErr instanceof DOMException && fetchErr.name === 'AbortError';
    console.error('WHOIS fetch error:', isTimeout ? 'timeout' : fetchErr);
    return null;
  }
}
