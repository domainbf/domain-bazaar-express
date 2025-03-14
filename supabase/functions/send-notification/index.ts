import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: string;
  recipient: string;
  data: any;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, recipient, data }: NotificationRequest = await req.json();
    let subject = '';
    let html = '';
    const siteUrl = "https://domain.bf";

    switch (type) {
      case 'verification_approved':
        subject = `您的域名 ${data.domain} 已通过验证`;
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>域名验证已通过</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #000; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; border: 1px solid #eaeaea; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                .details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 4px; }
                .success { color: #10b981; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>域名验证已通过</h1>
                </div>
                <div class="content">
                  <p>恭喜！</p>
                  <p>您的域名 <strong>${data.domain}</strong> 已成功通过验证。</p>
                  
                  <div class="details">
                    <p>您的域名现在:</p>
                    <p><span class="success">✓ 已验证</span> 并将在搜索结果中突出显示</p>
                    <p><span class="success">✓ 受到信任</span> 来自潜在买家</p>
                    <p><span class="success">✓ 在市场列表中享有优先权</span></p>
                  </div>
                  
                  <p>感谢您完成验证过程。</p>
                  <p>最好的祝福,<br>DomainX 团队</p>
                </div>
                <div class="footer">
                  <p>© 2024 DomainX. 保留所有权利.</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;
        
      case 'verification_rejected':
        subject = `域名 ${data.domain} 的验证未通过`;
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>域名验证未通过</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #000; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; border: 1px solid #eaeaea; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                .details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 4px; }
                .btn { background-color: #000; color: white; display: inline-block; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>域名验证未通过</h1>
                </div>
                <div class="content">
                  <p>您好,</p>
                  <p>我们无法验证您的域名 <strong>${data.domain}</strong>。</p>
                  
                  <div class="details">
                    <p>验证失败的可能原因:</p>
                    <ul>
                      <li>未找到验证记录</li>
                      <li>验证文件无法访问</li>
                      <li>验证数据不正确或已过期</li>
                    </ul>
                    <p>您可以从控制面板再次尝试验证流程。</p>
                  </div>
                  
                  <p>如果您需要帮助，请回复此邮件。</p>
                  <p>最好的祝福,<br>DomainX 团队</p>
                </div>
                <div class="footer">
                  <p>© 2024 DomainX. 保留所有权利.</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;
        
      case 'new_offer':
        subject = `您的域名 ${data.domain} 有新报价: $${data.amount}`;
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>新域名报价</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #000; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; border: 1px solid #eaeaea; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                .details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 4px; }
                .btn { background-color: #000; color: white; display: inline-block; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>新域名报价</h1>
                </div>
                <div class="content">
                  <p>您好,</p>
                  <p>您的域名 <strong>${data.domain}</strong> 收到了新的报价。</p>
                  
                  <div class="details">
                    <h3>报价详情:</h3>
                    <p><strong>域名:</strong> ${data.domain}</p>
                    <p><strong>报价金额:</strong> $${data.amount}</p>
                    <p><strong>买家邮箱:</strong> ${data.buyerEmail}</p>
                    ${data.message ? `<p><strong>留言:</strong> ${data.message}</p>` : ''}
                  </div>
                  
                  <p>您可以登录控制面板回应此报价。如果您选择接受此报价，请使用提供的邮箱联系买家安排域名转移和付款。</p>
                  <a href="${data.dashboardUrl || `${siteUrl}/user-center?tab=domains`}" class="btn" style="color: white;">在控制面板查看</a>
                  <p>最好的祝福,<br>DomainX 团队</p>
                </div>
                <div class="footer">
                  <p>© 2024 DomainX. 保留所有权利.</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;
        
      case 'offer_response':
        const status = data.status.toLowerCase();
        const statusText = status === 'accepted' ? '已接受' : '已拒绝';
        subject = `您对域名 ${data.domain} 的报价已${statusText}`;
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>域名报价${statusText}</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #000; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; border: 1px solid #eaeaea; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                .details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 4px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>域名报价${statusText}</h1>
                </div>
                <div class="content">
                  <p>您好,</p>
                  <p>您对域名 <strong>${data.domain}</strong> 的报价已<strong>${statusText}</strong>。</p>
                  
                  <div class="details">
                    <h3>报价详情:</h3>
                    <p><strong>域名:</strong> ${data.domain}</p>
                    <p><strong>您的报价:</strong> $${data.amount}</p>
                    ${data.message ? `<p><strong>卖家留言:</strong> ${data.message}</p>` : ''}
                  </div>
                  
                  ${status === 'accepted' ? 
                    `<p>域名所有者已接受您的报价，并将很快联系您安排域名转移和付款。</p>
                    <p>如果您在48小时内没有收到卖家的消息，请联系我们的支持团队。</p>` 
                    : 
                    `<p>感谢您的兴趣。您可以继续浏览我们市场上的其他域名。</p>`
                  }
                  <p>最好的祝福,<br>DomainX 团队</p>
                </div>
                <div class="footer">
                  <p>© 2024 DomainX. 保留所有权利.</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;
        
      case 'email_verification':
        subject = '验证您的 DomainX 电子邮箱地址';
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>邮箱验证</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #000; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; border: 1px solid #eaeaea; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                .button { background-color: #000; color: white; display: inline-block; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>验证您的邮箱</h1>
                </div>
                <div class="content">
                  <p>您好,</p>
                  <p>感谢您注册 DomainX。请点击下方按钮验证您的邮箱地址：</p>
                  
                  <div style="text-align: center; margin: 25px 0;">
                    <a href="${data.verificationUrl || `${siteUrl}/auth/verify`}" class="button" style="color: white;">验证邮箱地址</a>
                  </div>
                  
                  <p>如果您没有创建账户，可以安全地忽略此邮件。</p>
                  <p>祝好，<br>DomainX 团队</p>
                </div>
                <div class="footer">
                  <p>© 2024 DomainX - domain.bf</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;
        
      case 'password_reset':
        subject = '重置您的 DomainX 密码';
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>密码重置</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #000; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; border: 1px solid #eaeaea; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                .button { background-color: #000; color: white; display: inline-block; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>重置您的密码</h1>
                </div>
                <div class="content">
                  <p>您好，</p>
                  <p>我们收到了重置您密码的请求。点击下方按钮创建新密码：</p>
                  
                  <div style="text-align: center; margin: 25px 0;">
                    <a href="${data.resetUrl || `${siteUrl}/reset-password`}" class="button" style="color: white;">重置密码</a>
                  </div>
                  
                  <p>如果您没有请求重置密码，可以安全地忽略此邮件。</p>
                  <p>祝好，<br>DomainX 团队</p>
                </div>
                <div class="footer">
                  <p>© 2024 DomainX - domain.bf</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;
        
      default:
        throw new Error('无效的通知类型');
    }

    const emailResponse = await resend.emails.send({
      from: "DomainX <no-reply@domain.bf>",
      to: [recipient],
      subject: subject,
      html: html,
    });

    console.log("邮件成功发送:", emailResponse);

    return new Response(
      JSON.stringify({ 
        message: "通知成功发送",
        emailResponse 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("send-notification函数中的错误:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
