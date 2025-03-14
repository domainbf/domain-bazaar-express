
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OfferRequest {
  domain: string;
  offer: string;
  email: string;
  message?: string;
  buyerId?: string | null;
  domainOwnerId?: string;
  dashboardUrl?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      domain, 
      offer, 
      email, 
      message = "", 
      buyerId = null,
      domainOwnerId,
      dashboardUrl = "https://domain.bf/user-center?tab=domains"
    }: OfferRequest = await req.json();

    // Email template for the user (buyer)
    const userEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>您的域名报价已收到</title>
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
              <h1>您的报价已提交</h1>
            </div>
            <div class="content">
              <p>尊敬的域名买家,</p>
              <p>感谢您对 <strong>${domain}</strong> 的兴趣。我们已收到您 <strong>$${offer}</strong> 的报价，并已转发给域名所有者。</p>
              
              <div class="details">
                <h3>报价详情:</h3>
                <p><strong>域名:</strong> ${domain}</p>
                <p><strong>报价金额:</strong> $${offer}</p>
                ${message ? `<p><strong>您的留言:</strong> ${message}</p>` : ''}
              </div>
              
              <p>域名所有者将审核您的报价并尽快回复。当他们回应时，您将收到通知。</p>
              <p>如果您有任何问题，请回复此邮件。</p>
              <p>最好的祝福,<br>DomainX 团队</p>
            </div>
            <div class="footer">
              <p>© 2024 DomainX. 保留所有权利.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Email template for the admin/seller
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>收到新域名报价</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #000; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; border: 1px solid #eaeaea; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 4px; }
            .cta { background-color: #000; color: white; display: inline-block; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>新域名报价</h1>
            </div>
            <div class="content">
              <p>您好，域名所有者,</p>
              <p>您的域名 <strong>${domain}</strong> 收到了新报价。</p>
              
              <div class="details">
                <h3>报价详情:</h3>
                <p><strong>域名:</strong> ${domain}</p>
                <p><strong>报价金额:</strong> $${offer}</p>
                <p><strong>买家邮箱:</strong> ${email}</p>
                ${message ? `<p><strong>买家留言:</strong> ${message}</p>` : ''}
                ${buyerId ? `<p><strong>买家账户:</strong> 注册用户</p>` : `<p><strong>买家账户:</strong> 访客</p>`}
              </div>
              
              <p>您可以通过登录控制面板回应此报价。如果您选择接受此报价，请使用提供的电子邮件地址联系买家安排域名转移和付款。</p>
              <a href="${dashboardUrl}" class="cta" style="color: white;">在控制面板查看</a>
              <p>最好的祝福,<br>DomainX 团队</p>
            </div>
            <div class="footer">
              <p>© 2024 DomainX. 保留所有权利.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send confirmation email to the user/buyer
    const userEmailResponse = await resend.emails.send({
      from: "DomainX <no-reply@domain.bf>",
      to: [email],
      subject: `您对 ${domain} 的报价已收到`,
      html: userEmailHtml,
    });

    console.log("用户邮件已发送:", userEmailResponse);

    // Determine admin email based on domainOwnerId or fallback to default
    let adminEmail = "admin@example.com";
    
    if (domainOwnerId) {
      try {
        // Fetch the domain owner's email from the profiles table
        const profileResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/profiles?id=eq.${domainOwnerId}&select=email`, {
          headers: {
            "Content-Type": "application/json",
            "apikey": Deno.env.get("SUPABASE_ANON_KEY") || "",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
          }
        });
        
        const profileData = await profileResponse.json();
        if (profileData && profileData.length > 0 && profileData[0].email) {
          adminEmail = profileData[0].email;
        }
      } catch (error) {
        console.error("获取域名所有者邮箱时出错:", error);
        // Continue with default admin email
      }
    }

    // Send notification email to the domain owner or admin
    const adminEmailResponse = await resend.emails.send({
      from: "DomainX <no-reply@domain.bf>",
      to: [adminEmail],
      subject: `${domain} 的新报价: $${offer}`,
      html: adminEmailHtml,
    });

    console.log("管理员邮件已发送:", adminEmailResponse);

    return new Response(
      JSON.stringify({ 
        message: "报价提交成功",
        userEmail: userEmailResponse,
        adminEmail: adminEmailResponse
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
    console.error("send-offer函数中的错误:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
