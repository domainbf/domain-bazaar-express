// Payment callback with per-gateway signature verification.
// Never mutates order state unless signature (or internal secret) verified.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret, paypal-transmission-id, paypal-transmission-time, paypal-transmission-sig, paypal-cert-url, paypal-auth-algo',
}

async function verifyPaypal(headers: Headers, rawBody: string): Promise<boolean> {
  const webhookId = Deno.env.get('PAYPAL_WEBHOOK_ID')
  if (!webhookId) return false // not configured → refuse
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID')
  const secret = Deno.env.get('PAYPAL_SECRET_KEY')
  if (!clientId || !secret) return false
  // OAuth
  const tokenRes = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${clientId}:${secret}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!tokenRes.ok) return false
  const { access_token } = await tokenRes.json()
  const verifyRes = await fetch('https://api-m.paypal.com/v1/notifications/verify-webhook-signature', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: headers.get('paypal-auth-algo'),
      cert_url: headers.get('paypal-cert-url'),
      transmission_id: headers.get('paypal-transmission-id'),
      transmission_sig: headers.get('paypal-transmission-sig'),
      transmission_time: headers.get('paypal-transmission-time'),
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
  })
  if (!verifyRes.ok) return false
  const v = await verifyRes.json()
  return v.verification_status === 'SUCCESS'
}

async function isAuthorized(req: Request, gateway: string, rawBody: string): Promise<{ ok: boolean; reason?: string }> {
  // Internal / test: shared secret header
  const internal = Deno.env.get('INTERNAL_CALLBACK_SECRET')
  if (internal && req.headers.get('x-internal-secret') === internal) return { ok: true }

  if (gateway === 'paypal') {
    const ok = await verifyPaypal(req.headers, rawBody)
    return ok ? { ok: true } : { ok: false, reason: 'paypal_signature_invalid' }
  }
  // Alipay / WeChat: require internal secret until real signing keys configured
  return { ok: false, reason: 'unauthorized' }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const rawBody = await req.text()
    let body: any
    try { body = JSON.parse(rawBody) } catch { body = {} }
    const { gateway, transaction_id, gateway_transaction_id, status, raw_data } = body

    const auth = await isAuthorized(req, String(gateway || ''), rawBody)
    if (!auth.ok) {
      console.warn('Payment callback rejected:', auth.reason, 'gateway=', gateway)
      // Best-effort audit
      try {
        await supabase.from('order_operations_log').insert({
          transaction_id: null,
          operation: 'payment_callback_rejected',
          operator_id: null,
          details: { gateway, reason: auth.reason, txn: transaction_id ?? gateway_transaction_id ?? null },
        })
      } catch {}
      return new Response(JSON.stringify({ error: 'unauthorized', reason: auth.reason }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Payment callback verified: gateway=${gateway}, txn=${transaction_id}, status=${status}`)

    let query = supabase.from('payment_transactions').select('*')
    if (transaction_id) query = query.eq('id', transaction_id)
    else if (gateway_transaction_id) query = query.eq('gateway_transaction_id', gateway_transaction_id)
    else throw new Error('Missing transaction_id or gateway_transaction_id')

    const { data: txn, error: txnError } = await query.single()
    if (txnError || !txn) {
      return new Response(JSON.stringify({ error: 'Transaction not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let newStatus = 'pending'
    const s = String(status || '').toLowerCase()
    if (['success', 'completed', 'captured'].includes(s)) newStatus = 'completed'
    else if (['failed', 'error'].includes(s)) newStatus = 'failed'
    else if (s === 'refunded') newStatus = 'refunded'
    else newStatus = 'processing'

    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({ status: newStatus, gateway_response: raw_data || body, updated_at: new Date().toISOString() })
      .eq('id', txn.id)
    if (updateError) throw updateError

    if (newStatus === 'completed' && txn.domain_id && txn.user_id) {
      await supabase.from('domain_listings').update({ status: 'sold', owner_id: txn.user_id }).eq('id', txn.domain_id)
      await supabase.from('domains').update({ status: 'sold', owner_id: txn.user_id }).eq('id', txn.domain_id)

      const metadata = (txn.metadata as Record<string, any>) || {}
      const now = new Date().toISOString()
      const orderNumber = `ORD-${now.slice(0, 10).replace(/-/g, '')}-${txn.id.replace(/-/g, '').slice(0, 8)}`

      const { data: existing } = await supabase
        .from('transactions').select('id')
        .eq('payment_id', txn.gateway_transaction_id || txn.id).maybeSingle()

      let orderId: string
      if (existing?.id) {
        orderId = existing.id
        await supabase.from('transactions').update({
          status: 'completed', progress_stage: 'paid',
          stage_history: { submitted: txn.created_at, paid: now },
          currency: txn.currency || 'CNY', order_number: orderNumber,
        }).eq('id', orderId)
      } else {
        const { data: inserted } = await supabase.from('transactions').insert({
          domain_id: txn.domain_id, buyer_id: txn.user_id, amount: txn.amount,
          currency: txn.currency || 'CNY', payment_method: txn.gateway,
          payment_id: txn.gateway_transaction_id, status: 'completed',
          order_number: orderNumber, progress_stage: 'paid',
          stage_history: { submitted: txn.created_at, paid: now },
        }).select('id').single()
        orderId = inserted?.id
      }

      await supabase.from('notifications').insert({
        user_id: txn.user_id, title: '🎉 支付成功',
        message: `域名 ${metadata.domain_name || ''} 购买成功，订单 ${orderNumber}`,
        type: 'payment', action_url: `/order/${orderId}`,
      })

      if (orderId) {
        fetch(`${supabaseUrl}/functions/v1/send-order-receipt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceRoleKey}` },
          body: JSON.stringify({ transaction_id: orderId }),
        }).catch((e) => console.error('receipt trigger failed', e))
      }
    }

    return new Response(JSON.stringify({ success: true, transaction_id: txn.id, new_status: newStatus }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Payment callback error:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Callback processing failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
