import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const body = await req.json()
    const { gateway, transaction_id, gateway_transaction_id, status, raw_data } = body

    console.log(`Payment callback received: gateway=${gateway}, txn=${transaction_id}, status=${status}`)

    // Find the transaction
    let query = supabase.from('payment_transactions').select('*')
    if (transaction_id) {
      query = query.eq('id', transaction_id)
    } else if (gateway_transaction_id) {
      query = query.eq('gateway_transaction_id', gateway_transaction_id)
    } else {
      throw new Error('Missing transaction_id or gateway_transaction_id')
    }

    const { data: txn, error: txnError } = await query.single()
    if (txnError || !txn) {
      console.error('Transaction not found:', txnError)
      return new Response(JSON.stringify({ error: 'Transaction not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Determine new status
    let newStatus = 'pending'
    if (status === 'success' || status === 'completed' || status === 'COMPLETED' || status === 'captured') {
      newStatus = 'completed'
    } else if (status === 'failed' || status === 'FAILED' || status === 'error') {
      newStatus = 'failed'
    } else if (status === 'refunded' || status === 'REFUNDED') {
      newStatus = 'refunded'
    } else {
      newStatus = 'processing'
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: newStatus,
        gateway_response: raw_data || body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', txn.id)

    if (updateError) {
      console.error('Failed to update transaction:', updateError)
      throw updateError
    }

    console.log(`Transaction ${txn.id} updated to status: ${newStatus}`)

    // If payment completed, trigger domain transfer
    if (newStatus === 'completed' && txn.domain_id && txn.user_id) {
      console.log(`Initiating domain transfer for domain ${txn.domain_id} to user ${txn.user_id}`)

      // Update domain_listings status to sold and transfer ownership
      const { error: domainError } = await supabase
        .from('domain_listings')
        .update({
          status: 'sold',
          owner_id: txn.user_id,
        })
        .eq('id', txn.domain_id)

      if (domainError) {
        console.error('Domain transfer failed on domain_listings:', domainError)
      } else {
        console.log(`domain_listings ${txn.domain_id} transferred to ${txn.user_id}`)
      }

      // Also update the domains table if exists
      const { error: domainsError } = await supabase
        .from('domains')
        .update({
          status: 'sold',
          owner_id: txn.user_id,
        })
        .eq('id', txn.domain_id)

      if (domainsError) {
        console.log('domains table update skipped or failed:', domainsError.message)
      }

      // Create a transaction record in the transactions table
      const metadata = (txn.metadata as Record<string, any>) || {}
      await supabase.from('transactions').insert({
        domain_id: txn.domain_id,
        buyer_id: txn.user_id,
        amount: txn.amount,
        payment_method: txn.gateway,
        payment_id: txn.gateway_transaction_id,
        status: 'completed',
      })

      // Notify buyer
      await supabase.from('notifications').insert({
        user_id: txn.user_id,
        title: '🎉 支付成功',
        message: `域名 ${metadata.domain_name || ''} 购买成功，已转入您的账户`,
        type: 'payment',
        action_url: '/user-center?tab=domains',
      })

      console.log('Domain transfer and notifications completed')
    }

    return new Response(JSON.stringify({
      success: true,
      transaction_id: txn.id,
      new_status: newStatus,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Payment callback error:', error)
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Callback processing failed',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
