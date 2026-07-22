// Triggered by DB webhook (pg_net) on domain_offers / seller_kyc status changes.
// Creates in-app notification and sends email to the affected user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OFFER_STATUS_LABEL: Record<string, string> = {
  pending: "待处理",
  sent: "已送达卖家",
  viewed: "卖家已查看",
  countered: "卖家已还价",
  accepted: "已被接受 🎉",
  rejected: "已被拒绝",
  expired: "已过期",
  withdrawn: "已撤回",
  completed: "已完成",
};

const KYC_STATUS_LABEL: Record<string, string> = {
  pending: "待审核",
  approved: "已通过 ✅",
  rejected: "已拒绝",
  incomplete: "需补充资料",
};

serve();

function serve() {
  Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      const payload = await req.json();
      const { type, record, old_record } = payload as {
        type: "offer" | "kyc";
        record: any;
        old_record: any;
      };

      if (!record || !old_record) {
        return json({ skipped: true, reason: "missing records" });
      }
      if (record.status === old_record.status) {
        return json({ skipped: true, reason: "status unchanged" });
      }

      if (type === "offer") {
        await handleOffer(supabase, record, old_record);
      } else if (type === "kyc") {
        await handleKyc(supabase, record, old_record);
      }

      return json({ success: true });
    } catch (e: any) {
      console.error("notify-status-change error:", e);
      return json({ success: false, error: e.message }, 500);
    }
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleOffer(supabase: any, record: any, old_record: any) {
  const buyerId = record.buyer_id;
  if (!buyerId) return;

  const { data: domain } = await supabase
    .from("domains")
    .select("name")
    .eq("id", record.domain_id)
    .maybeSingle();

  const domainName = domain?.name || "您报价的域名";
  const statusLabel = OFFER_STATUS_LABEL[record.status] || record.status;
  const title = `报价状态更新：${statusLabel}`;
  const message = `域名 ${domainName} 的报价（¥${record.amount}）状态已更新为「${statusLabel}」。`;
  const actionUrl = "/my-offers";

  await supabase.from("notifications").insert({
    user_id: buyerId,
    title,
    message,
    type: "offer",
    related_id: record.id,
    action_url: actionUrl,
  });

  const email = record.contact_email || (await getUserEmail(supabase, buyerId));
  if (email) {
    await sendEmail(supabase, email, title, buildOfferEmail(domainName, record, statusLabel));
  }
}

async function handleKyc(supabase: any, record: any, old_record: any) {
  const userId = record.user_id;
  const statusLabel = KYC_STATUS_LABEL[record.status] || record.status;
  const title = `实名认证审核：${statusLabel}`;
  const noteText = record.review_note ? `\n审核备注：${record.review_note}` : "";
  const message = `您的实名认证与提现账户审核状态已更新为「${statusLabel}」。${noteText}`;

  await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type: "kyc",
    related_id: record.id,
    action_url: "/seller/earnings",
  });

  const email = await getUserEmail(supabase, userId);
  if (email) {
    await sendEmail(supabase, email, title, buildKycEmail(record, statusLabel));
  }
}

async function getUserEmail(supabase: any, userId: string): Promise<string | null> {
  try {
    const { data } = await supabase.auth.admin.getUserById(userId);
    return data?.user?.email || null;
  } catch {
    return null;
  }
}

async function sendEmail(supabase: any, to: string, subject: string, html: string) {
  try {
    await supabase.functions.invoke("send-email", { body: { to, subject, html } });
  } catch (e) {
    console.error("send-email invoke failed:", e);
  }
}

function buildOfferEmail(domain: string, record: any, statusLabel: string) {
  const currency = record.currency || "CNY";
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "¥";
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111">
    <h2 style="margin:0 0 16px;font-size:22px">您的报价状态已更新</h2>
    <p style="color:#555;line-height:1.6">您对域名 <b>${domain}</b> 的报价状态发生了变化：</p>
    <div style="background:#f5f5f7;border-radius:12px;padding:20px;margin:20px 0">
      <div style="font-size:14px;color:#666">当前状态</div>
      <div style="font-size:20px;font-weight:600;margin-top:6px">${statusLabel}</div>
      <div style="margin-top:12px;color:#333">报价金额：<b>${symbol}${Number(record.amount).toLocaleString()}</b></div>
    </div>
    <a href="${originFromEnv()}/my-offers" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:500">查看我的报价</a>
    <p style="color:#999;font-size:12px;margin-top:32px">此邮件为系统自动发送，请勿直接回复。</p>
  </div>`;
}

function buildKycEmail(record: any, statusLabel: string) {
  const noteHtml = record.review_note
    ? `<div style="margin-top:12px;color:#333">审核备注：<b>${escapeHtml(record.review_note)}</b></div>`
    : "";
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111">
    <h2 style="margin:0 0 16px;font-size:22px">实名认证审核结果</h2>
    <p style="color:#555;line-height:1.6">您提交的实名认证与提现账户审核已有结果：</p>
    <div style="background:#f5f5f7;border-radius:12px;padding:20px;margin:20px 0">
      <div style="font-size:14px;color:#666">审核状态</div>
      <div style="font-size:20px;font-weight:600;margin-top:6px">${statusLabel}</div>
      ${noteHtml}
    </div>
    <a href="${originFromEnv()}/seller/earnings" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:500">前往收入结算</a>
    <p style="color:#999;font-size:12px;margin-top:32px">此邮件为系统自动发送，请勿直接回复。</p>
  </div>`;
}

function originFromEnv() {
  return Deno.env.get("PUBLIC_SITE_URL") || "https://domainbf.com";
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
