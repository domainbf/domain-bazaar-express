// Order handover actions (called from client with user JWT).
// - action=push_transfer  → seller marks transferred
// - action=confirm_receipt → buyer confirms + credits seller
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const user = createClient(supabaseUrl, anon, { global: { headers: { Authorization: authHeader } } })
    const token = authHeader.replace('Bearer ', '')
    const { data: claims } = await user.auth.getClaims(token)
    const uid = claims?.claims?.sub
    if (!uid) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { action, order_id } = await req.json()
    if (!order_id || !action) return new Response(JSON.stringify({ error: 'missing_params' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const admin = createClient(supabaseUrl, service)
    const { data: txn } = await admin.from('transactions').select('id, buyer_id, seller_id, progress_stage').eq('id', order_id).maybeSingle()
    if (!txn) return new Response(JSON.stringify({ error: 'order_not_found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    let rpc: string
    if (action === 'push_transfer') {
      if (txn.seller_id && txn.seller_id !== uid) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      rpc = 'mark_order_transferred'
    } else if (action === 'confirm_receipt') {
      if (txn.buyer_id !== uid) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      rpc = 'complete_order_and_credit_seller'
    } else {
      return new Response(JSON.stringify({ error: 'invalid_action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data, error } = await admin.rpc(rpc, { _txn_id: order_id, _actor: uid })
    if (error) throw error
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'internal_error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
