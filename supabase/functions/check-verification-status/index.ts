
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    const { verificationId, domainName, method, verificationData } = await req.json()
    
    if (!verificationId || !domainName || !method) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Missing required parameters'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    let result = {
      success: false,
      message: 'Verification pending',
      details: {}
    }
    
    switch (method) {
      case 'dns':
        // Simple check to see if DNS propagation might have completed
        result.details = {
          expectedRecord: `TXT record with value: ${verificationData?.token || ''}`,
          status: 'pending',
          checkTime: new Date().toISOString()
        }
        result.message = 'DNS verification is pending. DNS changes can take 24-48 hours to propagate. Please check back later.'
        break
        
      case 'file':
        result.details = {
          filePath: verificationData?.filePath || '',
          expectedContent: verificationData?.token || '',
          status: 'pending'
        }
        result.message = 'File verification is pending. Please ensure you have uploaded the verification file to your web server.'
        break
        
      case 'html':
        result.details = {
          metaTag: `<meta name="${verificationData?.metaName || 'domain-verification'}" content="${verificationData?.token || ''}" />`,
          status: 'pending'
        }
        result.message = 'HTML verification is pending. Please ensure you have added the meta tag to your website\'s home page.'
        break
        
      case 'email':
        result.details = {
          emailSentTo: verificationData?.email || 'your domain contact email',
          status: 'pending'
        }
        result.message = 'Email verification is pending. Please check your email and click the verification link.'
        break
        
      default:
        result.message = 'Unknown verification method'
    }
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Error checking verification status: ${error.message}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
