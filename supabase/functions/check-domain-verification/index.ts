
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const { verificationId, domainId } = await req.json()
    
    if (!verificationId || !domainId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters', 
          verified: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data: verification, error: verificationError } = await supabase
      .from('domain_verifications')
      .select('verification_method, verification_data')
      .eq('id', verificationId)
      .single()
    
    if (verificationError || !verification) {
      return new Response(
        JSON.stringify({ 
          error: verificationError?.message || 'Verification not found', 
          verified: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }
    
    const { data: domain, error: domainError } = await supabase
      .from('domain_listings')
      .select('name')
      .eq('id', domainId)
      .single()
    
    if (domainError || !domain) {
      return new Response(
        JSON.stringify({ 
          error: domainError?.message || 'Domain not found', 
          verified: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }
    
    let verified = false
    let message = 'Verification failed. Please try again.'
    
    const token = verification.verification_data?.token;

    switch (verification.verification_method) {
      case 'dns':
        const recordName = verification.verification_data.recordName;
        const recordValue = verification.verification_data.recordValue;
        try {
          console.log(`Checking DNS TXT record: ${recordName} = ${recordValue}`);
          const dnsRecords = await Deno.resolveDns(recordName, "TXT");
          console.log(`DNS records found:`, dnsRecords);
          const txtValues = dnsRecords.flat();
          if (txtValues.includes(recordValue)) {
            verified = true;
            message = 'DNS 验证成功！域名所有权已确认。';
          } else {
            message = `DNS 验证失败：找到了 '${recordName}' 的 TXT 记录，但值不匹配。\n\n期望值：${recordValue}\n实际值：${txtValues.join(', ')}\n\n请检查您的 DNS 记录设置是否正确。`;
          }
        } catch (error) {
          console.error('DNS verification error:', error);
          if (error.name === 'NotFound') {
            message = `DNS 验证失败：未找到 '${recordName}' 的 DNS 记录。\n\n可能原因：\n1. DNS 记录尚未添加\n2. DNS 记录添加后还未生效（通常需要3-10分钟）\n3. 主机记录填写错误（应为 '_domainverify' 而非完整域名）\n\n请确保：\n• 在DNS服务商添加 TXT 记录\n• 主机记录为：_domainverify\n• 记录值为：${recordValue}\n• 等待DNS生效后再次检查`;
          } else {
            message = `DNS 检查过程出错，请稍后重试。\n\n错误信息：${error.message}\n\n如果问题持续，请联系技术支持。`;
          }
        }
        break
        
      case 'file':
        const fileLocation = verification.verification_data.fileLocation;
        const fileContent = verification.verification_data.fileContent;
        const urlToFetch = `https://${domain.name}${fileLocation}`;
        try {
          const response = await fetch(urlToFetch, { headers: { 'Cache-Control': 'no-cache' } });
          if (response.ok) {
            const text = await response.text();
            if (text.trim() === fileContent) {
              verified = true;
              message = 'File verification successful.';
            } else {
              message = `File content mismatch. We found content, but it did not match the expected verification token. Please check the file content.`;
            }
          } else {
            message = `Verification file not found at ${urlToFetch}. Server responded with status ${response.status}. Please check the file path and that your domain is accessible.`;
          }
        } catch (error) {
          console.error('File verification error:', error);
          message = `Could not connect to ${urlToFetch} to verify the file. Please ensure your domain is accessible and DNS is configured correctly.`;
        }
        break
        
      case 'html':
        const metaName = verification.verification_data.metaName;
        const metaToken = verification.verification_data.token;
        const homeUrl = `https://${domain.name}`;
        try {
          const response = await fetch(homeUrl, { headers: { 'Cache-Control': 'no-cache' } });
          if (response.ok) {
            const html = await response.text();
            const metaTagRegex = new RegExp(`<meta[^>]+name=["']${metaName}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
            const match = html.match(metaTagRegex);
            if (match && match[1] === metaToken) {
              verified = true;
              message = 'HTML tag verification successful.';
            } else {
              message = `HTML meta tag not found on your homepage, or its content does not match. Please ensure the tag <meta name="${metaName}" content="${metaToken}"> is present in the <head> section.`;
            }
          } else {
            message = `Could not access your homepage at ${homeUrl}. Server responded with status ${response.status}.`;
          }
        } catch (error) {
          console.error('HTML verification error:', error);
          message = `Could not connect to ${homeUrl} to check the HTML tag. Please ensure your domain is accessible.`;
        }
        break
      
      case 'whois':
        message = 'WHOIS verification is not automatically checked. An administrator will review it manually.';
        break;

      case 'email':
        message = 'Email verification is confirmed by clicking the link in the email. If you have clicked it, please refresh the status.';
        break
        
      default:
        message = 'Unsupported verification method for automatic check.'
    }
    
    if (verified) {
      await supabase
        .from('domain_verifications')
        .update({ status: 'verified' })
        .eq('id', verificationId)
        
      await supabase
        .from('domain_listings')
        .update({ 
          verification_status: 'verified',
          is_verified: true
        })
        .eq('id', domainId)
    }
    
    return new Response(
      JSON.stringify({ verified, message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message, verified: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
