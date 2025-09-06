import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OfferNotificationRequest {
  domain: string;
  offer: number;
  email: string;
  message: string;
  buyerId: string;
  dashboardUrl: string;
  domainOwnerEmail?: string | null;
}

// 买家确认邮件模板
function getBuyerConfirmationHtml(data: OfferNotificationRequest): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>报价提交成功 | Offer Submitted Successfully</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">✅ 报价提交成功</h1>
          <h2 style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px; font-weight: 400;">Offer Submitted Successfully</h2>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h3 style="font-size: 20px; color: #1f2937; margin: 0 0 20px 0;">您的域名报价已成功发送！</h3>
            <p style="font-size: 14px; color: #6b7280; margin: 0;">Your domain offer has been sent successfully!</p>
          </div>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin: 30px 0;">
            <h4 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px;">📋 报价详情 | Offer Details</h4>
            <div style="margin: 15px 0;">
              <strong style="color: #374151;">域名 | Domain:</strong> <span style="color: #1f2937; font-weight: 600;">${data.domain}</span>
            </div>
            <div style="margin: 15px 0;">
              <strong style="color: #374151;">报价金额 | Offer Amount:</strong> <span style="color: #059669; font-weight: 600; font-size: 18px;">¥${data.offer.toLocaleString()}</span>
            </div>
            <div style="margin: 15px 0;">
              <strong style="color: #374151;">联系邮箱 | Contact Email:</strong> <span style="color: #1f2937;">${data.email}</span>
            </div>
            ${data.message ? `
            <div style="margin: 15px 0;">
              <strong style="color: #374151;">留言 | Message:</strong>
              <div style="background: white; padding: 15px; border-radius: 6px; margin-top: 8px; border-left: 4px solid #10b981;">
                <p style="margin: 0; color: #374151; font-style: italic;">"${data.message}"</p>
              </div>
            </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.dashboardUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              查看报价状态 | Check Offer Status
            </a>
          </div>
          
          <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h4 style="margin: 0 0 10px 0; color: #d97706; font-size: 16px;">📌 下一步 | Next Steps</h4>
            <p style="margin: 0; font-size: 14px; color: #92400e;">域名所有者将会收到您的报价通知，我们会在有回复时第一时间通知您。</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #92400e;">The domain owner will receive your offer notification, and we'll notify you as soon as there's a response.</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 15px 0; font-size: 14px; color: #6b7280;">
            此邮件由 <strong>NIC.BN 域名交易平台</strong> 发送<br>
            This email was sent by <strong>NIC.BN Domain Trading Platform</strong>
          </p>
          <div style="margin: 15px 0;">
            <a href="mailto:support@nic.bn" style="color: #1f2937; text-decoration: none; margin: 0 10px;">📧 联系我们 | Contact Us</a>
            <a href="https://nic.bn" style="color: #1f2937; text-decoration: none; margin: 0 10px;">🌐 访问网站 | Visit Website</a>
          </div>
          <p style="margin: 15px 0 0 0; font-size: 12px; color: #9ca3af;">
            © 2024 NIC.BN 域名交易平台. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 域名所有者通知邮件模板
function getOwnerNotificationHtml(data: OfferNotificationRequest): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>新的域名报价 | New Domain Offer</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">💰 新的域名报价</h1>
          <h2 style="color: #fed7aa; margin: 10px 0 0 0; font-size: 16px; font-weight: 400;">New Domain Offer Received</h2>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h3 style="font-size: 20px; color: #1f2937; margin: 0 0 20px 0;">您收到了一个新的域名购买报价！</h3>
            <p style="font-size: 14px; color: #6b7280; margin: 0;">You have received a new domain purchase offer!</p>
          </div>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin: 30px 0;">
            <h4 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px;">📋 报价详情 | Offer Details</h4>
            <div style="margin: 15px 0;">
              <strong style="color: #374151;">域名 | Domain:</strong> <span style="color: #1f2937; font-weight: 600;">${data.domain}</span>
            </div>
            <div style="margin: 15px 0;">
              <strong style="color: #374151;">报价金额 | Offer Amount:</strong> <span style="color: #d97706; font-weight: 600; font-size: 24px;">¥${data.offer.toLocaleString()}</span>
            </div>
            <div style="margin: 15px 0;">
              <strong style="color: #374151;">买家邮箱 | Buyer Email:</strong> <span style="color: #1f2937;">${data.email}</span>
            </div>
            ${data.message ? `
            <div style="margin: 15px 0;">
              <strong style="color: #374151;">买家留言 | Buyer Message:</strong>
              <div style="background: white; padding: 15px; border-radius: 6px; margin-top: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #374151; font-style: italic;">"${data.message}"</p>
              </div>
            </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.dashboardUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 10px 10px 0;">
              立即回复报价 | Respond to Offer
            </a>
            <a href="mailto:${data.email}" 
               style="display: inline-block; background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 10px 10px 0;">
              直接联系买家 | Contact Buyer
            </a>
          </div>
          
          <div style="background: #dcfce7; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h4 style="margin: 0 0 10px 0; color: #166534; font-size: 16px;">🎯 处理建议 | Recommendations</h4>
            <p style="margin: 0; font-size: 14px; color: #166534;">建议尽快回复买家的报价，无论是接受、拒绝还是提出反报价，及时的沟通有助于促成交易。</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #166534;">We recommend responding to the buyer's offer promptly, whether accepting, declining, or making a counter-offer.</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 15px 0; font-size: 14px; color: #6b7280;">
            此邮件由 <strong>NIC.BN 域名交易平台</strong> 发送<br>
            This email was sent by <strong>NIC.BN Domain Trading Platform</strong>
          </p>
          <div style="margin: 15px 0;">
            <a href="mailto:support@nic.bn" style="color: #1f2937; text-decoration: none; margin: 0 10px;">📧 联系我们 | Contact Us</a>
            <a href="https://nic.bn" style="color: #1f2937; text-decoration: none; margin: 0 10px;">🌐 访问网站 | Visit Website</a>
          </div>
          <p style="margin: 15px 0 0 0; font-size: 12px; color: #9ca3af;">
            © 2024 NIC.BN 域名交易平台. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const data: OfferNotificationRequest = await req.json();
    
    console.log('Processing offer notification:', data);

    // 发送买家确认邮件
    const buyerEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to: data.email,
        subject: `✅ 报价提交成功：${data.domain} - ¥${data.offer.toLocaleString()} | Offer submitted successfully`,
        html: getBuyerConfirmationHtml(data),
        from: "NIC.BN 域名交易平台 <noreply@sale.nic.bn>"
      }),
    });

    if (!buyerEmailResponse.ok) {
      console.error('Failed to send buyer confirmation email');
    }

    // 如果有域名所有者邮箱，发送通知邮件
    if (data.domainOwnerEmail) {
      const ownerEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          to: data.domainOwnerEmail,
          subject: `💰 新的域名报价：${data.domain} - 买家出价 ¥${data.offer.toLocaleString()} | New offer for ${data.domain}`,
          html: getOwnerNotificationHtml(data),
          from: "NIC.BN 域名交易平台 <noreply@sale.nic.bn>"
        }),
      });

      if (!ownerEmailResponse.ok) {
        console.error('Failed to send owner notification email');
      }
    }

    console.log('Offer notification emails sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Offer notification emails sent successfully'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in send-offer-notification function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send offer notification',
        success: false
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);