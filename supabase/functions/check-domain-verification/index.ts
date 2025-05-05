
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
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get verification data
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
    
    // Get domain data
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
    
    // Based on verification method, check verification
    switch (verification.verification_method) {
      case 'dns':
        // Check DNS verification
        try {
          // This is a simplified implementation. In a real-world scenario, 
          // you would use a DNS lookup service to verify DNS records
          const token = verification.verification_data?.token || 'missing-token'
          const dnsResponse = await fetch(`https://dns-api.org/TXT/${domain.name}`)
          const dnsData = await dnsResponse.json()
          
          if (Array.isArray(dnsData) && dnsData.some(record => record.value.includes(token))) {
            verified = true
            message = 'DNS verification successful'
          } else {
            message = 'DNS verification failed. TXT record not found or does not match.'
          }
        } catch (error) {
          console.error('DNS verification error:', error)
          message = 'Error checking DNS verification. Please try again.'
        }
        break
        
      case 'file':
        // Check file verification
        try {
          const filePath = verification.verification_data?.filePath || ''
          const token = verification.verification_data?.token || ''
          
          const fileResponse = await fetch(`https://${domain.name}/${filePath}`, {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' }
          })
          
          if (fileResponse.ok) {
            const fileContent = await fileResponse.text()
            if (fileContent.trim() === token) {
              verified = true
              message = 'File verification successful'
            } else {
              message = 'Verification file content does not match the expected token'
            }
          } else {
            message = `Verification file not found. Please make sure you've uploaded it to: ${filePath}`
          }
        } catch (error) {
          console.error('File verification error:', error)
          message = 'Error checking file verification. Please try again.'
        }
        break
        
      case 'html':
        // Check HTML meta tag verification
        try {
          const token = verification.verification_data?.token || ''
          const metaName = verification.verification_data?.metaName || 'domain-verification'
          
          const htmlResponse = await fetch(`https://${domain.name}`, {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' }
          })
          
          if (htmlResponse.ok) {
            const htmlContent = await htmlResponse.text()
            const metaTagRegex = new RegExp(`<meta\\s+name=["']${metaName}["']\\s+content=["']${token}["']`, 'i')
            
            if (metaTagRegex.test(htmlContent)) {
              verified = true
              message = 'HTML verification successful'
            } else {
              message = 'Meta tag not found or does not match the expected token'
            }
          } else {
            message = 'Could not access the website. Please make sure the site is accessible.'
          }
        } catch (error) {
          console.error('HTML verification error:', error)
          message = 'Error checking HTML verification. Please try again.'
        }
        break
        
      case 'email':
        // Email verification is handled separately with a token click
        // This is a simplified implementation for testing
        const emailToken = verification.verification_data?.token || ''
        const requestToken = verification.verification_data?.requestToken || ''
        
        if (emailToken && requestToken && emailToken === requestToken) {
          verified = true
          message = 'Email verification successful'
        } else {
          message = 'Email verification token is invalid or expired'
        }
        break
        
      default:
        message = 'Unsupported verification method'
    }
    
    // If verification is successful, update domain verification status
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
