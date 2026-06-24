const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const API_BASE = 'https://whois-nic.vercel.app/api/';

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

    const cleanDomain = domain.trim().toLowerCase()
      .replace(/^(https?:\/\/)?/i, '')
      .replace(/\/.*$/, '')
      .replace(/^www\./, '');

    console.log('Querying WHOIS via whois-nic for:', cleanDomain);

    const whoisInfo = await queryWhoisApi(cleanDomain);

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

function parseRdapDnssec(rdapStr: string | undefined): string | null {
  if (!rdapStr) return null;
  try {
    const rdap = JSON.parse(rdapStr);
    const ds = rdap?.secureDNS;
    if (!ds) return null;
    return ds.delegationSigned ? 'signed' : 'unsigned';
  } catch {
    return null;
  }
}

function parseRegistrantFromWhois(text: string | undefined) {
  if (!text) return null;
  const grab = (re: RegExp) => {
    const m = text.match(re);
    return m ? m[1].trim() : undefined;
  };
  const registrant = {
    name: grab(/Registrant Name:\s*(.+)/i),
    organization: grab(/Registrant Organization:\s*(.+)/i),
    country: grab(/Registrant Country:\s*(.+)/i),
  };
  if (!registrant.name && !registrant.organization && !registrant.country) return null;
  return registrant;
}

async function queryWhoisApi(cleanDomain: string) {
  const url = `${API_BASE}?domain=${encodeURIComponent(cleanDomain)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('WHOIS API non-OK:', response.status);
      return emptyResult(cleanDomain, '查询失败');
    }

    const payload = await response.json().catch(() => null);
    const data = payload?.data;
    if (!data) return emptyResult(cleanDomain, '无数据');

    const registered = !!data.registered;
    const statusTags: string[] = Array.isArray(data.status)
      ? data.status.map((s: any) => (typeof s === 'string' ? s : s?.text)).filter(Boolean)
      : [];

    const dnssec = parseRdapDnssec(data.rdapData);
    const registrant = parseRegistrantFromWhois(data.whoisData);

    const ageSeconds = typeof data.ageSeconds === 'number' ? data.ageSeconds : null;
    const remainingSeconds = typeof data.remainingSeconds === 'number' ? data.remainingSeconds : null;

    return {
      domain: data.domain || cleanDomain,
      status: registered ? 1 : 0,
      statusText: registered ? '已注册' : (data.reserved ? '保留' : '未注册'),
      registrar: data.registrar || null,
      registrarUrl: data.registrarURL || null,
      createdDate: data.creationDateISO8601 || data.creationDate || null,
      updatedDate: data.updatedDateISO8601 || data.updatedDate || null,
      expiryDate: data.expirationDateISO8601 || data.expirationDate || null,
      nameServers: Array.isArray(data.nameServers) ? data.nameServers : [],
      dnsSec: dnssec,
      registrant,
      tld: cleanDomain.split('.').pop() || null,
      tags: [],
      statusTags,
      timezone: null,
      rdap: !!data.rdapData,
      domainAge: ageSeconds ? Math.floor(ageSeconds / 86400) : null,
      remainingDays: remainingSeconds ? Math.floor(remainingSeconds / 86400) : null,
      rawWhois: data.whoisData || null,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof DOMException && err.name === 'AbortError';
    console.error('WHOIS fetch error:', isTimeout ? 'timeout' : err);
    return emptyResult(cleanDomain, isTimeout ? '请求超时' : '查询失败');
  }
}

function emptyResult(cleanDomain: string, statusText: string) {
  return {
    domain: cleanDomain,
    status: -1,
    statusText,
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
    rawWhois: null,
  };
}
