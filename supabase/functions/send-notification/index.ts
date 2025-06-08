import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { Resend } from "https://esm.sh/resend@4.1.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, recipient, data } = await req.json();

    // Connect to Supabase
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Set up email template variables
    let emailSubject = "";
    let emailBody = "";

    const baseUrl = Deno.env.get("SITE_URL") || "https://sale.nic.bn"; // Use environment variable or default
    
    // Only send from sale.nic.bn address
    const fromEmail = "noreply@sale.nic.bn";

    // Process based on notification type
    switch (type) {
      case "email_verification":
        emailSubject = "请验证您的邮箱地址 - NIC.BN Ltd";
        emailBody = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>邮箱验证</title>
              <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
                .content { padding: 40px 30px; }
                .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; margin: 25px 0; transition: transform 0.2s; }
                .button:hover { transform: translateY(-2px); }
                .footer { text-align: center; padding: 30px; font-size: 14px; color: #888; background-color: #f8f9fa; }
                .logo { font-size: 16px; opacity: 0.8; }
                h2 { color: #333; margin-bottom: 20px; }
                p { margin: 16px 0; line-height: 1.8; }
                .highlight { background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">🌐 NIC.BN Ltd</div>
                  <h1>域名交易平台</h1>
                </div>
                <div class="content">
                  <h2>🎉 欢迎加入我们！</h2>
                  <p>您好 <strong>${data.name}</strong>，</p>
                  <p>感谢您注册我们的域名交易平台。为了确保您的账户安全，请点击下方按钮验证您的邮箱地址：</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.verificationUrl}" class="button">✉️ 验证邮箱地址</a>
                  </div>
                  
                  <div class="highlight">
                    <p><strong>📌 重要提醒：</strong></p>
                    <ul>
                      <li>此链接有效期为24小时</li>
                      <li>如果您没有注册账户，请忽略此邮件</li>
                      <li>验证后即可开始买卖域名</li>
                    </ul>
                  </div>
                  
                  <p>如有任何疑问，请随时联系我们的客服团队。</p>
                  <p>祝您使用愉快！<br><strong>NIC.BN Ltd 团队</strong></p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} NIC.BN Ltd 域名交易平台 - 保留所有权利</p>
                  <p>您收到此邮件是因为您在 NIC.BN Ltd 平台上注册了账户</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;

      case "password_reset":
        emailSubject = "重置您的账户密码 - NIC.BN Ltd";
        emailBody = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>重置密码</title>
              <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px 20px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
                .content { padding: 40px 30px; }
                .button { display: inline-block; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; margin: 25px 0; transition: transform 0.2s; }
                .button:hover { transform: translateY(-2px); }
                .footer { text-align: center; padding: 30px; font-size: 14px; color: #888; background-color: #f8f9fa; }
                .logo { font-size: 16px; opacity: 0.8; }
                h2 { color: #333; margin-bottom: 20px; }
                p { margin: 16px 0; line-height: 1.8; }
                .warning { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">🔐 NIC.BN Ltd</div>
                  <h1>密码重置</h1>
                </div>
                <div class="content">
                  <h2>🔑 重置您的密码</h2>
                  <p>我们收到了您重置密码的请求。</p>
                  <p>点击下面的按钮设置新密码：</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${baseUrl}/reset-password?token=${data.token}" class="button">🔄 重置密码</a>
                  </div>
                  
                  <div class="warning">
                    <p><strong>⚠️ 安全提醒：</strong></p>
                    <ul>
                      <li>此链接有效期为24小时</li>
                      <li>如果您没有请求重置密码，请忽略此邮件</li>
                      <li>为了账户安全，建议设置强密码</li>
                    </ul>
                  </div>
                  
                  <p>如有疑问，请联系我们的技术支持团队。</p>
                  <p>保护您的账户安全！<br><strong>NIC.BN Ltd 团队</strong></p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} NIC.BN Ltd 域名交易平台 - 保留所有权利</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;

      case "new_offer":
        emailSubject = `💰 新的域名报价：${data.domain}`;
        emailBody = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>新的域名报价</title>
              <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
                .content { padding: 40px 30px; }
                .button { display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; margin: 25px 0; transition: all 0.2s; text-shadow: 0 1px 2px rgba(0,0,0,0.1); box-shadow: 0 2px 4px rgba(5,150,105,0.3); }
                .button:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(5,150,105,0.4); }
                .footer { text-align: center; padding: 30px; font-size: 14px; color: #888; background-color: #f8f9fa; }
                .logo { font-size: 16px; opacity: 0.8; }
                .offer-card { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 10px; margin: 25px 0; border: 2px solid #0ea5e9; }
                .price { font-size: 32px; font-weight: bold; color: #10b981; text-align: center; margin: 10px 0; }
                .domain { font-size: 24px; font-weight: bold; color: #1e40af; text-align: center; margin: 10px 0; }
                h2 { color: #333; margin-bottom: 20px; }
                p { margin: 16px 0; line-height: 1.8; }
                .details { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .details table { width: 100%; border-collapse: collapse; }
                .details td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
                .details td:first-child { font-weight: bold; color: #64748b; width: 30%; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">💰 NIC.BN Ltd</div>
                  <h1>新的域名报价</h1>
                </div>
                <div class="content">
                  <h2>🎉 恭喜！您收到了新的域名报价</h2>
                  
                  <div class="offer-card">
                    <div class="domain">${data.domain}</div>
                    <div class="price">$${data.amount.toLocaleString()}</div>
                  </div>
                  
                  <div class="details">
                    <table>
                      <tr>
                        <td>📧 买家邮箱：</td>
                        <td>${data.buyer_email}</td>
                      </tr>
                      <tr>
                        <td>💵 报价金额：</td>
                        <td><strong>$${data.amount.toLocaleString()}</strong></td>
                      </tr>
                      <tr>
                        <td>⏰ 报价时间：</td>
                        <td>${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</td>
                      </tr>
                      ${data.message ? `<tr>
                        <td>💬 买家留言：</td>
                        <td>${data.message}</td>
                      </tr>` : ''}
                    </table>
                  </div>
                  
                  <p>买家对您的域名很感兴趣！建议您尽快回复以提高成交机会。您可以通过控制面板回应此报价：</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${baseUrl}/user-center?tab=transactions" class="button">💼 查看和回复报价</a>
                  </div>
                  
                  <p>感谢您使用我们的平台进行域名交易！</p>
                  <p>祝您交易顺利！<br><strong>NIC.BN Ltd 团队</strong></p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} NIC.BN Ltd 域名交易平台 - 保留所有权利</p>
                  <p>您收到此邮件是因为您是域名 ${data.domain} 的持有者</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;

      case "offer_response":
        emailSubject = `📬 您的域名报价有回复：${data.domain}`;
        emailBody = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>报价回复</title>
              <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px 20px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
                .content { padding: 40px 30px; }
                .button { display: inline-block; background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; margin: 25px 0; transition: all 0.2s; text-shadow: 0 1px 2px rgba(0,0,0,0.1); box-shadow: 0 2px 4px rgba(29,78,216,0.3); }
                .button:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(29,78,216,0.4); }
                .footer { text-align: center; padding: 30px; font-size: 14px; color: #888; background-color: #f8f9fa; }
                .logo { font-size: 16px; opacity: 0.8; }
                .response-card { background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); padding: 25px; border-radius: 10px; margin: 25px 0; border: 2px solid #f59e0b; }
                h2 { color: #333; margin-bottom: 20px; }
                p { margin: 16px 0; line-height: 1.8; }
                .details { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .details table { width: 100%; border-collapse: collapse; }
                .details td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
                .details td:first-child { font-weight: bold; color: #64748b; width: 30%; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">📬 NIC.BN Ltd</div>
                  <h1>报价回复</h1>
                </div>
                <div class="content">
                  <h2>📨 您的域名报价有新回复</h2>
                  
                  <div class="response-card">
                    <h3 style="margin-top: 0; color: #92400e;">域名：${data.domain}</h3>
                    <p style="margin: 0; color: #92400e;">卖家已回复您的报价</p>
                  </div>
                  
                  <div class="details">
                    <table>
                      <tr>
                        <td>🌐 域名：</td>
                        <td><strong>${data.domain}</strong></td>
                      </tr>
                      <tr>
                        <td>💰 您的报价：</td>
                        <td><strong>$${data.amount.toLocaleString()}</strong></td>
                      </tr>
                      <tr>
                        <td>📝 卖家回复：</td>
                        <td><strong>${data.response}</strong></td>
                      </tr>
                      ${data.counter_offer ? `<tr>
                        <td>💵 卖家反报价：</td>
                        <td><strong style="color: #10b981;">$${data.counter_offer.toLocaleString()}</strong></td>
                      </tr>` : ''}
                    </table>
                  </div>
                  
                  <p>请登录您的账户查看完整的交易详情并继续沟通：</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${baseUrl}/user-center?tab=transactions" class="button">💼 查看交易详情</a>
                  </div>
                  
                  <p>感谢您使用我们的域名交易平台！</p>
                  <p>祝您交易愉快！<br><strong>NIC.BN Ltd 团队</strong></p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} NIC.BN Ltd 域名交易平台 - 保留所有权利</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;

      case "domain_sold":
        emailSubject = "域名已售出";
        emailBody = `
          <div style="font-family: sans-serif; color: #333;">
            <h1>域名已售出</h1>
            <p>域名：<strong>${data.domain}</strong></p>
            <p>成交金额：<strong>$${data.amount}</strong></p>
            <p>买家：<strong>${data.buyer}</strong></p>
            <p>您可以登录系统查看交易详情。</p>
            <p><a href="${baseUrl}/user-center?tab=transactions" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">查看交易</a></p>
          </div>
        `;
        break;

      case "domain_purchased":
        emailSubject = "域名购买成功";
        emailBody = `
          <div style="font-family: sans-serif; color: #333;">
            <h1>域名购买成功</h1>
            <p>域名：<strong>${data.domain}</strong></p>
            <p>成交金额：<strong>$${data.amount}</strong></p>
            <p>卖家：<strong>${data.seller}</strong></p>
            <p>您可以登录系统查看交易详情。</p>
            <p><a href="${baseUrl}/user-center?tab=transactions" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">查看交易</a></p>
          </div>
        `;
        break;

      case "verification_complete":
        emailSubject = "域名验证完成";
        emailBody = `
          <div style="font-family: sans-serif; color: #333;">
            <h1>域名验证完成</h1>
            <p>域名：<strong>${data.domain}</strong></p>
            <p>验证状态：<strong>${data.status}</strong></p>
            <p>您可以登录系统查看详情。</p>
            <p><a href="${baseUrl}/user-center?tab=domains" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">查看域名</a></p>
          </div>
        `;
        break;

      case "domain_value_estimate":
        emailSubject = "域名价值评估结果";
        emailBody = `
          <div style="font-family: sans-serif; color: #333;">
            <h1>域名价值评估结果</h1>
            <p>域名：<strong>${data.domain}</strong></p>
            <p>估值范围：<strong>$${data.min_price} - $${data.max_price}</strong></p>
            <p>置信度：<strong>${data.confidence_score}%</strong></p>
            <p>您可以登录系统查看完整评估详情。</p>
            <p><a href="${baseUrl}/domain-evaluation?domain=${data.domain}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">查看详情</a></p>
          </div>
        `;
        break;

      case "analytics_report":
        emailSubject = "域名数据分析报告";
        emailBody = `
          <div style="font-family: sans-serif; color: #333;">
            <h1>域名数据分析报告</h1>
            <p>您的域名 <strong>${data.domain}</strong> 的周分析报告已生成。</p>
            <p>本周浏览量：<strong>${data.views}</strong></p>
            <p>收藏数：<strong>${data.favorites}</strong></p>
            <p>报价数：<strong>${data.offers}</strong></p>
            <p>您可以登录系统查看完整分析报告。</p>
            <p><a href="${baseUrl}/user-center?tab=domains" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">查看详情</a></p>
          </div>
        `;
        break;

      default:
        throw new Error("Unknown notification type");
    }

    // Create notification in database if recipient is a UUID (user ID)
    if (recipient.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      try {
        // Determine notification type and title
        let notificationType = 'system';
        let notificationTitle = '系统通知';
        let actionUrl = '/user-center?tab=notifications';
        
        if (type.includes('offer')) {
          notificationType = 'offer';
          notificationTitle = '新的域名报价';
          actionUrl = '/user-center?tab=transactions';
        } else if (type.includes('verification')) {
          notificationType = 'verification';
          notificationTitle = '域名验证更新';
          actionUrl = '/user-center?tab=domains';
        } else if (type.includes('domain_')) {
          notificationType = 'transaction';
          notificationTitle = '域名交易更新';
          actionUrl = '/user-center?tab=transactions';
        }
        
        // Create notification in database
        await supabaseAdmin.from('notifications').insert({
          user_id: recipient,
          title: data.title || notificationTitle,
          message: data.message || emailSubject,
          type: notificationType,
          is_read: false,
          created_at: new Date().toISOString(),
          related_id: data.related_id,
          action_url: data.action_url || actionUrl
        });
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
        // Continue with email even if notification fails
      }
    }

    // Send the email through Resend if recipient is an email
    if (recipient.includes('@')) {
      const { error } = await resend.emails.send({
        from: fromEmail,
        to: [recipient],
        subject: emailSubject,
        html: emailBody,
      });

      if (error) {
        throw new Error(`Failed to send email: ${error.message}`);
      }
    }

    console.log(`Successfully sent ${type} notification to ${recipient}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
