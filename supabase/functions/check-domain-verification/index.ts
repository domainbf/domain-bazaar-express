
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
    const { verificationId, domainId, recordName: directRecordName, expectedValue: directExpectedValue, checkOnly } = await req.json()
    
    // 支持直接DNS检查模式（不需要数据库记录）
    if (checkOnly && directRecordName && directExpectedValue) {
      console.log(`Direct DNS check mode for: ${directRecordName}`)
      
      const normalized = directRecordName.toLowerCase().replace(/\.$/, '')
      const fqdn = `${normalized}.`
      
      let txtValues: string[] = []
      let dnsServersChecked: any = {}
      
      // Method 1: Native Deno DNS
      try {
        const dnsRecords = await Deno.resolveDns(fqdn, 'TXT')
        txtValues = dnsRecords.flat()
        dnsServersChecked.native = { success: true, values: txtValues }
      } catch (nativeErr) {
        dnsServersChecked.native = { success: false, error: (nativeErr as any).message }
      }
      
      // Method 2: Google Public DNS
      try {
        const googleDohUrl = `https://dns.google/resolve?name=${encodeURIComponent(normalized)}&type=TXT`
        const googleResp = await fetch(googleDohUrl, { headers: { 'Cache-Control': 'no-cache' } })
        if (googleResp.ok) {
          const json = await googleResp.json()
          const answers = Array.isArray(json.Answer) ? json.Answer : []
          const googleValues = answers
            .filter((a: any) => a.type === 16 && typeof a.data === 'string')
            .map((a: any) => a.data.replace(/^\"|\"$/g, ''))
          
          googleValues.forEach(val => {
            if (!txtValues.includes(val)) txtValues.push(val)
          })
          
          dnsServersChecked.google = { success: true, values: googleValues }
        }
      } catch (googleErr) {
        dnsServersChecked.google = { success: false, error: (googleErr as any).message }
      }

      // Method 3: Cloudflare DNS
      try {
        const cloudflareDohUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(normalized)}&type=TXT`
        const cloudflareResp = await fetch(cloudflareDohUrl, { 
          headers: { 
            'Accept': 'application/dns-json',
            'Cache-Control': 'no-cache' 
          } 
        })
        if (cloudflareResp.ok) {
          const json = await cloudflareResp.json()
          const answers = Array.isArray(json.Answer) ? json.Answer : []
          const cloudflareValues = answers
            .filter((a: any) => a.type === 16 && typeof a.data === 'string')
            .map((a: any) => a.data.replace(/^\"|\"$/g, ''))
          
          cloudflareValues.forEach(val => {
            if (!txtValues.includes(val)) txtValues.push(val)
          })
          
          dnsServersChecked.cloudflare = { success: true, values: cloudflareValues }
        }
      } catch (cloudflareErr) {
        dnsServersChecked.cloudflare = { success: false, error: (cloudflareErr as any).message }
      }

      const verified = txtValues.includes(directExpectedValue)
      const message = verified 
        ? '✅ DNS TXT记录验证成功！' 
        : `❌ 未找到匹配的TXT记录\n找到的值: ${txtValues.join(', ') || '无'}`
      
      return new Response(
        JSON.stringify({ verified, message, dnsServers: dnsServersChecked }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
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
    let message = 'DNS验证失败，请重试。'
    
    // 仅支持DNS验证
    if (verification.verification_method !== 'dns') {
      return new Response(
        JSON.stringify({ 
          error: '当前仅支持DNS TXT记录验证', 
          verified: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    try {
      const inputRecordName: string = String(verification.verification_data.recordName || '').trim()
      const expectedValue: string = String(verification.verification_data.recordValue || verification.verification_data.token || '').trim()

      // Normalize: lowercase, ensure fully qualified domain name to avoid resolver search suffixes
      const normalized = inputRecordName.toLowerCase().replace(/\.$/, '')
      const fqdn = `${normalized}.`

      console.log(`Checking DNS TXT record (FQDN): ${fqdn} expecting value: ${expectedValue}`)

      let txtValues: string[] = []
      let dnsServersChecked: any = {}
      
      // Try multiple DNS resolution methods for better reliability
      
      // Method 1: Native Deno DNS
      try {
        const dnsRecords = await Deno.resolveDns(fqdn, 'TXT')
        console.log('DNS records found (native):', dnsRecords)
        txtValues = dnsRecords.flat()
        dnsServersChecked.native = { success: true, values: txtValues }
      } catch (nativeErr) {
        console.warn('Native DNS resolve failed:', nativeErr)
        dnsServersChecked.native = { success: false, error: (nativeErr as any).message }
      }
      
      // Method 2: Google Public DNS (8.8.8.8)
      try {
        const googleDohUrl = `https://dns.google/resolve?name=${encodeURIComponent(normalized)}&type=TXT`;
        const googleResp = await fetch(googleDohUrl, { headers: { 'Cache-Control': 'no-cache' } })
        if (googleResp.ok) {
          const json = await googleResp.json()
          const answers = Array.isArray(json.Answer) ? json.Answer : []
          const googleValues = answers
            .filter((a: any) => a.type === 16 && typeof a.data === 'string')
            .map((a: any) => a.data.replace(/^\"|\"$/g, ''))
          
          // Merge with existing values
          googleValues.forEach(val => {
            if (!txtValues.includes(val)) txtValues.push(val)
          })
          
          dnsServersChecked.google = { success: true, values: googleValues }
          console.log('Google DNS result:', googleValues)
        } else {
          throw new Error(`Google DoH query failed with status ${googleResp.status}`)
        }
      } catch (googleErr) {
        console.warn('Google DNS resolve failed:', googleErr)
        dnsServersChecked.google = { success: false, error: (googleErr as any).message }
      }

      // Method 3: Cloudflare DNS (1.1.1.1)
      try {
        const cloudflareDohUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(normalized)}&type=TXT`;
        const cloudflareResp = await fetch(cloudflareDohUrl, { 
          headers: { 
            'Accept': 'application/dns-json',
            'Cache-Control': 'no-cache' 
          } 
        })
        if (cloudflareResp.ok) {
          const json = await cloudflareResp.json()
          const answers = Array.isArray(json.Answer) ? json.Answer : []
          const cloudflareValues = answers
            .filter((a: any) => a.type === 16 && typeof a.data === 'string')
            .map((a: any) => a.data.replace(/^\"|\"$/g, ''))
          
          // Merge with existing values
          cloudflareValues.forEach(val => {
            if (!txtValues.includes(val)) txtValues.push(val)
          })
          
          dnsServersChecked.cloudflare = { success: true, values: cloudflareValues }
          console.log('Cloudflare DNS result:', cloudflareValues)
        } else {
          throw new Error(`Cloudflare DoH query failed with status ${cloudflareResp.status}`)
        }
      } catch (cloudflareErr) {
        console.warn('Cloudflare DNS resolve failed:', cloudflareErr)
        dnsServersChecked.cloudflare = { success: false, error: (cloudflareErr as any).message }
      }

      console.log('All DNS servers checked:', dnsServersChecked)
      console.log('Combined TXT values found:', txtValues)

      if (txtValues.includes(expectedValue)) {
        verified = true
        message = '✅ DNS 验证成功！域名所有权已确认。'
      } else if (txtValues.length > 0) {
        message = `❌ DNS 验证失败：找到了 '${normalized}' 的 TXT 记录，但值不匹配。\n\n📋 期望值：\n${expectedValue}\n\n📋 实际找到的值：\n${txtValues.map((v, i) => `${i + 1}. ${v}`).join('\n')}\n\n🔍 请检查您的 DNS 记录设置：\n• 确认记录值完全匹配（包括大小写和特殊字符）\n• 确认没有多余的空格或引号\n• 如果有多条TXT记录，请确保验证码的记录存在\n\n💡 提示：您可以删除错误的记录，重新添加正确的记录值。`
      } else {
        // Build detailed diagnostic message
        const serverStatus = []
        if (dnsServersChecked.native) {
          serverStatus.push(`• 本地DNS: ${dnsServersChecked.native.success ? '✓ 连接成功但未找到记录' : '✗ 查询失败'}`)
        }
        if (dnsServersChecked.google) {
          serverStatus.push(`• Google DNS (8.8.8.8): ${dnsServersChecked.google.success ? '✓ 连接成功但未找到记录' : '✗ 查询失败'}`)
        }
        if (dnsServersChecked.cloudflare) {
          serverStatus.push(`• Cloudflare DNS (1.1.1.1): ${dnsServersChecked.cloudflare.success ? '✓ 连接成功但未找到记录' : '✗ 查询失败'}`)
        }

        message = `❌ DNS 验证失败：未找到 '${normalized}' 的 TXT 记录。\n\n🔍 DNS服务器查询结果：\n${serverStatus.join('\n')}\n\n📝 可能原因：\n1. DNS 记录尚未添加到您的DNS服务商\n2. DNS 记录已添加但还未生效（通常需要3-10分钟，全球完全生效可达24-48小时）\n3. 主机记录填写错误（应为 '_domainverify' 而非完整域名 '${normalized}'）\n4. 记录添加到了错误的域名或子域名\n\n✅ 请确保正确设置：\n━━━━━━━━━━━━━━━━━━━━\n记录类型：TXT\n主机记录：_domainverify\n完整记录名称：${normalized}\n记录值：${expectedValue}\n━━━━━━━━━━━━━━━━━━━━\n\n💡 操作建议：\n1. 登录您的DNS服务商（如阿里云、腾讯云、Cloudflare等）\n2. 检查是否已正确添加上述TXT记录\n3. 主机记录栏只需填写 "_domainverify"，不要包含域名\n4. 记录值要完整复制粘贴，不要有空格或换行\n5. 保存后等待3-10分钟让DNS生效\n6. 使用页面上的"DNS记录实时检查"工具验证设置\n\n⏱️ 如果您刚添加记录，请等待10分钟后再次尝试验证。`
      }
    } catch (error) {
      console.error('DNS verification error:', error)
      message = `⚠️ DNS 检查过程出错，请稍后重试。\n\n错误详情：${(error as any).message}\n\n如果问题持续，请联系技术支持。`
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
