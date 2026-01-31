const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
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

    // Clean domain name (remove protocol and paths)
    let cleanDomain = domain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^(https?:\/\/)?/i, '');
    cleanDomain = cleanDomain.replace(/\/.*$/, '');

    console.log('Querying WHOIS for domain:', cleanDomain);

    // Call the external WHOIS API
    const response = await fetch(`https://api.tian.hu/whois/${encodeURIComponent(cleanDomain)}`, {
      method: 'GET',
      headers: {
        'lang': 'zh',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limited by WHOIS API');
        return new Response(
          JSON.stringify({ success: false, error: '查询频率超限，请稍后再试' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.error('WHOIS API error:', response.status);
      return new Response(
        JSON.stringify({ success: false, error: `WHOIS查询失败: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('WHOIS query successful for:', cleanDomain);

    // Extract and format the relevant information
    const formatted = data.formatted || {};
    const whoisInfo = {
      domain: data.domain || cleanDomain,
      status: data.status,
      statusText: getStatusText(data.status),
      registrar: formatted.registrar || null,
      registrarUrl: formatted.registrarUrl || null,
      createdDate: formatted.createdDate || formatted.creationDate || null,
      updatedDate: formatted.updatedDate || null,
      expiryDate: formatted.expiryDate || formatted.expirationDate || null,
      nameServers: formatted.nameServers || formatted.dns || [],
      dnsSec: formatted.dnsSec || null,
      registrant: formatted.registrant || null,
      admin: formatted.admin || null,
      tech: formatted.tech || null,
      tld: data.tld || null,
      tags: data.tags || [],
      statusTags: data.statusTags || [],
      timezone: data.timezone || null,
      rdap: data.rdap || false,
      rawResult: data.result || null,
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
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getStatusText(status: number): string {
  switch (status) {
    case -1:
      return '未知';
    case 0:
      return '未注册';
    case 1:
      return '已注册';
    case 2:
      return '保留域名';
    case 3:
      return 'DROPZONE';
    case 4:
      return '受保护';
    default:
      return '未知状态';
  }
}
