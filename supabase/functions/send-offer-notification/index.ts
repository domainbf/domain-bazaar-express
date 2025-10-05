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
    <html lang="zh-CN">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>报价提交成功 - NIC.BN</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft YaHei', sans-serif; 
          line-height: 1.6; 
          color: #111827; 
          background: #f3f4f6;
          padding: 20px;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: #ffffff; 
          border-radius: 8px; 
          overflow: hidden; 
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .header { 
          background: #111827; 
          padding: 32px 24px; 
          text-align: center; 
        }
        .header h1 { 
          color: white; 
          margin: 0; 
          font-size: 22px; 
          font-weight: 600; 
        }
        .content { 
          padding: 32px 24px; 
        }
        .button { 
          display: inline-block; 
          background: #111827; 
          color: white !important; 
          text-decoration: none; 
          padding: 12px 24px; 
          border-radius: 6px; 
          font-weight: 500; 
          margin: 20px 0; 
        }
        .footer { 
          text-align: center; 
          padding: 24px; 
          font-size: 13px; 
          color: #6b7280; 
          background: #f9fafb; 
          border-top: 1px solid #e5e7eb;
        }
        .offer-card { 
          background: #f9fafb; 
          padding: 24px; 
          border-radius: 6px; 
          margin: 20px 0; 
          border: 1px solid #e5e7eb;
          text-align: center;
        }
        .price { 
          font-size: 32px; 
          font-weight: 700; 
          color: #111827; 
          margin: 16px 0;
        }
        .details { 
          background: #ffffff; 
          padding: 0; 
          border-radius: 6px; 
          margin: 20px 0;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }
        .details table { 
          width: 100%; 
          border-collapse: collapse; 
        }
        .details td, .details th { 
          padding: 12px 16px; 
          text-align: left; 
          border-bottom: 1px solid #f3f4f6; 
        }
        .details tr:last-child td { border-bottom: none; }
        .details th { 
          background: #f9fafb; 
          font-weight: 500; 
          color: #6b7280; 
          width: 30%;
          font-size: 14px;
        }
        .details td {
          color: #111827;
          font-weight: 500;
        }
        .info-box { 
          background: #f9fafb; 
          padding: 16px; 
          border-radius: 6px; 
          border-left: 3px solid #111827; 
          margin: 20px 0; 
        }
        .info-box ul {
          margin: 8px 0;
          padding-left: 20px;
        }
        .info-box li {
          margin: 6px 0;
          color: #374151;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ 报价提交成功</h1>
        </div>
        <div class="content">
          <p style="font-size: 16px; margin-bottom: 20px;">您的域名报价已成功发送给卖家！</p>
          
          <div class="offer-card">
            <div class="price">¥${data.offer.toLocaleString()}</div>
            <p style="color: #6b7280; font-size: 14px;">报价金额</p>
          </div>
          
          <div class="details">
            <table>
              <tr>
                <th>域名</th>
                <td><strong>${data.domain}</strong></td>
              </tr>
              <tr>
                <th>报价金额</th>
                <td style="font-size: 18px; font-weight: 700;">¥${data.offer.toLocaleString()}</td>
              </tr>
              <tr>
                <th>联系邮箱</th>
                <td>${data.email}</td>
              </tr>
              ${data.message ? `<tr>
                <th>您的留言</th>
                <td style="font-style: italic; color: #6b7280;">"${data.message}"</td>
              </tr>` : ''}
            </table>
          </div>
          
          <div class="info-box">
            <p style="margin: 0 0 8px 0;"><strong style="color: #111827;">📌 接下来</strong></p>
            <ul>
              <li>卖家将在 48小时 内回复您的报价</li>
              <li>您可以随时在用户中心查看报价状态</li>
              <li>收到回复后我们会第一时间通知您</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 24px 0;">
            <a href="${data.dashboardUrl}" class="button">查看我的报价</a>
          </div>
          
          <p style="margin-top: 24px; color: #374151;">感谢您使用 NIC.BN 域名交易平台！</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} NIC.BN 域名交易平台</p>
          <div style="margin-top: 12px;">
            <a href="https://nic.bn/help" style="color: #6b7280; text-decoration: none; margin: 0 8px;">帮助中心</a>
            <a href="https://nic.bn/contact" style="color: #6b7280; text-decoration: none; margin: 0 8px;">联系客服</a>
          </div>
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
    <html lang="zh-CN">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>您收到了新域名报价 - NIC.BN</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft YaHei', sans-serif; 
          line-height: 1.6; 
          color: #111827; 
          background: #f3f4f6;
          padding: 20px;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: #ffffff; 
          border-radius: 8px; 
          overflow: hidden; 
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .header { 
          background: #111827; 
          padding: 32px 24px; 
          text-align: center; 
        }
        .header h1 { 
          color: white; 
          margin: 0; 
          font-size: 22px; 
          font-weight: 600; 
        }
        .content { 
          padding: 32px 24px; 
        }
        .button { 
          display: inline-block; 
          background: #111827; 
          color: white !important; 
          text-decoration: none; 
          padding: 12px 24px; 
          border-radius: 6px; 
          font-weight: 500; 
          margin: 8px 4px; 
        }
        .button-secondary {
          background: #6b7280;
        }
        .footer { 
          text-align: center; 
          padding: 24px; 
          font-size: 13px; 
          color: #6b7280; 
          background: #f9fafb; 
          border-top: 1px solid #e5e7eb;
        }
        .offer-card { 
          background: #f9fafb; 
          padding: 24px; 
          border-radius: 6px; 
          margin: 20px 0; 
          border: 1px solid #e5e7eb;
          text-align: center;
        }
        .price { 
          font-size: 32px; 
          font-weight: 700; 
          color: #111827; 
          margin: 16px 0;
        }
        .details { 
          background: #ffffff; 
          padding: 0; 
          border-radius: 6px; 
          margin: 20px 0;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }
        .details table { 
          width: 100%; 
          border-collapse: collapse; 
        }
        .details td, .details th { 
          padding: 12px 16px; 
          text-align: left; 
          border-bottom: 1px solid #f3f4f6; 
        }
        .details tr:last-child td { border-bottom: none; }
        .details th { 
          background: #f9fafb; 
          font-weight: 500; 
          color: #6b7280; 
          width: 30%;
          font-size: 14px;
        }
        .details td {
          color: #111827;
          font-weight: 500;
        }
        .info-box { 
          background: #f9fafb; 
          padding: 16px; 
          border-radius: 6px; 
          border-left: 3px solid #111827; 
          margin: 20px 0; 
        }
        .info-box ul {
          margin: 8px 0;
          padding-left: 20px;
        }
        .info-box li {
          margin: 6px 0;
          color: #374151;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 您收到了新的域名报价</h1>
        </div>
        <div class="content">
          <p style="font-size: 16px; margin-bottom: 20px;">您的域名 <strong>${data.domain}</strong> 收到了一个新的购买报价。</p>
          
          <div class="offer-card">
            <div class="price">¥${data.offer.toLocaleString()}</div>
            <p style="color: #6b7280; font-size: 14px;">买家报价</p>
          </div>
          
          <div class="details">
            <table>
              <tr>
                <th>域名</th>
                <td><strong>${data.domain}</strong></td>
              </tr>
              <tr>
                <th>报价金额</th>
                <td style="font-size: 18px; font-weight: 700;">¥${data.offer.toLocaleString()}</td>
              </tr>
              <tr>
                <th>买家邮箱</th>
                <td><a href="mailto:${data.email}" style="color: #111827; text-decoration: none;">${data.email}</a></td>
              </tr>
              ${data.message ? `<tr>
                <th>买家留言</th>
                <td style="font-style: italic; color: #6b7280;">"${data.message}"</td>
              </tr>` : ''}
            </table>
          </div>
          
          <div class="info-box">
            <p style="margin: 0 0 8px 0;"><strong style="color: #111827;">📌 处理建议</strong></p>
            <ul>
              <li>快速回复可以提高成交机会</li>
              <li>您可以接受报价、拒绝或提出反报价</li>
              <li>建议在 48小时 内给予回复</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 24px 0;">
            <a href="${data.dashboardUrl}" class="button">查看并回复报价</a>
            <a href="mailto:${data.email}" class="button button-secondary">直接联系买家</a>
          </div>
          
          <p style="margin-top: 24px; color: #374151;">感谢您使用 NIC.BN 域名交易平台！</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} NIC.BN 域名交易平台</p>
          <div style="margin-top: 12px;">
            <a href="https://nic.bn/help" style="color: #6b7280; text-decoration: none; margin: 0 8px;">帮助中心</a>
            <a href="https://nic.bn/contact" style="color: #6b7280; text-decoration: none; margin: 0 8px;">联系客服</a>
          </div>
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
        subject: `报价提交成功：${data.domain} - ¥${data.offer.toLocaleString()}`,
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
          subject: `新的域名报价：${data.domain} - 买家出价 ¥${data.offer.toLocaleString()}`,
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