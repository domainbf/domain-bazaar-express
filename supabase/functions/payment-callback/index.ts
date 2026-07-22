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

    // If payment completed, trigger domain transfer + progress + receipt
    if (newStatus === 'completed' && txn.domain_id && txn.user_id) {
      console.log(`Initiating domain transfer for domain ${txn.domain_id} to user ${txn.user_id}`)

      await supabase
        .from('domain_listings')
        .update({ status: 'sold', owner_id: txn.user_id })
        .eq('id', txn.domain_id)

      await supabase
        .from('domains')
        .update({ status: 'sold', owner_id: txn.user_id })
        .eq('id', txn.domain_id)

      const metadata = (txn.metadata as Record<string, any>) || {}
      const now = new Date().toISOString()
      const orderNumber = `ORD-${now.slice(0, 10).replace(/-/g, '')}-${txn.id.replace(/-/g, '').slice(0, 8)}`

      // Upsert transactions row (one per payment_transactions.id via payment_id link)
      const { data: existing } = await supabase
        .from('transactions')
        .select('id')
        .eq('payment_id', txn.gateway_transaction_id || txn.id)
        .maybeSingle()

      let orderId: string
      if (existing?.id) {
        orderId = existing.id
        await supabase
          .from('transactions')
          .update({
            status: 'completed',
            progress_stage: 'paid',
            stage_history: { submitted: txn.created_at, paid: now },
            currency: txn.currency || 'CNY',
            order_number: orderNumber,
          })
          .eq('id', orderId)
      } else {
        const { data: inserted } = await supabase
          .from('transactions')
          .insert({
            domain_id: txn.domain_id,
            buyer_id: txn.user_id,
            amount: txn.amount,
            currency: txn.currency || 'CNY',
            payment_method: txn.gateway,
            payment_id: txn.gateway_transaction_id,
            status: 'completed',
            order_number: orderNumber,
            progress_stage: 'paid',
            stage_history: { submitted: txn.created_at, paid: now },
          })
          .select('id')
          .single()
        orderId = inserted?.id
      }

      // Notify buyer
      await supabase.from('notifications').insert({
        user_id: txn.user_id,
        title: '🎉 支付成功',
        message: `域名 ${metadata.domain_name || ''} 购买成功，订单 ${orderNumber}`,
        type: 'payment',
        action_url: `/order/${orderId}`,
      })

      // Fire receipt email (non-blocking)
      if (orderId) {
        fetch(`${supabaseUrl}/functions/v1/send-order-receipt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ transaction_id: orderId }),
        }).catch((e) => console.error('receipt trigger failed', e))

        // Simulate activation + transfer stage progression
        setTimeout(async () => {
          await supabase
            .from('transactions')
            .update({
              progress_stage: 'activated',
              stage_history: {
                submitted: txn.created_at,
                paid: now,
                activated: new Date().toISOString(),
              },
            })
            .eq('id', orderId)
        }, 5000)
      }

      console.log('Order pipeline kicked off, order_id=', orderId)
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
