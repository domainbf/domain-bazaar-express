const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── Email Templates ─────────────────────────────────────────────────────────

const emailBase = (content: string, previewText: string) => `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${previewText}</title>
  <style>body{margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;}.preheader{display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;}</style>
</head>
<body>
  <span class="preheader">${previewText}</span>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">
        <tr><td style="padding-bottom:24px;text-align:center;">
          <table cellpadding="0" cellspacing="0" role="presentation" style="display:inline-table;">
            <tr><td style="background:#0f172a;border-radius:12px;padding:10px 20px;">
              <span style="color:#f8fafc;font-size:20px;font-weight:800;">域见</span><span style="color:#94a3b8;font-size:20px;font-weight:800;">•</span><span style="color:#f8fafc;font-size:20px;font-weight:800;">你</span>
              <span style="color:#64748b;font-size:12px;font-weight:500;margin-left:8px;letter-spacing:1px;">NIC.RW</span>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.07);">
          ${content}
        </td></tr>
        <tr><td style="padding:28px 20px 0;text-align:center;">
          <p style="margin:0;font-size:13px;color:#94a3b8;">此邮件由 <strong style="color:#64748b;">域见•你 域名交易平台</strong> 发送</p>
          <p style="margin:6px 0 0;font-size:12px;color:#cbd5e1;">如果您没有操作本平台，请忽略此邮件</p>
          <p style="margin:12px 0 0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} 域见•你 · NIC.RW · All rights reserved</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

function getPasswordResetHtml(token: string, baseUrl: string): string {
  const resetUrl = `${baseUrl}/reset-password#access_token=${token}&type=recovery`;
  return emailBase(`
    <div style="height:4px;background:linear-gradient(90deg,#0f172a,#334155);"></div>
    <div style="padding:40px;text-align:center;">
      <div style="width:64px;height:64px;background:#f1f5f9;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
        <span style="font-size:32px;">🔐</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">重置您的密码</h1>
      <p style="margin:0;font-size:15px;color:#64748b;">Reset Your Password</p>
    </div>
    <div style="padding:0 40px 32px;">
      <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 24px;">您好！<br>我们收到了重置您 <strong style="color:#0f172a;">域见•你</strong> 账户密码的请求。点击下方按钮设置新密码：</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:#0f172a;color:#f8fafc;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:600;text-decoration:none;box-shadow:0 4px 14px rgba(15,23,42,0.25);">立即重置密码</a>
      </div>
      <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">如果按钮无法点击，请复制以下链接：</p>
        <p style="margin:0;font-size:12px;color:#0f172a;word-break:break-all;font-family:monospace;line-height:1.5;">${resetUrl}</p>
      </div>
      <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:16px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#854d0e;">安全提醒</p>
        <ul style="margin:0;padding-left:16px;font-size:13px;color:#713f12;line-height:1.8;">
          <li>此链接 <strong>30 分钟内</strong>有效，且只能使用一次</li>
          <li>如果您没有请求重置密码，请忽略此邮件</li>
          <li>切勿将此链接分享给任何人</li>
        </ul>
      </div>
    </div>
    <div style="padding:20px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;">
      <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">遇到问题？联系 <a href="mailto:support@nic.rw" style="color:#64748b;text-decoration:none;">support@nic.rw</a></p>
    </div>`, '重置您的域见•你账户密码');
}

function getEmailVerificationHtml(confirmUrl: string): string {
  return emailBase(`
    <div style="height:4px;background:linear-gradient(90deg,#0f172a,#334155);"></div>
    <div style="padding:40px;text-align:center;">
      <div style="width:64px;height:64px;background:#f0fdf4;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
        <span style="font-size:32px;">🎉</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">欢迎加入域见•你</h1>
      <p style="margin:0;font-size:15px;color:#64748b;">Welcome to NIC.RW</p>
    </div>
    <div style="padding:0 40px 32px;">
      <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 24px;">感谢您注册 <strong style="color:#0f172a;">域见•你</strong> 域名交易平台！请点击下方按钮验证您的邮箱地址：</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${confirmUrl}" style="display:inline-block;background:#0f172a;color:#f8fafc;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:600;text-decoration:none;box-shadow:0 4px 14px rgba(15,23,42,0.25);">验证邮箱地址</a>
      </div>
      <div style="background:#f8fafc;border-radius:10px;padding:20px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#0f172a;">验证后您可以：</p>
        <p style="margin:4px 0;font-size:13px;color:#475569;"><span style="color:#0f172a;font-weight:600;margin-right:8px;">✓</span>上架出售您的域名资产</p>
        <p style="margin:4px 0;font-size:13px;color:#475569;"><span style="color:#0f172a;font-weight:600;margin-right:8px;">✓</span>竞拍优质域名，安全托管交易</p>
        <p style="margin:4px 0;font-size:13px;color:#475569;"><span style="color:#0f172a;font-weight:600;margin-right:8px;">✓</span>与买家/卖家实时沟通洽谈</p>
      </div>
      <p style="margin:20px 0 0;font-size:13px;color:#94a3b8;text-align:center;">此验证链接 <strong style="color:#64748b;">24 小时内</strong>有效</p>
    </div>
    <div style="padding:20px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;">
      <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">遇到问题？联系 <a href="mailto:support@nic.rw" style="color:#64748b;text-decoration:none;">support@nic.rw</a></p>
    </div>`, '验证您的域见•你账户邮箱');
}

function getMagicLinkHtml(confirmUrl: string): string {
  return emailBase(`
    <div style="height:4px;background:linear-gradient(90deg,#0f172a,#334155);"></div>
    <div style="padding:40px;text-align:center;">
      <div style="width:64px;height:64px;background:#eff6ff;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
        <span style="font-size:32px;">🔗</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">您的登录链接</h1>
      <p style="margin:0;font-size:15px;color:#64748b;">Magic Login Link</p>
    </div>
    <div style="padding:0 40px 32px;">
      <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 24px;">点击下方按钮，一键登录您的 <strong style="color:#0f172a;">域见•你</strong> 账户：</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${confirmUrl}" style="display:inline-block;background:#0f172a;color:#f8fafc;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:600;text-decoration:none;box-shadow:0 4px 14px rgba(15,23,42,0.25);">立即登录</a>
      </div>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 16px;text-align:center;">
        <p style="margin:0;font-size:13px;color:#b91c1c;font-weight:500;">此链接 <strong>15 分钟内</strong>有效，且只能使用一次</p>
      </div>
      <p style="margin:20px 0 0;font-size:13px;color:#94a3b8;text-align:center;">如未请求此链接，请直接忽略此邮件</p>
    </div>
    <div style="padding:20px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;">
      <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">遇到问题？联系 <a href="mailto:support@nic.rw" style="color:#64748b;text-decoration:none;">support@nic.rw</a></p>
    </div>`, '您的域见•你免密登录链接');
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await req.json();
    const { user, email_data } = data;
    const { token, token_hash, redirect_to, email_action_type, site_url } = email_data;

    let baseUrl = 'https://nic.rw';
    if (redirect_to) {
      try { baseUrl = new URL(redirect_to).origin; } catch { /* keep default */ }
    } else if (site_url) {
      baseUrl = site_url.replace(/\/$/, '');
    }

    const userEmail = user?.email;
    if (!userEmail) throw new Error('No user email in payload');

    let subject = '';
    let html = '';

    switch (email_action_type) {
      case 'recovery':
        subject = '重置您的 域见•你 账户密码';
        html = getPasswordResetHtml(token, baseUrl);
        break;

      case 'signup':
      case 'email_change': {
        subject = '请验证您的 域见•你 账户邮箱';
        const confirmUrl = `${baseUrl}/auth/confirm?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || baseUrl)}`;
        html = getEmailVerificationHtml(confirmUrl);
        break;
      }

      case 'magiclink': {
        subject = '您的 域见•你 一键登录链接';
        const magicUrl = `${baseUrl}/auth/confirm?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || baseUrl)}`;
        html = getMagicLinkHtml(magicUrl);
        break;
      }

      default:
        subject = '域见•你 平台通知';
        html = emailBase(`<div style="padding:40px;"><h2 style="color:#0f172a;">域见•你 通知</h2><p style="color:#475569;">您收到了一封来自 域见•你 平台的通知邮件。</p></div>`, '域见•你平台通知');
    }

    // Delegate to send-email function which handles SMTP config from site_settings
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
