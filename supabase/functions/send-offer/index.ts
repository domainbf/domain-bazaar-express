
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
  domainId?: string;
  ownerEmail?: string;
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
      domainId,
      ownerEmail,
      dashboardUrl = "https://domain.bf/user-center?tab=domains"
    }: OfferRequest = await req.json();

    console.log("收到的报价请求数据:", { domain, offer, email, domainOwnerId, ownerEmail });
    
    if (!domain) {
      throw new Error("域名是必填项");
    }
    
    if (!offer) {
      throw new Error("报价金额是必填项");
    }
    
    if (!email) {
      throw new Error("联系邮箱是必填项");
    }

    // Email template for the user (buyer)
    const userEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>您的域名报价已收到</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
            .header { background-color: #000; padding: 30px 20px; text-align: center; }
            .header h1 { color: white; margin: 10px 0 0; font-size: 24px; }
            .content { padding: 30px 20px; }
            .button { display: inline-block; background-color: #000; color: white; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: bold; margin: 25px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #888; background-color: #f5f5f5; }
            .offer-card { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .offer-details { margin-top: 15px; width: 100%; border-collapse: collapse; }
            .offer-details td, .offer-details th { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
            .offer-details th { background-color: #f5f5f5; font-weight: normal; color: #666; width: 40%; }
            .status-waiting { color: #f59e0b; font-weight: bold; }
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
              <h2>🎉 您的报价已提交成功</h2>
              <p>感谢您对 <span class="domain-name">${domain}</span> 的兴趣。我们已收到您 <strong>$${offer}</strong> 的报价，并已转发给域名所有者。</p>
              
              <div class="offer-card">
                <h3>报价详情:</h3>
                <table class="offer-details">
                  <tr>
                    <th>域名</th>
                    <td><strong>${domain}</strong></td>
                  </tr>
                  <tr>
                    <th>报价金额</th>
                    <td><strong>$${offer}</strong></td>
                  </tr>
                  <tr>
                    <th>状态</th>
                    <td><span class="status-waiting">等待回应</span></td>
                  </tr>
                  ${message ? `<tr>
                    <th>您的留言</th>
                    <td>${message}</td>
                  </tr>` : ''}
                </table>
              </div>
              
              <p>域名所有者将审核您的报价并尽快回复。当他们回应时，您将收到通知。</p>
              <p>如您创建了账户，您可以随时在用户中心查看所有报价记录。</p>
              
              <div style="text-align: center;">
                <a href="${dashboardUrl}" class="button">查看用户中心</a>
              </div>
              
              <p style="margin-top: 30px;">如果您有任何问题，请回复此邮件。</p>
              <p>祝您一切顺利，<br>DomainX 团队</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} DomainX. 保留所有权利.</p>
              <p>您收到此邮件是因为您在 DomainX 平台上提交了域名报价。</p>
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
          <title>您收到了新域名报价</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
            .header { background-color: #000; padding: 30px 20px; text-align: center; }
            .header h1 { color: white; margin: 10px 0 0; font-size: 24px; }
            .content { padding: 30px 20px; }
            .button { display: inline-block; background-color: #000; color: white; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: bold; margin: 25px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #888; background-color: #f5f5f5; }
            .offer-card { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .offer-details { margin-top: 15px; width: 100%; border-collapse: collapse; }
            .offer-details td, .offer-details th { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
            .offer-details th { background-color: #f5f5f5; font-weight: normal; color: #666; width: 40%; }
            .highlight { color: #10b981; font-weight: bold; font-size: 24px; }
            .domain-name { font-weight: bold; }
            .actions { text-align: center; margin: 30px 0; }
            p { margin: 16px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>DomainX</h1>
            </div>
            <div class="content">
              <h2>💰 您收到了新域名报价</h2>
              <p>您的域名 <span class="domain-name">${domain}</span> 收到了一个新的报价。</p>
              
              <div class="offer-card">
                <h3>报价详情:</h3>
                <table class="offer-details">
                  <tr>
                    <th>域名</th>
                    <td><strong>${domain}</strong></td>
                  </tr>
                  <tr>
                    <th>报价金额</th>
                    <td><span class="highlight">$${offer}</span></td>
                  </tr>
                  <tr>
                    <th>买家邮箱</th>
                    <td>${email}</td>
                  </tr>
                  ${message ? `<tr>
                    <th>买家留言</th>
                    <td>${message}</td>
                  </tr>` : ''}
                  <tr>
                    <th>买家账户</th>
                    <td>${buyerId ? `注册用户` : `访客`}</td>
                  </tr>
                  <tr>
                    <th>报价时间</th>
                    <td>${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</td>
                  </tr>
                </table>
              </div>
              
              <p>您可以通过登录控制面板来回应此报价。我们建议您尽快回复以提高成交几率。</p>
              
              <div class="actions">
                <a href="${dashboardUrl}" class="button">在控制面板查看</a>
              </div>
              
              <p>如需帮助或有任何疑问，请随时联系我们的支持团队。</p>
              <p>祝您生意兴隆，<br>DomainX 团队</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} DomainX. 保留所有权利.</p>
              <p>您收到此邮件是因为您是域名 ${domain} 的持有者。</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send confirmation email to the user/buyer
    const userEmailResponse = await resend.emails.send({
      from: "DomainX <noreply@domain.bf>",
      to: [email],
      subject: `您对 ${domain} 的报价已收到`,
      html: userEmailHtml,
    });

    console.log("用户邮件已发送:", userEmailResponse);

    // Determine admin/seller email
    let adminEmail = "admin@example.com"; // Default fallback
    
    // Try to use the email provided directly first
    if (ownerEmail) {
      adminEmail = ownerEmail;
    } 
    // If no email provided but we have domainOwnerId, try to fetch from database
    else if (domainOwnerId) {
      try {
        // Create Supabase client to fetch owner email
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Fetch the domain owner's email from the profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('contact_email')
          .eq('id', domainOwnerId)
          .single();
        
        if (!profileError && profileData?.contact_email) {
          adminEmail = profileData.contact_email;
        }
      } catch (error) {
        console.error("获取域名所有者邮箱时出错:", error);
        // Continue with default admin email
      }
    }

    // Send notification email to the domain owner or admin
    const adminEmailResponse = await resend.emails.send({
      from: "DomainX <noreply@domain.bf>",
      to: [adminEmail],
      subject: `${domain} 的新报价: $${offer}`,
      html: adminEmailHtml,
    });

    console.log("管理员邮件已发送:", adminEmailResponse);

    // If we have domainId and buyerId, also send through the notification function
    if (domainId && buyerId) {
      try {
        // Create notification for in-app notification system
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'new_offer',
            recipient: adminEmail,
            data: { 
              domain,
              amount: offer,
              buyer_email: email,
              message: message || ''
            }
          }
        });
      } catch (notifError) {
        console.error("发送通知时出错:", notifError);
        // Continue even if notification fails
      }
    }

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
      JSON.stringify({ error: error.message || "提交报价失败" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
