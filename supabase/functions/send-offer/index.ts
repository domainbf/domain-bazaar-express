
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

// Initialize Resend with API key from environment variables
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Admin email for notifications
const ADMIN_EMAIL = "9208522@qq.com";

interface OfferRequest {
  domain: string;
  offer: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, offer, email }: OfferRequest = await req.json();
    
    console.log("Received offer request:", { domain, offer, email });
    
    // Validate required fields
    if (!domain || !offer || !email) {
      throw new Error("Missing required fields");
    }

    // Send admin notification email
    console.log("Sending admin notification email to:", ADMIN_EMAIL);
    try {
      const adminEmailResponse = await resend.emails.send({
        from: "Domain Sales <offers@domain.bf>",
        to: [ADMIN_EMAIL],
        subject: `【新域名报价通知】${domain}`,
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1e293b, #312e81); color: #fff; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #a78bfa; margin-bottom: 0;">新域名报价通知</h1>
              <p style="color: #94a3b8; font-size: 14px;">管理员专属通知</p>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #f0abfc; border-bottom: 1px solid rgba(255, 255, 255, 0.2); padding-bottom: 10px; margin-top: 0;">报价详情</h2>
              <div style="margin: 15px 0;">
                <p style="margin: 5px 0; display: flex;"><strong style="width: 100px; color: #a5b4fc;">域名:</strong> <span style="color: #e2e8f0;">${domain}</span></p>
                <p style="margin: 5px 0; display: flex;"><strong style="width: 100px; color: #a5b4fc;">报价金额:</strong> <span style="color: #e2e8f0;">$${offer}</span></p>
                <p style="margin: 5px 0; display: flex;"><strong style="width: 100px; color: #a5b4fc;">联系邮箱:</strong> <span style="color: #e2e8f0;">${email}</span></p>
                <p style="margin: 5px 0; display: flex;"><strong style="width: 100px; color: #a5b4fc;">报价时间:</strong> <span style="color: #e2e8f0;">${new Date().toLocaleString('zh-CN')}</span></p>
              </div>
            </div>
            
            <div style="background: rgba(147, 51, 234, 0.1); border-radius: 8px; padding: 20px;">
              <h3 style="color: #c4b5fd; margin-top: 0;">后续操作</h3>
              <p style="color: #cbd5e1;">请登录管理后台及时处理该报价请求。您可以直接回复客户邮件或通过系统发送回复。</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1); color: #94a3b8; font-size: 12px;">
              <p>此邮件由系统自动发送，请勿直接回复</p>
              <p>© 2023 Domain Sales. 保留所有权利。</p>
            </div>
          </div>
        `,
      });
      console.log("Admin notification email sent:", adminEmailResponse);
    } catch (emailError) {
      console.error("Failed to send admin email:", emailError);
      // Continue even if admin email fails
    }

    // Send user confirmation email
    console.log("Sending confirmation email to user:", email);
    try {
      const userEmailResponse = await resend.emails.send({
        from: "Domain Sales <offers@domain.bf>",
        to: [email],
        subject: `您的域名报价已收到 - ${domain}`,
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a, #4c1d95); color: #fff; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #c4b5fd; margin-bottom: 5px;">感谢您的域名报价！</h1>
              <p style="color: #94a3b8; font-size: 14px;">我们已收到您的请求</p>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #e0aaff; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 10px; margin-top: 0;">您的报价信息</h2>
              <div style="margin: 15px 0;">
                <p style="margin: 8px 0;"><strong style="color: #a5b4fc;">域名:</strong> <span style="color: #e2e8f0; display: inline-block; margin-left: 10px;">${domain}</span></p>
                <p style="margin: 8px 0;"><strong style="color: #a5b4fc;">您的报价:</strong> <span style="color: #e2e8f0; display: inline-block; margin-left: 10px;">$${offer}</span></p>
                <p style="margin: 8px 0;"><strong style="color: #a5b4fc;">提交时间:</strong> <span style="color: #e2e8f0; display: inline-block; margin-left: 10px;">${new Date().toLocaleString('zh-CN')}</span></p>
              </div>
            </div>
            
            <div style="background: rgba(79, 70, 229, 0.1); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #ddd6fe; margin-top: 0;">下一步</h3>
              <p style="color: #cbd5e1; line-height: 1.6;">我们的团队会尽快审核您的报价并与您联系。如果您的报价被接受，我们将指导您完成域名转让的后续步骤。</p>
            </div>
            
            <div style="background: rgba(139, 92, 246, 0.1); border-radius: 8px; padding: 20px;">
              <h3 style="color: #ddd6fe; margin-top: 0;">有疑问？</h3>
              <p style="color: #cbd5e1;">如有任何问题，请随时回复此邮件或联系我们的客服团队。我们很乐意为您提供帮助！</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1); color: #94a3b8; font-size: 12px;">
              <p>感谢您对我们平台的信任与支持</p>
              <p>© 2023 Domain Sales. 保留所有权利。</p>
            </div>
          </div>
        `,
      });
      console.log("User confirmation email sent:", userEmailResponse);
    } catch (emailError) {
      console.error("Failed to send user email:", emailError);
      // Continue even if user email fails
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "报价已成功提交，确认邮件已发送"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-offer function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "提交报价时发生错误",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);
