const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const XRW_API_BASE = 'https://www.x.rw/api/lookup';
const XRW_FALLBACK = 'https://xrw-tau.vercel.app/api/lookup';

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

    let cleanDomain = domain.trim().toLowerCase()
      .replace(/^(https?:\/\/)?/i, '')
      .replace(/\/.*$/, '')
      .replace(/^www\./, '');

    console.log('Querying WHOIS for domain:', cleanDomain);

    // Read API key from site_settings via Supabase REST API
    const apiKey = await getWhoisApiKey();
    console.log('WHOIS API key available:', !!apiKey);

    // Try authenticated API first, fall back to public proxy
    let whoisInfo = await queryWhoisApi(cleanDomain, apiKey);

    if (!whoisInfo) {
      console.log('WHOIS API failed, returning partial data');
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
    return new Response(
      JSON.stringify({ success: false, error: `WHOIS查询失败: ${error instanceof Error ? error.message : '未知错误'}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getWhoisApiKey(): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) return null;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/site_settings?key=eq.whois_api_key&select=value`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0]?.value || null;
  } catch {
    return null;
  }
}

async function queryWhoisApi(cleanDomain: string, apiKey: string | null) {
  // With an API key → use the official www.x.rw endpoint
  // Without an API key → use the public fallback proxy
  const baseUrl = apiKey ? XRW_API_BASE : XRW_FALLBACK;
  const url = `${baseUrl}?query=${encodeURIComponent(cleanDomain)}`;

  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, { method: 'GET', headers, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('WHOIS API error:', response.status, await response.text().catch(() => ''));
      return null;
    }

    let data: any;
    try { data = await response.json(); } catch { return null; }

    if (!data.status && !data.result) return null;

    const result = data.result || data || {};

    const parseDate = (d: any): string | null => {
      if (!d) return null;
      if (typeof d === 'string') return d;
      if (typeof d === 'object' && d.$date) return d.$date;
      return String(d);
    };

    const statusTags: string[] = (result.status || []).map((s: any) =>
      typeof s === 'string' ? s : (s.status || JSON.stringify(s))
    );

    const nameServers = Array.isArray(result.nameServers)
      ? result.nameServers
      : Array.isArray(result.name_servers)
        ? result.name_servers
        : Array.isArray(result.nameservers)
          ? result.nameservers
          : [];

    const isRegistered = !!(result.registrar || result.creationDate || result.creation_date || result.created);

    return {
      domain: result.domain || cleanDomain,
      status: isRegistered ? 1 : 0,
      statusText: isRegistered ? '已注册' : '未注册',
      registrar: result.registrar || null,
      registrarUrl: result.registrarURL || result.registrar_url || null,
      createdDate: parseDate(result.creationDate || result.creation_date || result.created),
      updatedDate: parseDate(result.updatedDate || result.updated_date || result.updated),
      expiryDate: parseDate(result.expirationDate || result.expiration_date || result.expires),
      nameServers,
      dnsSec: result.dnssec || result.dnsSec || result.DNSSEC || null,
      registrant: result.registrant || null,
      tld: cleanDomain.split('.').pop() || null,
      tags: [],
      statusTags,
      timezone: null,
      rdap: !!(data.source === 'rdap' || data.rdap),
      domainAge: result.domainAge || result.domain_age || null,
      remainingDays: result.remainingDays || result.remaining_days || null,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof DOMException && err.name === 'AbortError';
    console.error('WHOIS fetch error:', isTimeout ? 'timeout' : err);
    return null;
  }
}
