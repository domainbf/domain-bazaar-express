import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_STAGES = ['submitted', 'paid', 'activated', 'transferred'] as const;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Verify caller is admin
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace('Bearer ', '');
    if (!jwt) throw new Error('未登录');
    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !userData?.user) throw new Error('鉴权失败');
    const operator = userData.user;

    const { data: isAdminData } = await supabase.rpc('is_admin', { user_id: operator.id });
    if (!isAdminData) throw new Error('无管理员权限');

    const body = await req.json();
    const { action, transaction_id, to_stage } = body;
    if (!action || !transaction_id) throw new Error('参数缺失');

    const { data: txn, error: txnErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transaction_id)
      .single();
    if (txnErr || !txn) throw new Error('订单不存在');

    const logOp = async (op: string, from: string | null, to: string | null, status: string, error?: string, meta: any = {}) => {
      await supabase.from('order_operations_log').insert({
        transaction_id: txn.id,
        operator_id: operator.id,
        operator_email: operator.email,
        operation: op,
        from_stage: from,
        to_stage: to,
        status,
        error,
        metadata: meta,
      });
    };

    if (action === 'resend_receipt' || action === 'retry_receipt') {
      const resp = await fetch(`${supabaseUrl}/functions/v1/send-order-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          transaction_id: txn.id,
          force: true,
          triggered_by: `admin:${operator.email}`,
        }),
      });
      const result = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        await logOp(action, null, null, 'failed', result?.error || `HTTP ${resp.status}`);
        throw new Error(result?.error || '收据发送失败');
      }
      await logOp(action, null, null, 'success', undefined, { attempts: result.attempts });
      return new Response(JSON.stringify({ ok: true, ...result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'advance_stage') {
      if (!VALID_STAGES.includes(to_stage)) throw new Error('无效阶段');
      const fromStage = txn.progress_stage || 'submitted';
      const history = { ...(txn.stage_history || {}), [to_stage]: new Date().toISOString() };
      const { error: upErr } = await supabase
        .from('transactions')
        .update({
          progress_stage: to_stage,
          stage_history: history,
          status: to_stage === 'transferred' ? 'completed' : txn.status,
        })
        .eq('id', txn.id);
      if (upErr) {
        await logOp('advance_stage', fromStage, to_stage, 'failed', upErr.message);
        throw new Error(upErr.message);
      }
      await logOp('advance_stage', fromStage, to_stage, 'success');
      return new Response(JSON.stringify({ ok: true, stage: to_stage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('未知操作');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('admin-order-operations error', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
