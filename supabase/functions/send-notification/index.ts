
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

    const baseUrl = Deno.env.get("SITE_URL") || "https://nic.bn"; // Use environment variable or default
    
    // Only send from noreply@domain.bf address
    const fromEmail = "noreply@domain.bf";

    // Process based on notification type
    switch (type) {
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

      default:
        throw new Error("Unknown notification type");
    }

    // Send the email through Resend
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [recipient],
      subject: emailSubject,
      html: emailBody,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
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
