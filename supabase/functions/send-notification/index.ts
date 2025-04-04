
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  type: string;
  recipient: string;
  data: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const resend = new Resend(RESEND_API_KEY);

    const { type, recipient, data }: NotificationPayload = await req.json();
    console.log(`Processing notification type: ${type} for ${recipient}`);

    // Fetch the email template from Supabase (if available)
    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("name", type)
      .eq("is_active", true)
      .single();

    if (templateError && templateError.code !== "PGRST116") {
      console.error("Error fetching email template:", templateError);
    }

    // Default values if template not found
    let subject = "DomainX - 通知";
    let htmlContent = "<p>您有一条新的通知</p>";

    // Process specific notification types with defaults if no template exists
    switch (type) {
      case "email_verification":
        subject = "DomainX - 请验证您的邮箱";
        htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>验证您的邮箱地址</title>
              <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                .header { background-color: #000; padding: 30px 20px; text-align: center; }
                .header img { max-width: 180px; }
                .header h1 { color: white; margin: 10px 0 0; font-size: 24px; }
                .content { padding: 30px 20px; }
                .button { display: inline-block; background-color: #000; color: white; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: bold; margin: 25px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #888; background-color: #f5f5f5; }
                .highlight { background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #000; }
                p { margin: 16px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>DomainX</h1>
                </div>
                <div class="content">
                  <h2>验证您的邮箱地址</h2>
                  <p>感谢您注册 DomainX！请验证您的邮箱地址以完成注册流程。</p>
                  
                  <div style="text-align: center;">
                    <a href="${data.verificationUrl || 'https://domain.bf/auth/verify'}" class="button">验证邮箱</a>
                  </div>
                  
                  <div class="highlight">
                    <p>或复制以下链接到您的浏览器：</p>
                    <p style="word-break: break-all; font-size: 14px;"><a href="${data.verificationUrl || 'https://domain.bf/auth/verify'}">${data.verificationUrl || 'https://domain.bf/auth/verify'}</a></p>
                  </div>
                  
                  <p>如果您没有注册 DomainX 账户，请忽略此邮件。</p>
                  <p>验证链接将在24小时后过期。</p>
                  
                  <p>感谢使用我们的服务！<br>DomainX 团队</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} DomainX. 保留所有权利。</p>
                  <p>此邮件由系统自动发送，请勿回复。</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;

      case "password_reset":
        subject = "DomainX - 重置密码";
        htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>重置您的密码</title>
              <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                .header { background-color: #000; padding: 30px 20px; text-align: center; }
                .header img { max-width: 180px; }
                .header h1 { color: white; margin: 10px 0 0; font-size: 24px; }
                .content { padding: 30px 20px; }
                .button { display: inline-block; background-color: #000; color: white; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: bold; margin: 25px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #888; background-color: #f5f5f5; }
                .highlight { background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #000; }
                .note { background-color: #fff8e1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
                p { margin: 16px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>DomainX</h1>
                </div>
                <div class="content">
                  <h2>重置您的密码</h2>
                  <p>我们收到了重置您 DomainX 账户密码的请求。请点击下方按钮重置密码：</p>
                  
                  <div style="text-align: center;">
                    <a href="${data.resetUrl || 'https://domain.bf/reset-password'}" class="button">重置密码</a>
                  </div>
                  
                  <div class="highlight">
                    <p>或复制以下链接到您的浏览器：</p>
                    <p style="word-break: break-all; font-size: 14px;"><a href="${data.resetUrl || 'https://domain.bf/reset-password'}">${data.resetUrl || 'https://domain.bf/reset-password'}</a></p>
                  </div>
                  
                  <div class="note">
                    <p><strong>注意：</strong> 此链接仅在30分钟内有效。</p>
                    <p>如果您没有请求重置密码，请忽略此邮件，您的账户将保持安全。</p>
                  </div>
                  
                  <p>如果您在重置密码过程中遇到任何问题，请联系我们的客户支持团队。</p>
                  <p>祝您使用愉快！<br>DomainX 团队</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} DomainX. 保留所有权利。</p>
                  <p>此邮件由系统自动发送，请勿回复。</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;

      case "admin_login":
        subject = "DomainX - 管理员登录验证";
        const oneTimePassword = data.oneTimePassword || Math.random().toString(36).substring(2, 10);
        htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>管理员登录验证</title>
              <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                .header { background-color: #000; padding: 30px 20px; text-align: center; }
                .header img { max-width: 180px; }
                .header h1 { color: white; margin: 10px 0 0; font-size: 24px; }
                .content { padding: 30px 20px; }
                .code { background-color: #f5f5f5; padding: 20px; text-align: center; font-family: monospace; font-size: 32px; letter-spacing: 5px; font-weight: bold; border: 1px dashed #ccc; margin: 25px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #888; background-color: #f5f5f5; }
                .warning { background-color: #fff0f0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff5252; }
                p { margin: 16px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>DomainX</h1>
                </div>
                <div class="content">
                  <h2>管理员登录验证</h2>
                  <p>我们收到了您的管理员登录请求。请使用以下一次性密码完成登录验证：</p>
                  
                  <div class="code">${oneTimePassword}</div>
                  
                  <div class="warning">
                    <p><strong>重要提示：</strong></p>
                    <ul>
                      <li>此密码将在10分钟后过期</li>
                      <li>请勿与任何人分享此密码</li>
                      <li>如果您没有尝试登录，请立即联系系统管理员</li>
                    </ul>
                  </div>
                  
                  <p>感谢使用 DomainX 管理系统！</p>
                  <p>DomainX 安全团队</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} DomainX. 保留所有权利。</p>
                  <p>此邮件由系统自动发送，请勿回复。</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;

      case "verification_approved":
        subject = "DomainX - 域名验证已通过";
        htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>域名验证已通过</title>
              <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                .header { background-color: #000; padding: 30px 20px; text-align: center; }
                .header img { max-width: 180px; }
                .header h1 { color: white; margin: 10px 0 0; font-size: 24px; }
                .content { padding: 30px 20px; }
                .button { display: inline-block; background-color: #000; color: white; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: bold; margin: 25px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #888; background-color: #f5f5f5; }
                .success { background-color: #e8f5e9; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4caf50; }
                .domain { font-size: 24px; font-weight: bold; padding: 10px; background-color: #f5f5f5; border-radius: 4px; display: inline-block; margin: 10px 0; }
                p { margin: 16px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>DomainX</h1>
                </div>
                <div class="content">
                  <h2>🎉 域名验证已通过</h2>
                  <p>恭喜！您的域名已成功通过验证流程：</p>
                  
                  <div style="text-align: center;">
                    <div class="domain">${data.domain || 'domain.bf'}</div>
                  </div>
                  
                  <div class="success">
                    <p><strong>已验证状态：</strong> 您现在可以在我们的平台上展示和出售此域名。</p>
                  </div>
                  
                  <p>下一步操作：</p>
                  <ol>
                    <li>设置您的域名价格和描述</li>
                    <li>添加关键词以提高搜索匹配率</li>
                    <li>选择是否愿意接受议价</li>
                  </ol>
                  
                  <div style="text-align: center;">
                    <a href="https://domain.bf/dashboard" class="button">进入控制台</a>
                  </div>
                  
                  <p>如有任何问题，请随时与我们的支持团队联系。</p>
                  <p>祝您销售顺利！<br>DomainX 团队</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} DomainX. 保留所有权利。</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;

      case "new_offer":
        subject = "DomainX - 您的域名收到新报价";
        htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>收到新域名报价</title>
              <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                .header { background-color: #000; padding: 30px 20px; text-align: center; }
                .header img { max-width: 180px; }
                .header h1 { color: white; margin: 10px 0 0; font-size: 24px; }
                .content { padding: 30px 20px; }
                .button { display: inline-block; background-color: #000; color: white; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: bold; margin: 25px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #888; background-color: #f5f5f5; }
                .offer-card { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
                .offer-details { margin-top: 15px; width: 100%; }
                .offer-details td, .offer-details th { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
                .offer-details th { background-color: #f5f5f5; font-weight: normal; color: #666; width: 35%; }
                .amount { color: #10b981; font-weight: bold; font-size: 24px; }
                .domain-name { font-weight: bold; }
                p { margin: 16px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>DomainX</h1>
                </div>
                <div class="content">
                  <h2>💰 您收到了一个新报价！</h2>
                  <p>有买家对您的域名 <span class="domain-name">${data.domain || ''}</span> 提交了报价。</p>
                  
                  <div class="offer-card">
                    <h3>报价详情：</h3>
                    <table class="offer-details">
                      <tr>
                        <th>域名</th>
                        <td><strong>${data.domain || ''}</strong></td>
                      </tr>
                      <tr>
                        <th>报价金额</th>
                        <td><span class="amount">$${data.amount || '0'}</span></td>
                      </tr>
                      <tr>
                        <th>买家邮箱</th>
                        <td>${data.buyer_email || ''}</td>
                      </tr>
                      <tr>
                        <th>留言</th>
                        <td>${data.message || '<无留言>'}</td>
                      </tr>
                      <tr>
                        <th>报价时间</th>
                        <td>${new Date().toLocaleString('zh-CN', { hour12: false })}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <p>请登录您的账户查看详情并回复此报价。您可以选择接受、拒绝或发起反议价。</p>
                  
                  <div style="text-align: center;">
                    <a href="https://domain.bf/dashboard" class="button">查看并回应报价</a>
                  </div>
                  
                  <p>回应越快，成交几率越高！</p>
                  <p>如有任何疑问，请随时联系我们的客户支持团队。</p>
                  <p>祝您业务兴隆！<br>DomainX 团队</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} DomainX. 保留所有权利。</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;

      case "offer_accepted":
        subject = "DomainX - 您的报价已被接受";
        htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>您的报价已被接受</title>
              <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                .header { background-color: #000; padding: 30px 20px; text-align: center; }
                .header img { max-width: 180px; }
                .header h1 { color: white; margin: 10px 0 0; font-size: 24px; }
                .content { padding: 30px 20px; }
                .button { display: inline-block; background-color: #000; color: white; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: bold; margin: 25px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #888; background-color: #f5f5f5; }
                .success-box { background-color: #e8f5e9; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4caf50; }
                .steps { background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; }
                .steps ol { margin-top: 10px; margin-bottom: 10px; }
                .steps li { margin-bottom: 10px; }
                .domain-name { font-weight: bold; }
                p { margin: 16px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>DomainX</h1>
                </div>
                <div class="content">
                  <h2>🎉 恭喜！您的报价已被接受</h2>
                  
                  <div class="success-box">
                    <p>域名所有者已接受您对 <span class="domain-name">${data.domain || ''}</span> 域名 <strong>$${data.amount || '0'}</strong> 的报价。</p>
                  </div>
                  
                  <p>为了完成交易并获得域名所有权，请按照以下步骤操作：</p>
                  
                  <div class="steps">
                    <h3>后续流程：</h3>
                    <ol>
                      <li>登录您的 DomainX 账户</li>
                      <li>前往交易详情页面</li>
                      <li>选择支付方式完成付款</li>
                      <li>完成域名转移流程</li>
                    </ol>
                  </div>
                  
                  <p>我们的系统将在您完成付款后，指导您完成域名转移流程。</p>
                  
                  <div style="text-align: center;">
                    <a href="https://domain.bf/dashboard" class="button">完成交易</a>
                  </div>
                  
                  <p>如果您在交易过程中遇到任何问题，请随时联系我们的客户支持团队获取帮助。</p>
                  <p>感谢您使用 DomainX 平台！<br>DomainX 团队</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} DomainX. 保留所有权利。</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;
    }

    // Use template if found
    if (template) {
      subject = template.subject;
      htmlContent = template.body;

      // Replace variables in template
      if (template.variables && template.variables.length > 0) {
        for (const variable of template.variables) {
          const value = data[variable] || '';
          htmlContent = htmlContent.replace(new RegExp(`{{${variable}}}`, 'g'), value);
        }
      }
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "DomainX <noreply@domain.bf>",
      to: [recipient],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email notification sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error in send-notification function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send notification" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);
