import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { sendMailWithResend } from "../utils/sendMailWithResend.ts";
import { getPasswordResetHtml } from "../send-notification/templates/passwordReset.ts";
import { getEmailVerificationHtml } from "../send-notification/templates/emailVerification.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') || 'your-hook-secret';

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    console.log('Auth webhook received:', {
      method: req.method,
      headers: Object.keys(headers),
      payloadLength: payload.length
    });

    // 验证webhook签名（如果配置了密钥）
    if (hookSecret && hookSecret !== 'your-hook-secret') {
      try {
        const wh = new Webhook(hookSecret);
        wh.verify(payload, headers);
      } catch (err) {
        console.error('Webhook verification failed:', err);
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }
    }

    const data = JSON.parse(payload);
    console.log('Parsed webhook data:', data);

    const {
      user,
      email_data: { 
        token, 
        token_hash, 
        redirect_to, 
        email_action_type,
        site_url
      }
    } = data;

    const baseUrl = site_url || "https://nic.bn";
    const userEmail = user.email;

    // 根据邮件类型生成相应的HTML内容
    let subject = '';
    let htmlContent = '';

    switch (email_action_type) {
      case 'recovery':
        subject = '🔐 重置您的 NIC.BN 账户密码 | Reset your NIC.BN password';
        htmlContent = getPasswordResetHtml({ token: token_hash }, baseUrl);
        break;
      
      case 'signup':
      case 'email_change':
        subject = '🎉 欢迎加入 NIC.BN - 请验证您的邮箱 | Welcome to NIC.BN – Verify your email';
        htmlContent = getEmailVerificationHtml({ 
          token: token_hash, 
          confirmUrl: `${baseUrl}/auth/confirm?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || baseUrl)}`
        }, baseUrl);
        break;
      
      case 'magiclink':
        subject = '🔗 您的 NIC.BN 登录链接 | Your NIC.BN login link';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>🔗 Magic Link Login</h2>
            <p>点击下方链接登录您的 NIC.BN 账户：</p>
            <p>Click the link below to sign in to your NIC.BN account:</p>
            <a href="${baseUrl}/auth/confirm?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || baseUrl)}" 
               style="display: inline-block; background: #1f2937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              登录 NIC.BN | Sign in to NIC.BN
            </a>
            <p style="color: #666; font-size: 14px;">此链接将在30分钟后过期 | This link expires in 30 minutes</p>
          </div>
        `;
        break;
      
      default:
        subject = 'NIC.BN 通知 | NIC.BN Notification';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>NIC.BN 通知</h2>
            <p>您收到了一封来自 NIC.BN 的通知邮件。</p>
            <p>You received a notification email from NIC.BN.</p>
          </div>
        `;
    }

    // 使用统一的 sale.nic.bn 发件人地址发送邮件
    await sendMailWithResend(
      userEmail,
      subject,
      htmlContent,
      {
        from: "NIC.BN 域名交易平台 <noreply@sale.nic.bn>"
      }
    );

    console.log(`Auth email sent successfully to ${userEmail} for action: ${email_action_type}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        action_type: email_action_type,
        recipient: userEmail
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in auth-send-email function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send email',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);