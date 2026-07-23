// Dispute actions: seller responds, admin resolves.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const userClient = createClient(supabaseUrl, anon, { global: { headers: { Authorization: authHeader } } })
    const token = authHeader.replace('Bearer ', '')
    const { data: claims } = await userClient.auth.getClaims(token)
    const uid = claims?.claims?.sub
    if (!uid) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const admin = createClient(supabaseUrl, service)
    const body = await req.json()
    const { action, dispute_id } = body

    const { data: dispute } = await admin.from('disputes').select('*').eq('id', dispute_id).maybeSingle()
    if (!dispute) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { data: adminCheck } = await admin.rpc('is_admin', { user_id: uid })
    const isAdmin = !!adminCheck

    if (action === 'seller_respond') {
      if (dispute.respondent_id !== uid) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const { response, evidence_urls = [] } = body
      await admin.from('disputes').update({
        seller_response: response,
        seller_response_at: new Date().toISOString(),
        seller_evidence_urls: evidence_urls,
        status: 'in_review',
        updated_at: new Date().toISOString(),
      }).eq('id', dispute_id)

      if (dispute.initiator_id) {
        await admin.from('notifications').insert({
          user_id: dispute.initiator_id, title: '📩 对方已回应争议',
          message: '被投诉方已提交回应，平台将介入审核。',
          type: 'dispute', related_id: dispute_id, action_url: `/user-center?tab=disputes`,
        })
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'admin_resolve') {
      if (!isAdmin) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const { resolution, verdict, admin_notes } = body // verdict: 'buyer' | 'seller'
      const status = verdict === 'buyer' ? 'resolved_buyer' : 'resolved_seller'
      await admin.from('disputes').update({
        status, resolution: resolution || null, admin_notes: admin_notes || null,
        resolved_by: uid, resolved_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq('id', dispute_id)

      const both = [dispute.initiator_id, dispute.respondent_id].filter(Boolean)
      for (const uidn of both) {
        await admin.from('notifications').insert({
          user_id: uidn, title: '⚖️ 争议已裁决',
          message: `平台裁决支持${verdict === 'buyer' ? '申诉方' : '被申诉方'}。${resolution ? '结论：' + resolution : ''}`,
          type: 'dispute', related_id: dispute_id, action_url: `/user-center?tab=disputes`,
        })
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'invalid_action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'internal_error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
