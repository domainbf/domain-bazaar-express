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
    const { action, transaction_id, to_stage, idempotency_key } = body;
    if (!action || !transaction_id) throw new Error('参数缺失');

    // Idempotency: if the same key was already recorded, return its result instead of re-running.
    if (idempotency_key) {
      const { data: existing } = await supabase
        .from('order_operations_log')
        .select('id, operation, status, error, to_stage, created_at')
        .eq('idempotency_key', idempotency_key)
        .maybeSingle();
      if (existing) {
        return new Response(
          JSON.stringify({
            ok: existing.status === 'success',
            deduped: true,
            previous: existing,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

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
        idempotency_key: idempotency_key || null,
      });
    };

    if (action === 'resend_receipt' || action === 'retry_receipt') {
      // Guard: if a successful receipt was sent in the last 30s, dedupe.
      const cutoff = new Date(Date.now() - 30_000).toISOString();
      const { data: recent } = await supabase
        .from('receipt_delivery_log')
        .select('id, created_at, status')
        .eq('transaction_id', txn.id)
        .eq('status', 'success')
        .gte('created_at', cutoff)
        .limit(1);
      if (recent && recent.length > 0) {
        await logOp(action, null, null, 'success', undefined, { deduped: true });
        return new Response(JSON.stringify({ ok: true, deduped: true, reason: '30 秒内已成功发送，跳过' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

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
      const fromIdx = VALID_STAGES.indexOf(fromStage as any);
      const toIdx = VALID_STAGES.indexOf(to_stage);
      // Prevent stage rollback and no-op re-clicks.
      if (toIdx <= fromIdx) {
        await logOp('advance_stage', fromStage, to_stage, 'failed', '阶段无法回退或重复');
        throw new Error(`当前阶段为「${fromStage}」，无法回退或重复推进到「${to_stage}」`);
      }
      const history = { ...(txn.stage_history || {}), [to_stage]: new Date().toISOString() };
      const { error: upErr } = await supabase
        .from('transactions')
        .update({
          progress_stage: to_stage,
          stage_history: history,
          status: to_stage === 'transferred' ? 'completed' : txn.status,
        })
        .eq('id', txn.id)
        .eq('progress_stage', fromStage); // optimistic concurrency guard
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
