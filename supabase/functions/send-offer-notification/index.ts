import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OfferNotificationRequest {
  domain: string;
  offer: number;
  email: string;
  message: string;
  buyerId: string;
  dashboardUrl: string;
  domainOwnerEmail?: string | null;
}

interface SiteInfo {
  siteName: string;
  siteDomain: string;
  supportEmail: string;
}

// ─── Read site info from DB ───────────────────────────────────────────────────

async function getSiteInfo(supabaseUrl: string, serviceKey: string): Promise<SiteInfo> {
  try {
    const sb = createClient(supabaseUrl, serviceKey);
    const { data } = await sb
      .from('site_settings')
      .select('key, value')
      .in('key', ['site_name', 'site_domain', 'contact_email']);
    const map = Object.fromEntries((data || []).map((r: any) => [r.key, r.value]));
    return {
      siteName: map['site_name'] || '域见•你',
      siteDomain: (map['site_domain'] || '').replace(/\/$/, ''),
      supportEmail: map['contact_email'] || '',
    };
  } catch {
    return { siteName: '域见•你', siteDomain: '', supportEmail: '' };
  }
}

// ─── Shared email base ────────────────────────────────────────────────────────

function emailBase(content: string, previewText: string, site: SiteInfo): string {
  const domain = site.siteDomain || 'https://nic.bn';
  const hostname = domain.replace(/^https?:\/\//, '');
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${previewText}</title>
  <style>
    body { margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; }
    .preheader { display:none!important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; }
  </style>
</head>
<body>
  <span class="preheader">${previewText}</span>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">
        <!-- Logo -->
        <tr><td style="padding-bottom:24px;text-align:center;">
          <table cellpadding="0" cellspacing="0" role="presentation" style="display:inline-table;">
            <tr><td style="background:#0f172a;border-radius:12px;padding:10px 20px;">
              <span style="color:#f8fafc;font-size:20px;font-weight:800;letter-spacing:-0.5px;">${site.siteName}</span>
              <span style="color:#475569;font-size:11px;font-weight:600;margin-left:10px;letter-spacing:2px;text-transform:uppercase;">${hostname.toUpperCase()}</span>
            </td></tr>
          </table>
        </td></tr>
        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.07),0 2px 4px -2px rgba(0,0,0,0.05);">
          ${content}
        </td></tr>
        <!-- Footer note -->
        <tr><td style="padding:28px 20px 0;text-align:center;">
          <p style="margin:0;font-size:13px;color:#94a3b8;">此邮件由 <strong style="color:#64748b;">${site.siteName} 域名交易平台</strong> 自动发送</p>
          <p style="margin:6px 0 0;font-size:12px;color:#cbd5e1;">如果您没有在本平台进行任何操作，请忽略此邮件</p>
          <p style="margin:12px 0 0;font-size:12px;color:#94a3b8;">© ${year} ${site.siteName} · ${hostname.toUpperCase()} · All rights reserved</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── 买家确认邮件 ─────────────────────────────────────────────────────────────

function getBuyerConfirmationHtml(data: OfferNotificationRequest, site: SiteInfo): string {
  const offerFormatted = `$${data.offer.toLocaleString()}`;
  const dashboardUrl = data.dashboardUrl || `${site.siteDomain}/user-center?tab=transactions`;
  const supportEmail = site.supportEmail || `support@${site.siteDomain.replace(/^https?:\/\//, '')}`;

  return emailBase(`
    <div style="height:4px;background:linear-gradient(90deg,#0f172a 0%,#334155 50%,#64748b 100%);"></div>

    <!-- Hero -->
    <div style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #f1f5f9;">
      <div style="width:64px;height:64px;background:#f0fdf4;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:32px;">✅</div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">报价提交成功</h1>
      <p style="margin:0;font-size:15px;color:#64748b;">您的报价已成功发送给域名卖家，请耐心等待回复</p>
    </div>

    <!-- Domain + Amount highlight -->
    <div style="padding:32px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="background:#f8fafc;border-radius:12px;padding:24px;text-align:center;border:1px solid #e2e8f0;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;">报价域名</p>
            <p style="margin:0 0 20px;font-size:28px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">${data.domain.toUpperCase()}</p>
            <div style="display:inline-block;background:#0f172a;border-radius:10px;padding:12px 32px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#64748b;letter-spacing:1px;text-transform:uppercase;">您的报价</p>
              <p style="margin:0;font-size:32px;font-weight:800;color:#f8fafc;">${offerFormatted}</p>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Details table -->
    <div style="padding:24px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
        <tr>
          <td style="padding:12px 16px;background:#f8fafc;font-size:12px;font-weight:600;color:#64748b;letter-spacing:0.5px;width:35%;border-bottom:1px solid #f1f5f9;">联系邮箱</td>
          <td style="padding:12px 16px;font-size:14px;color:#0f172a;font-weight:500;border-bottom:1px solid #f1f5f9;">${data.email}</td>
        </tr>
        ${data.message ? `<tr>
          <td style="padding:12px 16px;background:#f8fafc;font-size:12px;font-weight:600;color:#64748b;letter-spacing:0.5px;width:35%;">您的留言</td>
          <td style="padding:12px 16px;font-size:14px;color:#475569;font-style:italic;">"${data.message}"</td>
        </tr>` : ''}
      </table>
    </div>

    <!-- Next steps -->
    <div style="padding:24px 40px 0;">
      <div style="background:#f8fafc;border-radius:10px;padding:20px;border-left:4px solid #0f172a;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0f172a;letter-spacing:0.3px;">接下来会发生什么？</p>
        <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
          <tr><td style="padding:4px 0;font-size:13px;color:#475569;"><span style="color:#0f172a;font-weight:700;margin-right:8px;">①</span>卖家将在 48 小时内审核您的报价</td></tr>
          <tr><td style="padding:4px 0;font-size:13px;color:#475569;"><span style="color:#0f172a;font-weight:700;margin-right:8px;">②</span>卖家可接受报价、拒绝或提出还价</td></tr>
          <tr><td style="padding:4px 0;font-size:13px;color:#475569;"><span style="color:#0f172a;font-weight:700;margin-right:8px;">③</span>卖家回复后，我们会立即发送邮件通知您</td></tr>
        </table>
      </div>
    </div>

    <!-- CTA -->
    <div style="padding:32px 40px;text-align:center;">
      <a href="${dashboardUrl}" style="display:inline-block;background:#0f172a;color:#f8fafc;padding:16px 40px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(15,23,42,0.25);">查看我的报价状态 →</a>
    </div>

    <!-- Support footer -->
    <div style="padding:20px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
      <p style="margin:0;font-size:13px;color:#94a3b8;">有疑问？联系 <a href="mailto:${supportEmail}" style="color:#475569;text-decoration:none;font-weight:600;">${supportEmail}</a></p>
    </div>
  `, `报价提交成功：${data.domain} — ${offerFormatted}`, site);
}

// ─── 域名卖家通知邮件 ─────────────────────────────────────────────────────────

function getOwnerNotificationHtml(data: OfferNotificationRequest, site: SiteInfo): string {
  const offerFormatted = `$${data.offer.toLocaleString()}`;
  const dashboardUrl = data.dashboardUrl || `${site.siteDomain}/user-center?tab=transactions`;
  const supportEmail = site.supportEmail || `support@${site.siteDomain.replace(/^https?:\/\//, '')}`;

  return emailBase(`
    <div style="height:4px;background:linear-gradient(90deg,#0f172a 0%,#334155 50%,#64748b 100%);"></div>

    <!-- Hero -->
    <div style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #f1f5f9;">
      <div style="width:64px;height:64px;background:#fefce8;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:32px;">💰</div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">您收到了新的域名报价</h1>
      <p style="margin:0;font-size:15px;color:#64748b;">有买家对您的域名感兴趣，请尽快查看并回复</p>
    </div>

    <!-- Domain + Amount highlight -->
    <div style="padding:32px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="background:#f8fafc;border-radius:12px;padding:24px;text-align:center;border:1px solid #e2e8f0;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;">您的域名</p>
            <p style="margin:0 0 20px;font-size:28px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">${data.domain.toUpperCase()}</p>
            <div style="display:inline-block;background:#0f172a;border-radius:10px;padding:12px 32px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#64748b;letter-spacing:1px;text-transform:uppercase;">买家报价</p>
              <p style="margin:0;font-size:32px;font-weight:800;color:#f8fafc;">${offerFormatted}</p>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Buyer info -->
    <div style="padding:24px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
        <tr>
          <td style="padding:12px 16px;background:#f8fafc;font-size:12px;font-weight:600;color:#64748b;letter-spacing:0.5px;width:35%;border-bottom:1px solid #f1f5f9;">买家邮箱</td>
          <td style="padding:12px 16px;font-size:14px;color:#0f172a;font-weight:500;border-bottom:1px solid #f1f5f9;">
            <a href="mailto:${data.email}" style="color:#0f172a;text-decoration:none;">${data.email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px;background:#f8fafc;font-size:12px;font-weight:600;color:#64748b;letter-spacing:0.5px;width:35%;${data.message ? 'border-bottom:1px solid #f1f5f9;' : ''}">报价金额</td>
          <td style="padding:12px 16px;font-size:18px;color:#0f172a;font-weight:800;${data.message ? 'border-bottom:1px solid #f1f5f9;' : ''}">${offerFormatted}</td>
        </tr>
        ${data.message ? `<tr>
          <td style="padding:12px 16px;background:#f8fafc;font-size:12px;font-weight:600;color:#64748b;letter-spacing:0.5px;width:35%;">买家留言</td>
          <td style="padding:12px 16px;font-size:14px;color:#475569;font-style:italic;">"${data.message}"</td>
        </tr>` : ''}
      </table>
    </div>

    <!-- Tips -->
    <div style="padding:24px 40px 0;">
      <div style="background:#fefce8;border-radius:10px;padding:20px;border:1px solid #fef08a;">
        <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#854d0e;">建议在 48 小时内回复，提高成交机会</p>
        <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
          <tr><td style="padding:3px 0;font-size:13px;color:#713f12;"><span style="font-weight:700;margin-right:6px;">·</span>您可以接受报价直接完成交易</td></tr>
          <tr><td style="padding:3px 0;font-size:13px;color:#713f12;"><span style="font-weight:700;margin-right:6px;">·</span>也可以提出还价，与买家继续协商</td></tr>
          <tr><td style="padding:3px 0;font-size:13px;color:#713f12;"><span style="font-weight:700;margin-right:6px;">·</span>如不接受可直接拒绝，不影响域名继续挂牌</td></tr>
        </table>
      </div>
    </div>

    <!-- CTA -->
    <div style="padding:32px 40px;text-align:center;">
      <a href="${dashboardUrl}" style="display:inline-block;background:#0f172a;color:#f8fafc;padding:16px 40px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(15,23,42,0.25);margin-bottom:12px;">查看并回复报价 →</a>
      <br>
      <a href="mailto:${data.email}" style="display:inline-block;color:#64748b;font-size:13px;text-decoration:none;margin-top:4px;">或直接发邮件给买家：${data.email}</a>
    </div>

    <!-- Support footer -->
    <div style="padding:20px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
      <p style="margin:0;font-size:13px;color:#94a3b8;">有疑问？联系 <a href="mailto:${supportEmail}" style="color:#475569;text-decoration:none;font-weight:600;">${supportEmail}</a></p>
    </div>
  `, `新报价通知：${data.domain} — 买家出价 ${offerFormatted}`, site);
}

// ─── Handler ──────────────────────────────────────────────────────────────────

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const [site, data] = await Promise.all([
      getSiteInfo(supabaseUrl, supabaseServiceKey),
      req.json() as Promise<OfferNotificationRequest>,
    ]);

    console.log('Processing offer notification for domain:', data.domain);

    // 发送买家确认邮件
    const buyerEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to: data.email,
        subject: `报价提交成功：${data.domain} — $${data.offer.toLocaleString()}`,
        html: getBuyerConfirmationHtml(data, site),
      }),
    });

    if (!buyerEmailResponse.ok) {
      console.error('Failed to send buyer confirmation email');
    }

    // 发送域名所有者通知邮件
    if (data.domainOwnerEmail) {
      const ownerEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          to: data.domainOwnerEmail,
          subject: `新报价通知：${data.domain} — 买家出价 $${data.offer.toLocaleString()}`,
          html: getOwnerNotificationHtml(data, site),
        }),
      });

      if (!ownerEmailResponse.ok) {
        console.error('Failed to send owner notification email');
      }
    }

    console.log('Offer notification emails sent successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Offer notification emails sent successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  } catch (error: any) {
    console.error('Error in send-offer-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send offer notification', success: false }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }
};

serve(handler);
