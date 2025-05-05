
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
    const { verificationId, domainName, verificationData } = await req.json()
    
    if (!verificationId || !domainName) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Generate a new token if this is an email verification
    let updatedVerificationData = { ...verificationData }
    if (verificationData?.method === 'email') {
      const token = crypto.randomUUID()
      updatedVerificationData.token = token
      
      // Update the verification record with the new token
      const { error: updateError } = await supabase
        .from('domain_verifications')
        .update({ 
          verification_data: updatedVerificationData,
          updated_at: new Date().toISOString()
        })
        .eq('id', verificationId)
      
      if (updateError) {
        throw new Error(`Failed to update verification data: ${updateError.message}`)
      }
      
      // In a real application, you would send an email with the verification link
      // For this example, we'll just simulate it
      console.log(`Sending verification email for domain: ${domainName}`)
      console.log(`Verification link would contain token: ${token}`)
      
      // Here you would typically call your email service to send the verification email
      // For example:
      /*
      await sendEmail({
        to: verificationData.email,
        subject: `Verify ownership of ${domainName}`,
        body: `Click the following link to verify your domain: https://yourdomain.com/verify?token=${token}`
      })
      */
    }
    
    return new Response(
      JSON.stringify({ success: true, message: 'Verification email resent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
