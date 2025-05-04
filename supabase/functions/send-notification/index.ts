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
        emailSubject = "请验证您的邮箱地址 - 域名交易平台";
        emailBody = `
          <div style="font-family: sans-serif; color: #333;">
            <h1>域名交易平台 - 邮箱验证</h1>
            <p>您好 ${data.name}，</p>
            <p>感谢您注册我们的域名交易平台。请点击下方按钮验证您的邮箱地址：</p>
            <p><a href="${data.verificationUrl}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">验证邮箱</a></p>
            <p>如果您没有注册账户，请忽略此邮件。</p>
            <p>此链接有效期为24小时。</p>
          </div>
        `;
        break;

      case "password_reset":
        emailSubject = "重置密码";
        emailBody = `
          <div style="font-family: sans-serif; color: #333;">
            <h1>域名交易平台 - 重置密码</h1>
            <p>您好，我们收到了您重置密码的请求。</p>
            <p>点击下面的链接重置您的密码：</p>
            <p><a href="${baseUrl}/reset-password?token=${data.token}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">重置密码</a></p>
            <p>如果您没有请求重置密码，请忽略此邮件。</p>
            <p>链接有效期为24小时。</p>
          </div>
        `;
        break;

      case "new_offer":
        emailSubject = "新的域名报价";
        emailBody = `
          <div style="font-family: sans-serif; color: #333;">
            <h1>您收到了一个新的域名报价</h1>
            <p>域名：<strong>${data.domain}</strong></p>
            <p>报价金额：<strong>$${data.amount}</strong></p>
            <p>买家邮箱：<strong>${data.buyer_email}</strong></p>
            ${data.message ? `<p>买家留言：<strong>${data.message}</strong></p>` : ''}
            <p>您可以登录系统查看和回复此报价。</p>
            <p><a href="${baseUrl}/user-center?tab=transactions" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">查看报价</a></p>
          </div>
        `;
        break;

      case "offer_response":
        emailSubject = "您的域名报价有回复";
        emailBody = `
          <div style="font-family: sans-serif; color: #333;">
            <h1>您的域名报价有回复</h1>
            <p>域名：<strong>${data.domain}</strong></p>
            <p>您的报价金额：<strong>$${data.amount}</strong></p>
            <p>卖家回复：<strong>${data.response}</strong></p>
            ${data.counter_offer ? `<p>卖家反报价：<strong>$${data.counter_offer}</strong></p>` : ''}
            <p>您可以登录系统查看和回复此消息。</p>
            <p><a href="${baseUrl}/user-center?tab=transactions" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">查看详情</a></p>
          </div>
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
