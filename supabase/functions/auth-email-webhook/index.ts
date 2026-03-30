const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SiteInfo {
  siteName: string;
  siteDomain: string;
  supportEmail: string;
}

// ─── Read site info from DB ───────────────────────────────────────────────────

async function getSiteInfo(supabaseUrl: string, serviceKey: string): Promise<SiteInfo> {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/site_settings?key=in.(site_name,site_domain,contact_email)&select=key,value`,
      { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } },
    );
    const data: Array<{ key: string; value: string }> = await res.json();
    const map = Object.fromEntries(data.map(r => [r.key, r.value]));
    return {
      siteName: map['site_name'] || '域见•你',
      siteDomain: (map['site_domain'] || '').replace(/\/$/, ''),
      supportEmail: map['contact_email'] || '',
    };
  } catch {
    return { siteName: '域见•你', siteDomain: '', supportEmail: '' };
  }
}

// ─── Shared Base ──────────────────────────────────────────────────────────────

function emailBase(content: string, previewText: string, site: SiteInfo): string {
  const domain = site.siteDomain || '';
  const hostname = domain.replace(/^https?:\/\//, '') || site.siteName;
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
        <!-- Logo pill -->
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

// ─── 密码重置 ──────────────────────────────────────────────────────────────────

function getPasswordResetHtml(token: string, baseUrl: string, site: SiteInfo): string {
  const resetUrl = `${baseUrl}/reset-password#access_token=${token}&type=recovery`;
  const supportEmail = site.supportEmail || `support@${(site.siteDomain || baseUrl).replace(/^https?:\/\//, '')}`;
  return emailBase(`
    <div style="height:4px;background:linear-gradient(90deg,#0f172a 0%,#334155 50%,#64748b 100%);"></div>

    <!-- Hero -->
    <div style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #f1f5f9;">
      <div style="width:64px;height:64px;background:#fef2f2;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:32px;">🔐</div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">重置您的密码</h1>
      <p style="margin:0;font-size:15px;color:#64748b;">Reset Your Password</p>
    </div>

    <!-- Content -->
    <div style="padding:32px 40px 0;">
      <p style="font-size:15px;color:#334155;line-height:1.8;margin:0 0 28px;">您好！<br>我们收到了重置您 <strong style="color:#0f172a;">${site.siteName}</strong> 账户密码的请求。点击下方按钮设置新密码：</p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:0 0 28px;">
        <a href="${resetUrl}" style="display:inline-block;background:#0f172a;color:#f8fafc;padding:16px 48px;border-radius:10px;font-size:16px;font-weight:700;text-decoration:none;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(15,23,42,0.25);">立即重置密码</a>
      </div>

      <!-- Fallback URL -->
      <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">按钮无法点击？复制此链接到浏览器：</p>
        <p style="margin:0;font-size:12px;color:#475569;word-break:break-all;font-family:'SF Mono',Consolas,monospace;line-height:1.6;background:#f1f5f9;border-radius:6px;padding:10px;">${resetUrl}</p>
      </div>

      <!-- Warning -->
      <div style="background:#fefce8;border:1px solid #fef08a;border-radius:10px;padding:20px;">
        <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#854d0e;">⚠ 安全提醒</p>
        <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
          <tr><td style="padding:3px 0;font-size:13px;color:#713f12;"><span style="font-weight:700;margin-right:6px;">·</span>此链接 <strong>30 分钟内</strong>有效，且只能使用一次</td></tr>
          <tr><td style="padding:3px 0;font-size:13px;color:#713f12;"><span style="font-weight:700;margin-right:6px;">·</span>如果您没有请求重置密码，请直接忽略此邮件</td></tr>
          <tr><td style="padding:3px 0;font-size:13px;color:#713f12;"><span style="font-weight:700;margin-right:6px;">·</span>切勿将此链接分享给任何人</td></tr>
        </table>
      </div>
    </div>

    <!-- Support footer -->
    <div style="padding:24px 40px;margin-top:32px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
      <p style="margin:0;font-size:13px;color:#94a3b8;">遇到问题？联系 <a href="mailto:${supportEmail}" style="color:#475569;text-decoration:none;font-weight:600;">${supportEmail}</a></p>
    </div>
  `, `重置您的${site.siteName}账户密码`, site);
}

// ─── 邮箱验证 ──────────────────────────────────────────────────────────────────

function getEmailVerificationHtml(confirmUrl: string, site: SiteInfo): string {
  const domain = site.siteDomain || '';
  const hostname = (domain.replace(/^https?:\/\//, '') || site.siteName).toUpperCase();
  const supportEmail = site.supportEmail || `support@${hostname.toLowerCase()}`;
  return emailBase(`
    <div style="height:4px;background:linear-gradient(90deg,#0f172a 0%,#334155 50%,#64748b 100%);"></div>

    <!-- Hero -->
    <div style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #f1f5f9;">
      <div style="width:64px;height:64px;background:#f0fdf4;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:32px;">🎉</div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">欢迎加入${site.siteName}</h1>
      <p style="margin:0;font-size:15px;color:#64748b;">Welcome to ${hostname} Domain Marketplace</p>
    </div>

    <!-- Content -->
    <div style="padding:32px 40px 0;">
      <p style="font-size:15px;color:#334155;line-height:1.8;margin:0 0 28px;">感谢您注册 <strong style="color:#0f172a;">${site.siteName}</strong> 域名交易平台！最后一步，请验证您的邮箱地址以激活账户：</p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:0 0 28px;">
        <a href="${confirmUrl}" style="display:inline-block;background:#0f172a;color:#f8fafc;padding:16px 48px;border-radius:10px;font-size:16px;font-weight:700;text-decoration:none;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(15,23,42,0.25);">验证邮箱地址</a>
      </div>

      <!-- Features after verify -->
      <div style="background:#f8fafc;border-radius:10px;padding:20px;border:1px solid #e2e8f0;">
        <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#0f172a;letter-spacing:0.3px;">验证后即可使用全部功能：</p>
        <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
          <tr><td style="padding:5px 0;">
            <table cellpadding="0" cellspacing="0" role="presentation"><tr>
              <td style="width:28px;height:28px;background:#0f172a;border-radius:8px;text-align:center;vertical-align:middle;"><span style="color:#f8fafc;font-size:13px;font-weight:700;">✓</span></td>
              <td style="padding-left:12px;font-size:13px;color:#475569;">上架出售您的域名资产，触达海量买家</td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:5px 0;">
            <table cellpadding="0" cellspacing="0" role="presentation"><tr>
              <td style="width:28px;height:28px;background:#0f172a;border-radius:8px;text-align:center;vertical-align:middle;"><span style="color:#f8fafc;font-size:13px;font-weight:700;">✓</span></td>
              <td style="padding-left:12px;font-size:13px;color:#475569;">参与优质域名竞拍，资金安全托管保障</td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:5px 0;">
            <table cellpadding="0" cellspacing="0" role="presentation"><tr>
              <td style="width:28px;height:28px;background:#0f172a;border-radius:8px;text-align:center;vertical-align:middle;"><span style="color:#f8fafc;font-size:13px;font-weight:700;">✓</span></td>
              <td style="padding-left:12px;font-size:13px;color:#475569;">与买家/卖家实时沟通，专业洽谈协商</td>
            </tr></table>
          </td></tr>
        </table>
      </div>

      <p style="margin:20px 0 0;font-size:13px;color:#94a3b8;text-align:center;">此验证链接 <strong style="color:#64748b;">24 小时内</strong>有效</p>
    </div>

    <!-- Support footer -->
    <div style="padding:24px 40px;margin-top:32px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
      <p style="margin:0;font-size:13px;color:#94a3b8;">遇到问题？联系 <a href="mailto:${supportEmail}" style="color:#475569;text-decoration:none;font-weight:600;">${supportEmail}</a></p>
    </div>
  `, `验证您的${site.siteName}账户邮箱`, site);
}

// ─── 魔法链接登录 ─────────────────────────────────────────────────────────────

function getMagicLinkHtml(confirmUrl: string, site: SiteInfo): string {
  const domain = site.siteDomain || '';
  const hostname = (domain.replace(/^https?:\/\//, '') || site.siteName).toUpperCase();
  const supportEmail = site.supportEmail || `support@${hostname.toLowerCase()}`;
  return emailBase(`
    <div style="height:4px;background:linear-gradient(90deg,#0f172a 0%,#334155 50%,#64748b 100%);"></div>

    <!-- Hero -->
    <div style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #f1f5f9;">
      <div style="width:64px;height:64px;background:#eff6ff;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:32px;">🔗</div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">您的一键登录链接</h1>
      <p style="margin:0;font-size:15px;color:#64748b;">Magic Login Link · ${hostname}</p>
    </div>

    <!-- Content -->
    <div style="padding:32px 40px 0;">
      <p style="font-size:15px;color:#334155;line-height:1.8;margin:0 0 28px;">点击下方按钮，免密码一键登录您的 <strong style="color:#0f172a;">${site.siteName}</strong> 账户：</p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:0 0 28px;">
        <a href="${confirmUrl}" style="display:inline-block;background:#0f172a;color:#f8fafc;padding:16px 48px;border-radius:10px;font-size:16px;font-weight:700;text-decoration:none;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(15,23,42,0.25);">立即登录账户</a>
      </div>

      <!-- Expiry notice -->
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px 20px;text-align:center;">
        <p style="margin:0;font-size:14px;color:#b91c1c;font-weight:600;">此链接 <strong>15 分钟内</strong>有效，且只能使用一次</p>
        <p style="margin:8px 0 0;font-size:13px;color:#dc2626;">如未请求此链接，请直接忽略此邮件，账户不受影响</p>
      </div>
    </div>

    <!-- Support footer -->
    <div style="padding:24px 40px;margin-top:32px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
      <p style="margin:0;font-size:13px;color:#94a3b8;">遇到问题？联系 <a href="mailto:${supportEmail}" style="color:#475569;text-decoration:none;font-weight:600;">${supportEmail}</a></p>
    </div>
  `, `您的${site.siteName}免密登录链接`, site);
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const [data, site] = await Promise.all([
      req.json(),
      getSiteInfo(supabaseUrl, serviceRoleKey),
    ]);

    const { user, email_data } = data;
    const { token, token_hash, redirect_to, email_action_type, site_url } = email_data;

    let baseUrl = site.siteDomain || '';
    if (redirect_to) {
      try { baseUrl = new URL(redirect_to).origin; } catch { /* keep siteDomain */ }
    } else if (site_url) {
      baseUrl = site_url.replace(/\/$/, '');
    }

    const userEmail = user?.email;
    if (!userEmail) throw new Error('No user email in payload');

    let subject = '';
    let html = '';

    switch (email_action_type) {
      case 'recovery':
        subject = `重置您的${site.siteName}账户密码`;
        html = getPasswordResetHtml(token, baseUrl, site);
        break;

      case 'signup':
      case 'email_change': {
        subject = `请验证您的${site.siteName}账户邮箱`;
        const confirmUrl = `${baseUrl}/auth/confirm?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || baseUrl)}`;
        html = getEmailVerificationHtml(confirmUrl, site);
        break;
      }

      case 'magiclink': {
        subject = `您的${site.siteName}一键登录链接`;
        const magicUrl = `${baseUrl}/auth/confirm?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || baseUrl)}`;
        html = getMagicLinkHtml(magicUrl, site);
        break;
      }

      default:
        subject = `${site.siteName}平台通知`;
        html = emailBase(`
          <div style="height:4px;background:linear-gradient(90deg,#0f172a,#334155);"></div>
          <div style="padding:40px;">
            <h2 style="color:#0f172a;margin:0 0 12px;">${site.siteName} 平台通知</h2>
            <p style="color:#475569;margin:0;">您收到了一封来自 ${site.siteName} 平台的通知邮件。</p>
          </div>
        `, `${site.siteName}平台通知`, site);
    }

    // Delegate actual sending to send-email function (SMTP configured there)
    const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ to: userEmail, subject, html }),
    });

    const result = await res.json();
    if (!res.ok || result.success === false) {
      throw new Error(result.error || `send-email returned ${res.status}`);
    }

    console.log(`[auth-email-webhook] Sent ${email_action_type} email to ${userEmail}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  } catch (err: any) {
    console.error('[auth-email-webhook] Error:', err?.message || err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }
});
