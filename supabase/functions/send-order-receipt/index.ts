import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendMailWithResend } from '../utils/sendMailWithResend.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const fmtMoney = (v: number, cur = 'CNY') => {
  const sym = cur === 'USD' ? '$' : cur === 'EUR' ? '€' : cur === 'GBP' ? '£' : '¥';
  return `${sym}${Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  let transaction_id = '';
  let force = false;
  let triggered_by = 'system';

  try {
    const body = await req.json();
    transaction_id = body.transaction_id;
    force = !!body.force;
    triggered_by = body.triggered_by || 'system';
    if (!transaction_id) throw new Error('transaction_id 必填');

    const { data: txn, error: txnErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transaction_id)
      .single();
    if (txnErr || !txn) throw new Error('订单不存在');
    if (txn.receipt_sent_at && !force) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Idempotency guard: if a successful send already happened in the last 30 seconds,
    // skip regardless of `force` so double-clicks on the client can never spam mailboxes.
    {
      const cutoff = new Date(Date.now() - 30_000).toISOString();
      const { data: recent } = await supabase
        .from('receipt_delivery_log')
        .select('id, created_at')
        .eq('transaction_id', transaction_id)
        .eq('status', 'success')
        .gte('created_at', cutoff)
        .limit(1);
      if (recent && recent.length > 0) {
        return new Response(JSON.stringify({ ok: true, deduped: true, reason: '30 秒内已成功发送' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }


    const { data: domain } = await supabase
      .from('domains')
      .select('id, name, expires_at, registrar')
      .eq('id', txn.domain_id)
      .maybeSingle();
    const domainName: string = domain?.name || '域名';

    const { data: buyerProfile } = await supabase
      .from('profiles')
      .select('email, username, full_name')
      .eq('id', txn.buyer_id)
      .maybeSingle();

    let buyerEmail = buyerProfile?.email || '';
    if (!buyerEmail && txn.buyer_id) {
      const { data: authUser } = await supabase.auth.admin.getUserById(txn.buyer_id);
      buyerEmail = authUser?.user?.email || '';
    }
    if (!buyerEmail) throw new Error('未找到买家邮箱');

    const { data: dns } = await supabase
      .from('dns_records')
      .select('type, name, value, ttl')
      .eq('domain_id', txn.domain_id)
      .limit(20);

    const { data: sale } = await supabase
      .from('domain_sale_settings')
      .select('*')
      .eq('domain_id', txn.domain_id)
      .maybeSingle();

    const summary = {
      dns: dns || [],
      email_forwarding: (sale as any)?.email_forwarding || null,
      url_redirect: (sale as any)?.url_redirect || null,
      expires_at: domain?.expires_at || null,
      transfer_eta: new Date(Date.now() + 3 * 86400_000).toISOString(),
    };

    const cur = txn.currency || 'CNY';
    const orderNo = txn.order_number || txn.id;

    const dnsRows =
      (summary.dns as any[]).length > 0
        ? (summary.dns as any[])
            .map(
              (r) =>
                `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;font-family:monospace">${r.type}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;font-family:monospace">${r.name || '@'}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;font-family:monospace;word-break:break-all">${r.value}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;color:#999">${r.ttl ?? 3600}</td></tr>`
            )
            .join('')
        : `<tr><td colspan="4" style="padding:12px;color:#999;text-align:center">暂未配置 DNS 记录，登录后台可添加</td></tr>`;

    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>订单收据 ${orderNo}</title></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111">
<div style="max-width:640px;margin:0 auto;background:#ffffff">
  <div style="padding:32px 28px 20px;border-bottom:1px solid #eee">
    <div style="font-size:12px;letter-spacing:.15em;color:#888;text-transform:uppercase">域见·你 · 电子收据</div>
    <h1 style="margin:8px 0 0;font-size:22px">支付成功，感谢您的购买</h1>
    <p style="margin:8px 0 0;color:#555;font-size:14px">您的域名 <b>${domainName}</b> 已在我们这里安全登记。以下是本次订单的完整明细。</p>
  </div>
  <div style="padding:24px 28px;border-bottom:1px solid #eee">
    <table style="width:100%;font-size:14px;border-collapse:collapse">
      <tr><td style="padding:4px 0;color:#888">订单号</td><td style="padding:4px 0;text-align:right;font-family:monospace">${orderNo}</td></tr>
      <tr><td style="padding:4px 0;color:#888">支付方式</td><td style="padding:4px 0;text-align:right">${txn.payment_method || '—'}</td></tr>
      <tr><td style="padding:4px 0;color:#888">支付流水</td><td style="padding:4px 0;text-align:right;font-family:monospace;font-size:12px">${txn.payment_id || '—'}</td></tr>
      <tr><td style="padding:4px 0;color:#888">下单时间</td><td style="padding:4px 0;text-align:right">${new Date(txn.created_at).toLocaleString('zh-CN')}</td></tr>
      <tr><td style="padding:10px 0 0;color:#000;font-weight:600">实付金额</td><td style="padding:10px 0 0;text-align:right;font-size:20px;font-weight:700">${fmtMoney(txn.amount, cur)}</td></tr>
    </table>
  </div>
  <div style="padding:24px 28px;border-bottom:1px solid #eee">
    <div style="font-size:12px;letter-spacing:.1em;color:#888;text-transform:uppercase;margin-bottom:10px">DNS 当前配置</div>
    <table style="width:100%;font-size:13px;border-collapse:collapse;border:1px solid #eee">
      <thead><tr style="background:#fafafa"><th style="padding:8px 10px;text-align:left;font-weight:600">类型</th><th style="padding:8px 10px;text-align:left;font-weight:600">主机记录</th><th style="padding:8px 10px;text-align:left;font-weight:600">值</th><th style="padding:8px 10px;text-align:left;font-weight:600">TTL</th></tr></thead>
      <tbody>${dnsRows}</tbody>
    </table>
  </div>
  <div style="padding:20px 28px;border-bottom:1px solid #eee;display:flex;gap:16px;flex-wrap:wrap">
    <div style="flex:1;min-width:220px">
      <div style="font-size:12px;letter-spacing:.1em;color:#888;text-transform:uppercase;margin-bottom:6px">邮箱转发</div>
      <div style="font-size:13px;color:#333">${summary.email_forwarding ? String(summary.email_forwarding) : '未配置'}</div>
    </div>
    <div style="flex:1;min-width:220px">
      <div style="font-size:12px;letter-spacing:.1em;color:#888;text-transform:uppercase;margin-bottom:6px">URL 重定向</div>
      <div style="font-size:13px;color:#333;word-break:break-all">${summary.url_redirect ? String(summary.url_redirect) : '未配置'}</div>
    </div>
    <div style="flex:1;min-width:220px">
      <div style="font-size:12px;letter-spacing:.1em;color:#888;text-transform:uppercase;margin-bottom:6px">过户 / 到期</div>
      <div style="font-size:13px;color:#333">过户预计 ${new Date(summary.transfer_eta).toLocaleDateString('zh-CN')}<br/>${summary.expires_at ? '到期日 ' + new Date(summary.expires_at).toLocaleDateString('zh-CN') : '到期日待激活后确定'}</div>
    </div>
  </div>
  <div style="padding:24px 28px">
    <a href="${(Deno.env.get('SITE_URL') || 'https://nic.rw')}/order/${txn.id}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:600">查看订单进度</a>
    <p style="margin:16px 0 0;font-size:12px;color:#999">如对本次订单有任何疑问，请回复此邮件或联系客服。请妥善保存本收据作为付款凭证。</p>
  </div>
</div>
</body></html>`;

    // Retry loop: up to 3 attempts with exponential backoff
    const MAX = 3;
    let lastErr: any = null;
    for (let attempt = 1; attempt <= MAX; attempt++) {
      const started = Date.now();
      try {
        await sendMailWithResend(
          buyerEmail,
          `【收据】${domainName} 订单 ${orderNo} 已完成支付`,
          html
        );
        const duration = Date.now() - started;
        await supabase.from('receipt_delivery_log').insert({
          transaction_id: txn.id,
          attempt,
          status: 'success',
          recipient: buyerEmail,
          duration_ms: duration,
          triggered_by,
        });
        await supabase
          .from('transactions')
          .update({ receipt_sent_at: new Date().toISOString(), receipt_summary: summary })
          .eq('id', txn.id);
        return new Response(JSON.stringify({ ok: true, attempts: attempt }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        lastErr = e;
        const duration = Date.now() - started;
        const msg = e instanceof Error ? e.message : String(e);
        await supabase.from('receipt_delivery_log').insert({
          transaction_id: txn.id,
          attempt,
          status: attempt < MAX ? 'retrying' : 'failed',
          error: msg,
          recipient: buyerEmail,
          duration_ms: duration,
          triggered_by,
        });
        if (attempt < MAX) await sleep(500 * attempt);
      }
    }
    // All attempts failed — push an in-app notification to the buyer so it
    // surfaces in the notification center with a retry entry point.
    if (txn.buyer_id) {
      await supabase.from('notifications').insert({
        user_id: txn.buyer_id,
        title: '收据发送失败',
        message: `订单 ${txn.order_number || txn.id} 的电子收据发送失败，请到订单详情页手动重试。原因：${lastErr instanceof Error ? lastErr.message : String(lastErr)}`,
        type: 'transaction',
        related_id: txn.id,
        action_url: `/order/${txn.id}`,
      }).catch(() => {});
    }
    throw lastErr || new Error('收据发送失败');

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('send-order-receipt error', msg);
    // Best-effort compensation log for failures without a txn attempt (early failures)
    if (transaction_id) {
      await supabase.from('receipt_delivery_log').insert({
        transaction_id,
        attempt: 0,
        status: 'failed',
        error: msg,
        triggered_by,
      }).catch(() => {});
    }
    return new Response(JSON.stringify({ error: msg, transaction_id }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
