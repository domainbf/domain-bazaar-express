
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
  domainId?: string;
  domainOwnerId?: string;
  ownerEmail?: string;
  captchaToken: string;
  dashboardUrl?: string;
}

interface VerifyCaptchaResponse {
  success: boolean;
  error?: string;
}

// Verify hCaptcha token
async function verifyCaptcha(token: string): Promise<boolean> {
  // In production, use your actual secret key
  // const secretKey = Deno.env.get("HCAPTCHA_SECRET_KEY");
  const secretKey = "0x0000000000000000000000000000000000000000"; // For testing only
  
  try {
    const response = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secretKey}&response=${token}`,
    });
    
    const data: VerifyCaptchaResponse = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error verifying captcha:", error);
    return false;
  }
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
      domainId,
      domainOwnerId,
      ownerEmail,
      captchaToken,
      dashboardUrl = "https://sale.nic.bn/user-center?tab=domains"
    }: OfferRequest = await req.json();

    console.log("收到的报价请求数据:", { domain, offer, email, domainOwnerId, ownerEmail });
    
    // Verify captcha token
    const isCaptchaValid = await verifyCaptcha(captchaToken);
    if (!isCaptchaValid) {
      throw new Error("人机验证失败，请重试");
    }
    
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
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; margin: 25px 0; transition: transform 0.2s; }
            .button:hover { transform: translateY(-2px); }
            .footer { text-align: center; padding: 30px; font-size: 14px; color: #888; background-color: #f8f9fa; }
            .logo { font-size: 16px; opacity: 0.8; }
            .offer-card { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 10px; margin: 25px 0; border: 2px solid #0ea5e9; }
            .offer-details { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .offer-details table { width: 100%; border-collapse: collapse; }
            .offer-details td, .offer-details th { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            .offer-details th { background-color: #f1f5f9; font-weight: normal; color: #64748b; width: 40%; }
            .status-waiting { color: #f59e0b; font-weight: bold; }
            .domain-name { font-weight: bold; color: #1e40af; font-size: 20px; }
            .price { font-size: 24px; font-weight: bold; color: #10b981; }
            h2 { color: #333; margin-bottom: 20px; }
            p { margin: 16px 0; line-height: 1.8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎯 SALE.NIC.BN</div>
              <h1>域名交易平台</h1>
            </div>
            <div class="content">
              <h2>🎉 您的报价已提交成功</h2>
              <p>感谢您对 <span class="domain-name">${domain}</span> 的兴趣。我们已收到您的报价，并已转发给域名所有者。</p>
              
              <div class="offer-card">
                <div style="text-align: center;">
                  <div class="domain-name">${domain}</div>
                  <div class="price">$${offer}</div>
                </div>
              </div>
              
              <div class="offer-details">
                <h3>📋 报价详情</h3>
                <table>
                  <tr>
                    <th>🌐 域名</th>
                    <td><strong>${domain}</strong></td>
                  </tr>
                  <tr>
                    <th>💰 报价金额</th>
                    <td><strong>$${offer}</strong></td>
                  </tr>
                  <tr>
                    <th>📊 状态</th>
                    <td><span class="status-waiting">⏳ 等待回应</span></td>
                  </tr>
                  <tr>
                    <th>⏰ 提交时间</th>
                    <td>${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</td>
                  </tr>
                  ${message ? `<tr>
                    <th>💬 您的留言</th>
                    <td>${message}</td>
                  </tr>` : ''}
                </table>
              </div>
              
              <p>✅ <strong>下一步：</strong>域名所有者将审核您的报价并尽快回复。当他们回应时，您将收到邮件通知。</p>
              <p>💡 <strong>建议：</strong>如您创建了账户，可以随时在用户中心查看所有报价记录和状态更新。</p>
              
              <div style="text-align: center;">
                <a href="${dashboardUrl}" class="button">🔍 查看用户中心</a>
              </div>
              
              <p style="margin-top: 30px;">如果您有任何问题，请回复此邮件或联系我们的客服团队。</p>
              <p>祝您交易成功！<br><strong>域名交易平台团队</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Sale.nic.bn 域名交易平台 - 保留所有权利</p>
              <p>您收到此邮件是因为您在 Sale.nic.bn 平台上提交了域名报价</p>
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
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; margin: 25px 0; transition: transform 0.2s; }
            .button:hover { transform: translateY(-2px); }
            .footer { text-align: center; padding: 30px; font-size: 14px; color: #888; background-color: #f8f9fa; }
            .logo { font-size: 16px; opacity: 0.8; }
            .offer-card { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 25px; border-radius: 10px; margin: 25px 0; border: 2px solid #10b981; }
            .offer-details { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .offer-details table { width: 100%; border-collapse: collapse; }
            .offer-details td, .offer-details th { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            .offer-details th { background-color: #f1f5f9; font-weight: normal; color: #64748b; width: 40%; }
            .highlight { color: #10b981; font-weight: bold; font-size: 28px; text-align: center; }
            .domain-name { font-weight: bold; color: #1e40af; font-size: 20px; }
            .actions { text-align: center; margin: 30px 0; }
            h2 { color: #333; margin-bottom: 20px; }
            p { margin: 16px 0; line-height: 1.8; }
            .urgent { background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">💰 SALE.NIC.BN</div>
              <h1>新的域名报价</h1>
            </div>
            <div class="content">
              <h2>🚀 恭喜！您收到了新的域名报价</h2>
              <p>您的域名 <span class="domain-name">${domain}</span> 收到了一个很有竞争力的报价！</p>
              
              <div class="offer-card">
                <h3 style="margin-top: 0; color: #059669; text-align: center;">💎 新报价详情</h3>
                <div class="highlight">$${offer}</div>
                <p style="text-align: center; margin: 10px 0; color: #059669;"><strong>域名：${domain}</strong></p>
              </div>
              
              <div class="offer-details">
                <table>
                  <tr>
                    <th>🌐 域名</th>
                    <td><strong>${domain}</strong></td>
                  </tr>
                  <tr>
                    <th>💰 报价金额</th>
                    <td><span style="color: #10b981; font-weight: bold; font-size: 18px;">$${offer}</span></td>
                  </tr>
                  <tr>
                    <th>📧 买家邮箱</th>
                    <td><a href="mailto:${email}" style="color: #3b82f6;">${email}</a></td>
                  </tr>
                  <tr>
                    <th>👤 买家身份</th>
                    <td>${buyerId ? `✅ 注册用户` : `👤 访客用户`}</td>
                  </tr>
                  <tr>
                    <th>⏰ 报价时间</th>
                    <td>${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</td>
                  </tr>
                  ${message ? `<tr>
                    <th>💬 买家留言</th>
                    <td style="font-style: italic; background-color: #f0f9ff; padding: 10px; border-radius: 4px;">"${message}"</td>
                  </tr>` : ''}
                </table>
              </div>
              
              <div class="urgent">
                <p><strong>⚡ 行动建议：</strong></p>
                <ul style="margin: 10px 0;">
                  <li>📈 <strong>快速回复</strong>可以提高成交几率</li>
                  <li>💡 考虑买家的诚意和报价合理性</li>
                  <li>🤝 友好沟通有助于达成共识</li>
                </ul>
              </div>
              
              <p>您可以通过控制面板快速回应此报价，接受、拒绝或提出反报价：</p>
              
              <div class="actions">
                <a href="${dashboardUrl}" class="button">💼 立即查看和回复</a>
              </div>
              
              <p>感谢您选择我们的域名交易平台。如需任何协助，我们的客服团队随时为您服务！</p>
              <p>祝您交易成功！<br><strong>域名交易平台团队</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Sale.nic.bn 域名交易平台 - 保留所有权利</p>
              <p>您收到此邮件是因为您是域名 ${domain} 的持有者</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send confirmation email to the user/buyer
    const userEmailResponse = await resend.emails.send({
      from: "域名交易平台 <noreply@sale.nic.bn>",
      to: [email],
      subject: `✅ 您对 ${domain} 的报价已收到 - $${offer}`,
      html: userEmailHtml,
    });

    console.log("用户邮件已发送:", userEmailResponse);

    // Determine admin/seller email
    let adminEmail = "admin@sale.nic.bn"; // Default fallback
    
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
      from: "域名交易平台 <noreply@sale.nic.bn>",
      to: [adminEmail],
      subject: `💰 ${domain} 收到新报价：$${offer}`,
      html: adminEmailHtml,
    });

    console.log("域名所有者邮件已发送:", adminEmailResponse);

    // Create in-app notification for the domain owner if we have domainId and domainOwnerId
    if (domainId && domainOwnerId) {
      try {
        // Create Supabase client for creating notification
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Create in-app notification for domain owner
        await supabase.from('notifications').insert({
          user_id: domainOwnerId,
          title: '💰 新的域名报价',
          message: `您的域名 ${domain} 收到了 $${offer} 的新报价`,
          type: 'offer',
          related_id: domainId,
          action_url: '/user-center?tab=transactions'
        });
        
        // If buyer is registered, also create notification for them
        if (buyerId) {
          await supabase.from('notifications').insert({
            user_id: buyerId,
            title: '✅ 报价提交成功',
            message: `您对域名 ${domain} 的 $${offer} 报价已成功发送给卖家`,
            type: 'offer',
            related_id: domainId,
            action_url: '/user-center?tab=transactions'
          });
        }
      } catch (notifError) {
        console.error("创建通知时出错:", notifError);
        // Continue even if notification creation fails
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "报价提交成功，邮件通知已发送",
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
