import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') || 'your-hook-secret';

// 邮件模板函数
function getPasswordResetHtml(token: string, baseUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>重置密码 | Reset Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🔐 重置密码</h1>
          <h2 style="color: #d1d5db; margin: 10px 0 0 0; font-size: 16px; font-weight: 400;">Reset Your Password</h2>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">您好！我们收到了重置您账户密码的请求。</p>
            <p style="font-size: 14px; color: #6b7280; margin: 0;">Hello! We received a request to reset your account password.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/reset-password#access_token=${token}&type=recovery" 
               style="display: inline-block; background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: all 0.3s ease;">
              立即重置密码 | Reset Password Now
            </a>
          </div>
          
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px;">🛡️ 安全提醒 | Security Notice</h3>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">如果您没有请求重置密码，请忽略此邮件。</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">If you didn't request this, please ignore this email.</p>
          </div>
          
          <div style="border: 2px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 30px 0; background: #fffbeb;">
            <h3 style="margin: 0 0 10px 0; color: #d97706; font-size: 16px;">⚠️ 重要说明 | Important Notice</h3>
            <p style="margin: 0; font-size: 14px; color: #92400e;">如果您没有请求重置密码，您的账户可能存在安全风险，建议立即联系我们。</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #92400e;">If you didn't request this reset, your account may be at risk. Please contact us immediately.</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 15px 0; font-size: 14px; color: #6b7280;">
            此邮件由 <strong>NIC.BN 域名交易平台</strong> 发送<br>
            This email was sent by <strong>NIC.BN Domain Trading Platform</strong>
          </p>
          <div style="margin: 15px 0;">
            <a href="mailto:support@nic.bn" style="color: #1f2937; text-decoration: none; margin: 0 10px;">📧 联系我们 | Contact Us</a>
            <a href="https://nic.bn" style="color: #1f2937; text-decoration: none; margin: 0 10px;">🌐 访问网站 | Visit Website</a>
          </div>
          <p style="margin: 15px 0 0 0; font-size: 12px; color: #9ca3af;">
            © 2024 NIC.BN 域名交易平台. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getEmailVerificationHtml(token: string, confirmUrl: string, baseUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>验证邮箱 | Email Verification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🎉 欢迎加入 NIC.BN</h1>
          <h2 style="color: #d1d5db; margin: 10px 0 0 0; font-size: 16px; font-weight: 400;">Welcome to NIC.BN</h2>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">感谢您注册 NIC.BN 域名交易平台！请验证您的邮箱地址以完成注册。</p>
            <p style="font-size: 14px; color: #6b7280; margin: 0;">Thank you for registering with NIC.BN! Please verify your email address to complete registration.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: all 0.3s ease;">
              验证邮箱 | Verify Email
            </a>
          </div>
          
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px;">📝 下一步 | Next Steps</h3>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">验证邮箱后，您可以开始使用我们的域名交易服务。</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">After verification, you can start using our domain trading services.</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 15px 0; font-size: 14px; color: #6b7280;">
            此邮件由 <strong>NIC.BN 域名交易平台</strong> 发送<br>
            This email was sent by <strong>NIC.BN Domain Trading Platform</strong>
          </p>
          <div style="margin: 15px 0;">
            <a href="mailto:support@nic.bn" style="color: #1f2937; text-decoration: none; margin: 0 10px;">📧 联系我们 | Contact Us</a>
            <a href="https://nic.bn" style="color: #1f2937; text-decoration: none; margin: 0 10px;">🌐 访问网站 | Visit Website</a>
          </div>
          <p style="margin: 15px 0 0 0; font-size: 12px; color: #9ca3af;">
            © 2024 NIC.BN 域名交易平台. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getMagicLinkHtml(token: string, confirmUrl: string, baseUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>登录链接 | Login Link</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🔗 登录链接</h1>
          <h2 style="color: #d1d5db; margin: 10px 0 0 0; font-size: 16px; font-weight: 400;">Magic Login Link</h2>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">点击下方链接登录您的 NIC.BN 账户：</p>
            <p style="font-size: 14px; color: #6b7280; margin: 0;">Click the link below to sign in to your NIC.BN account:</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: all 0.3s ease;">
              登录 NIC.BN | Sign in to NIC.BN
            </a>
          </div>
          
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px;">⏰ 安全提醒 | Security Notice</h3>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">此链接将在30分钟后过期</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">This link expires in 30 minutes</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 15px 0; font-size: 14px; color: #6b7280;">
            此邮件由 <strong>NIC.BN 域名交易平台</strong> 发送<br>
            This email was sent by <strong>NIC.BN Domain Trading Platform</strong>
          </p>
          <div style="margin: 15px 0;">
            <a href="mailto:support@nic.bn" style="color: #1f2937; text-decoration: none; margin: 0 10px;">📧 联系我们 | Contact Us</a>
            <a href="https://nic.bn" style="color: #1f2937; text-decoration: none; margin: 0 10px;">🌐 访问网站 | Visit Website</a>
          </div>
          <p style="margin: 15px 0 0 0; font-size: 12px; color: #9ca3af;">
            © 2024 NIC.BN 域名交易平台. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

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
        htmlContent = getPasswordResetHtml(token, baseUrl);
        break;
      
      case 'signup':
      case 'email_change':
        subject = '🎉 欢迎加入 NIC.BN - 请验证您的邮箱 | Welcome to NIC.BN – Verify your email';
        const confirmUrl = `${baseUrl}/auth/confirm?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || baseUrl)}`;
        htmlContent = getEmailVerificationHtml(token_hash, confirmUrl, baseUrl);
        break;
      
      case 'magiclink':
        subject = '🔗 您的 NIC.BN 登录链接 | Your NIC.BN login link';
        const magicLinkUrl = `${baseUrl}/auth/confirm?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || baseUrl)}`;
        htmlContent = getMagicLinkHtml(token_hash, magicLinkUrl, baseUrl);
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

    // 调用统一的邮件发送服务
    const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        to: userEmail,
        subject: subject,
        html: htmlContent,
        from: "NIC.BN 域名交易平台 <noreply@sale.nic.bn>"
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Email service error: ${errorText}`);
    }

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
    console.error('Error in auth-email-webhook function:', error);
    
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