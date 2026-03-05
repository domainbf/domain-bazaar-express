import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.1.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 直接使用 Resend 发送邮件，避免通过 send-email edge function 的额外网络跳转
async function sendEmailDirect(to: string, subject: string, html: string): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY not set");
  }
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({
    from: "域见•你 域名交易平台 <noreply@domain.bf>",
    to: [to],
    subject,
    html,
  });
  if (error) {
    throw new Error(error.message || "邮件发送失败");
  }
}

function getPasswordResetHtml(token: string, baseUrl: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>重置密码</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 25px rgba(0,0,0,0.1);">
<div style="background:linear-gradient(135deg,#1f2937,#374151);padding:40px 20px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;">🔐 重置密码</h1>
<h2 style="color:#d1d5db;margin:10px 0 0;font-size:16px;font-weight:400;">Reset Your Password</h2></div>
<div style="padding:40px 20px;">
<div style="text-align:center;margin-bottom:30px;">
<p style="font-size:16px;color:#374151;margin:0 0 20px;">您好！我们收到了重置您账户密码的请求。</p>
<p style="font-size:14px;color:#6b7280;margin:0;">Hello! We received a request to reset your account password.</p></div>
<div style="text-align:center;margin:30px 0;">
<a href="${baseUrl}/reset-password#access_token=${token}&type=recovery" style="display:inline-block;background:linear-gradient(135deg,#1f2937,#374151);color:#fff;padding:16px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
立即重置密码 | Reset Password Now</a></div>
<div style="background:#f3f4f6;border-radius:8px;padding:20px;margin:30px 0;text-align:center;">
<h3 style="margin:0 0 10px;color:#1f2937;font-size:16px;">🛡️ 安全提醒</h3>
<p style="margin:0;font-size:14px;color:#6b7280;">如果您没有请求重置密码，请忽略此邮件。</p>
<p style="margin:5px 0 0;font-size:14px;color:#6b7280;">If you didn't request this, please ignore this email.</p></div></div>
<div style="background:#f8fafc;padding:30px 20px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="margin:0;font-size:14px;color:#6b7280;">此邮件由 <strong>域见•你 域名交易平台</strong> 发送</p>
<p style="margin:15px 0 0;font-size:12px;color:#9ca3af;">© 2025 域见•你. All rights reserved.</p></div></div></body></html>`;
}

function getEmailVerificationHtml(tokenHash: string, confirmUrl: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>验证邮箱</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 25px rgba(0,0,0,0.1);">
<div style="background:linear-gradient(135deg,#1f2937,#374151);padding:40px 20px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;">🎉 欢迎加入 域见•你</h1>
<h2 style="color:#d1d5db;margin:10px 0 0;font-size:16px;font-weight:400;">Welcome to 域见•你</h2></div>
<div style="padding:40px 20px;">
<div style="text-align:center;margin-bottom:30px;">
<p style="font-size:16px;color:#374151;margin:0 0 20px;">感谢注册！请验证您的邮箱地址。</p>
<p style="font-size:14px;color:#6b7280;margin:0;">Please verify your email address to complete registration.</p></div>
<div style="text-align:center;margin:30px 0;">
<a href="${confirmUrl}" style="display:inline-block;background:linear-gradient(135deg,#1f2937,#374151);color:#fff;padding:16px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
验证邮箱 | Verify Email</a></div></div>
<div style="background:#f8fafc;padding:30px 20px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="margin:0;font-size:14px;color:#6b7280;">此邮件由 <strong>域见•你 域名交易平台</strong> 发送</p>
<p style="margin:15px 0 0;font-size:12px;color:#9ca3af;">© 2025 域见•你. All rights reserved.</p></div></div></body></html>`;
}

function getMagicLinkHtml(confirmUrl: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>登录链接</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 25px rgba(0,0,0,0.1);">
<div style="background:linear-gradient(135deg,#1f2937,#374151);padding:40px 20px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;">🔗 登录链接</h1>
<h2 style="color:#d1d5db;margin:10px 0 0;font-size:16px;font-weight:400;">Magic Login Link</h2></div>
<div style="padding:40px 20px;">
<div style="text-align:center;margin-bottom:30px;">
<p style="font-size:16px;color:#374151;margin:0 0 20px;">点击下方链接登录您的 域见•你 账户：</p></div>
<div style="text-align:center;margin:30px 0;">
<a href="${confirmUrl}" style="display:inline-block;background:linear-gradient(135deg,#1f2937,#374151);color:#fff;padding:16px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
登录 域见•你 | Sign in</a></div>
<div style="background:#f3f4f6;border-radius:8px;padding:20px;margin:30px 0;text-align:center;">
<p style="margin:0;font-size:14px;color:#6b7280;">⏰ 此链接将在30分钟后过期</p></div></div>
<div style="background:#f8fafc;padding:30px 20px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="margin:0;font-size:14px;color:#6b7280;">此邮件由 <strong>域见•你 域名交易平台</strong> 发送</p>
<p style="margin:15px 0 0;font-size:12px;color:#9ca3af;">© 2025 域见•你. All rights reserved.</p></div></div></body></html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const data = JSON.parse(payload);

    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type, site_url }
    } = data;

    // Use redirect_to to determine the correct base URL (supports preview & production)
    let baseUrl = "https://nic.bn";
    if (redirect_to) {
      try {
        const redirectUrl = new URL(redirect_to);
        baseUrl = redirectUrl.origin;
      } catch {
        if (site_url) baseUrl = site_url.replace(/\/$/, '');
      }
    } else if (site_url) {
      baseUrl = site_url.replace(/\/$/, '');
    }
    const userEmail = user.email;

    let subject = '';
    let htmlContent = '';

    switch (email_action_type) {
      case 'recovery':
        subject = '🔐 重置您的 域见•你 账户密码 | Reset your password';
        htmlContent = getPasswordResetHtml(token, baseUrl);
        break;
      case 'signup':
      case 'email_change': {
        subject = '🎉 欢迎加入 域见•你 - 请验证邮箱 | Verify your email';
        const confirmUrl = `${baseUrl}/auth/confirm?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || baseUrl)}`;
        htmlContent = getEmailVerificationHtml(token_hash, confirmUrl);
        break;
      }
      case 'magiclink': {
        subject = '🔗 您的 域见•你 登录链接 | Your login link';
        const magicUrl = `${baseUrl}/auth/confirm?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || baseUrl)}`;
        htmlContent = getMagicLinkHtml(magicUrl);
        break;
      }
      default:
        subject = '域见•你 通知';
        htmlContent = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2>域见•你 通知</h2><p>您收到了一封来自 域见•你 的通知邮件。</p></div>`;
    }

    await sendEmailDirect(userEmail, subject, htmlContent);

    console.log(`Auth email sent to ${userEmail} for: ${email_action_type}`);

    return new Response(
      JSON.stringify({ success: true, action_type: email_action_type }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('auth-email-webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
