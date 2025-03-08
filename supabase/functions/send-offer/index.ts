
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@1.0.0";

serve(async (req) => {
  try {
    const { domain, offer, email } = await req.json();
    
    // Validate input
    if (!domain || !offer || !email) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Missing required fields" 
        }),
        { 
          headers: { "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    // Send email to user
    const userEmailResponse = await resend.emails.send({
      from: 'noreply@domain.bf',
      to: email,
      subject: `您的域名报价已收到 - ${domain}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #000; background-color: #fff; border: 1px solid #eaeaea; border-radius: 5px;">
          <h1 style="color: #000; text-align: center; margin-bottom: 30px;">您的报价已收到</h1>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="color: #000; margin-top: 0;">报价详情</h2>
            <p style="margin-bottom: 10px;"><strong>域名:</strong> ${domain}</p>
            <p style="margin-bottom: 10px;"><strong>报价金额:</strong> $${offer}</p>
            <p style="margin-bottom: 10px;"><strong>联系邮箱:</strong> ${email}</p>
          </div>
          
          <p style="margin-bottom: 20px;">我们已收到您的报价，我们的团队将尽快审核并与您联系。如有任何疑问，请随时回复此邮件。</p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea;">
            <p style="color: #666; font-size: 14px;">© 2024 域名交易平台. 保留所有权利.</p>
          </div>
        </div>
      `,
    });
    
    // Send email to admin
    const adminEmailResponse = await resend.emails.send({
      from: 'noreply@domain.bf',
      to: '9208522@qq.com',
      subject: `新域名报价 - ${domain}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #000; background-color: #fff; border: 1px solid #eaeaea; border-radius: 5px;">
          <h1 style="color: #000; text-align: center; margin-bottom: 30px;">新域名报价</h1>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="color: #000; margin-top: 0;">报价详情</h2>
            <p style="margin-bottom: 10px;"><strong>域名:</strong> ${domain}</p>
            <p style="margin-bottom: 10px;"><strong>报价金额:</strong> $${offer}</p>
            <p style="margin-bottom: 10px;"><strong>联系邮箱:</strong> ${email}</p>
          </div>
          
          <p style="margin-bottom: 20px;">有用户提交了新的域名报价，请尽快处理。</p>
        </div>
      `,
    });
    
    console.log("User email response:", userEmailResponse);
    console.log("Admin email response:", adminEmailResponse);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Emails sent successfully" 
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "An error occurred while processing your request",
        error: error.message 
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
