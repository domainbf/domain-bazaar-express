
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
    let subject = "NIC.BN - 通知";
    let htmlContent = "<p>您有一条新的通知</p>";

    // Process specific notification types with defaults if no template exists
    switch (type) {
      case "email_verification":
        subject = "NIC.BN - 请验证您的邮箱";
        htmlContent = `
          <h1>验证您的邮箱地址</h1>
          <p>感谢您注册NIC.BN。请点击下方链接验证您的邮箱地址：</p>
          <p><a href="${data.verificationUrl || 'https://nic.bn/auth/verify'}" style="padding: 10px 20px; background-color: #000; color: white; text-decoration: none; border-radius: 4px;">验证邮箱</a></p>
          <p>或复制以下链接到您的浏览器：<br>${data.verificationUrl || 'https://nic.bn/auth/verify'}</p>
          <p>如果您没有注册NIC.BN账户，请忽略此邮件。</p>
        `;
        break;

      case "password_reset":
        subject = "NIC.BN - 重置密码";
        htmlContent = `
          <h1>重置您的密码</h1>
          <p>我们收到了重置您NIC.BN账户密码的请求。请点击下方链接重置密码：</p>
          <p><a href="${data.resetUrl || 'https://nic.bn/reset-password'}" style="padding: 10px 20px; background-color: #000; color: white; text-decoration: none; border-radius: 4px;">重置密码</a></p>
          <p>或复制以下链接到您的浏览器：<br>${data.resetUrl || 'https://nic.bn/reset-password'}</p>
          <p>如果您没有请求重置密码，请忽略此邮件。</p>
        `;
        break;

      case "admin_login":
        subject = "NIC.BN - 管理员登录验证";
        const oneTimePassword = data.oneTimePassword || Math.random().toString(36).substring(2, 10);
        htmlContent = `
          <h1>NIC.BN管理员登录验证</h1>
          <p>您的一次性登录密码是：</p>
          <p style="font-size: 24px; font-weight: bold; padding: 10px; background-color: #f0f0f0; border-radius: 4px; text-align: center;">${oneTimePassword}</p>
          <p>此密码将在10分钟后失效。请不要将此密码分享给任何人。</p>
        `;
        break;

      case "verification_approved":
        subject = "NIC.BN - 域名验证已通过";
        htmlContent = `
          <h1>域名验证已通过</h1>
          <p>恭喜！您的域名 <strong>${data.domain || 'nic.bn'}</strong> 已成功通过验证。</p>
          <p>您现在可以在我们的平台上出售此域名。</p>
          <p><a href="https://nic.bn/dashboard" style="padding: 10px 20px; background-color: #000; color: white; text-decoration: none; border-radius: 4px;">访问您的控制台</a></p>
        `;
        break;

      case "new_offer":
        subject = "NIC.BN - 您的域名收到新报价";
        htmlContent = `
          <h1>您收到一个新报价</h1>
          <p>您的域名 <strong>${data.domain || ''}</strong> 收到了一个新的报价：</p>
          <p style="font-size: 20px; font-weight: bold;">$${data.amount || '0'}</p>
          <p>请登录您的账户查看详情并回复此报价。</p>
          <p><a href="https://nic.bn/dashboard" style="padding: 10px 20px; background-color: #000; color: white; text-decoration: none; border-radius: 4px;">查看报价</a></p>
        `;
        break;

      case "offer_accepted":
        subject = "NIC.BN - 您的报价已被接受";
        htmlContent = `
          <h1>报价已被接受</h1>
          <p>恭喜！您对域名 <strong>${data.domain || ''}</strong> 的报价已被接受。</p>
          <p>请按照以下步骤完成交易：</p>
          <ol>
            <li>登录您的NIC.BN账户</li>
            <li>前往交易详情页面</li>
            <li>按照说明进行付款</li>
          </ol>
          <p><a href="https://nic.bn/dashboard" style="padding: 10px 20px; background-color: #000; color: white; text-decoration: none; border-radius: 4px;">完成交易</a></p>
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
      from: "NIC.BN <noreply@domain.bf>",
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
