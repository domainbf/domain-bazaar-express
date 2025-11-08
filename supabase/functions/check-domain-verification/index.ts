
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

      // Build candidate names to catch common misconfigurations
      const baseDomain = normalized.replace(/^_domainverify\./, '')
      const doubleAppended = `${normalized}.${baseDomain}` // e.g. _domainverify.example.com.example.com
      const candidates = Array.from(new Set([normalized, baseDomain, doubleAppended]))

      const txtValuesSet = new Set<string>()
      const dnsServersChecked: Record<string, any> = {}

      for (const name of candidates) {
        const nameFqdn = `${name}.`
        dnsServersChecked[name] = {}

        // Method 1: Native Deno DNS
        try {
          const dnsRecords = await Deno.resolveDns(nameFqdn, 'TXT')
          const values = dnsRecords.flat()
          values.forEach(v => txtValuesSet.add(String(v).replace(/^\"|\"$/g, '')))
          dnsServersChecked[name].native = { success: true, values }
        } catch (nativeErr) {
          dnsServersChecked[name].native = { success: false, error: (nativeErr as any).message }
        }

        // Method 2: Google Public DNS
        try {
          const googleDohUrl = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=TXT`
          const googleResp = await fetch(googleDohUrl, { headers: { 'Cache-Control': 'no-cache' } })
          if (googleResp.ok) {
            const json = await googleResp.json()
            const answers = Array.isArray(json.Answer) ? json.Answer : []
            const googleValues = answers
              .filter((a: any) => a.type === 16 && typeof a.data === 'string')
              .map((a: any) => a.data.replace(/^\"|\"$/g, ''))
            googleValues.forEach(v => txtValuesSet.add(v))
            dnsServersChecked[name].google = { success: true, values: googleValues }
          } else {
            throw new Error(`Google DoH status ${googleResp.status}`)
          }
        } catch (googleErr) {
          dnsServersChecked[name].google = { success: false, error: (googleErr as any).message }
        }

        // Method 3: Cloudflare DNS
        try {
          const cloudflareDohUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=TXT`
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
            cloudflareValues.forEach(v => txtValuesSet.add(v))
            dnsServersChecked[name].cloudflare = { success: true, values: cloudflareValues }
          } else {
            throw new Error(`Cloudflare DoH status ${cloudflareResp.status}`)
          }
        } catch (cloudflareErr) {
          dnsServersChecked[name].cloudflare = { success: false, error: (cloudflareErr as any).message }
        }
      }

      const txtValues = Array.from(txtValuesSet)
      const norm = (s: string) => String(s).replace(/^\"|\"$/g, '').trim()
      const expected = norm(directExpectedValue)

      // Match if exact OR value contains expected (case-insensitive) to handle providers quoting/splitting
      const verified = txtValues.some(v => {
        const nv = norm(v)
        return nv === expected || nv.toLowerCase().includes(expected.toLowerCase())
      })

      const message = verified
        ? '✅ DNS TXT记录验证成功！'
        : `❌ 未找到匹配的TXT记录\n已检查名称: ${candidates.join(', ')}\n找到的值: ${txtValues.join(', ') || '无'}`

      return new Response(
        JSON.stringify({ verified, message, dnsServers: dnsServersChecked, checkedNames: candidates }),
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

      // Normalize and build candidate names
      const normalized = inputRecordName.toLowerCase().replace(/\.$/, '')
      const baseDomain = normalized.replace(/^_domainverify\./, '')
      const doubleAppended = `${normalized}.${baseDomain}`
      const candidates = Array.from(new Set([normalized, baseDomain, doubleAppended]))

      console.log(`Checking DNS TXT candidates: ${candidates.join(', ')} expecting: ${expectedValue}`)

      const txtValuesSet = new Set<string>()
      const dnsServersChecked: Record<string, any> = {}

      for (const name of candidates) {
        dnsServersChecked[name] = {}
        // Method 1: Native Deno DNS
        try {
          const dnsRecords = await Deno.resolveDns(`${name}.`, 'TXT')
          const values = dnsRecords.flat()
          values.forEach(v => txtValuesSet.add(String(v).replace(/^\"|\"$/g, '')))
          dnsServersChecked[name].native = { success: true, values }
        } catch (nativeErr) {
          console.warn('Native DNS resolve failed:', nativeErr)
          dnsServersChecked[name].native = { success: false, error: (nativeErr as any).message }
        }

        // Method 2: Google DNS
        try {
          const googleDohUrl = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=TXT`
          const googleResp = await fetch(googleDohUrl, { headers: { 'Cache-Control': 'no-cache' } })
          if (googleResp.ok) {
            const json = await googleResp.json()
            const answers = Array.isArray(json.Answer) ? json.Answer : []
            const googleValues = answers
              .filter((a: any) => a.type === 16 && typeof a.data === 'string')
              .map((a: any) => a.data.replace(/^\"|\"$/g, ''))
            googleValues.forEach(v => txtValuesSet.add(v))
            dnsServersChecked[name].google = { success: true, values: googleValues }
            console.log('Google DNS result for', name, ':', googleValues)
          } else {
            throw new Error(`Google DoH query failed with status ${googleResp.status}`)
          }
        } catch (googleErr) {
          console.warn('Google DNS resolve failed:', googleErr)
          dnsServersChecked[name].google = { success: false, error: (googleErr as any).message }
        }

        // Method 3: Cloudflare DNS
        try {
          const cloudflareDohUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=TXT`
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
            cloudflareValues.forEach(v => txtValuesSet.add(v))
            dnsServersChecked[name].cloudflare = { success: true, values: cloudflareValues }
            console.log('Cloudflare DNS result for', name, ':', cloudflareValues)
          } else {
            throw new Error(`Cloudflare DoH query failed with status ${cloudflareResp.status}`)
          }
        } catch (cloudflareErr) {
          console.warn('Cloudflare DNS resolve failed:', cloudflareErr)
          dnsServersChecked[name].cloudflare = { success: false, error: (cloudflareErr as any).message }
        }
      }

      const txtValues = Array.from(txtValuesSet)
      console.log('All DNS servers checked (by name):', dnsServersChecked)
      console.log('Combined TXT values found:', txtValues)

      const norm = (s: string) => String(s).replace(/^\"|\"$/g, '').trim()
      const expected = norm(expectedValue)

      if (txtValues.some(v => {
        const nv = norm(v)
        return nv === expected || nv.toLowerCase().includes(expected.toLowerCase())
      })) {
        verified = true
        message = '✅ DNS 验证成功！域名所有权已确认。'
      } else if (txtValues.length > 0) {
        message = `❌ DNS 验证失败：找到了 '${candidates.join(' / ')}' 的 TXT 记录，但值不匹配。\n\n📋 期望值：\n${expected}\n\n📋 实际找到的值：\n${txtValues.map((v, i) => `${i + 1}. ${v}`).join('\n')}\n\n🔍 请检查：\n• 确保主机记录为 \"_domainverify\"（不要填写完整域名）\n• 如果复制了完整域名，实际生成为：${doubleAppended}，请更正\n• 可将记录添加在根域(${baseDomain})与 _domainverify 同时存在以加速传播` 
      } else {
        const serverStatusLines: string[] = []
        for (const [name, status] of Object.entries(dnsServersChecked)) {
          if (status.native) serverStatusLines.push(`• ${name} - 本地DNS: ${status.native.success ? '✓ 连接成功但未找到记录' : '✗ 查询失败'}`)
          if (status.google) serverStatusLines.push(`• ${name} - Google DNS: ${status.google.success ? '✓ 连接成功但未找到记录' : '✗ 查询失败'}`)
          if (status.cloudflare) serverStatusLines.push(`• ${name} - Cloudflare DNS: ${status.cloudflare.success ? '✓ 连接成功但未找到记录' : '✗ 查询失败'}`)
        }

        message = `❌ DNS 验证失败：未找到候选名称 (${candidates.join(', ')}) 的 TXT 记录。\n\n🔍 DNS服务器查询结果：\n${serverStatusLines.join('\n')}`
      }
    } catch (error) {
      console.error('DNS verification error:', error)
      message = `⚠️ DNS 检查过程出错，请稍后重试。\n\n错误详情：${(error as any).message}`
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
