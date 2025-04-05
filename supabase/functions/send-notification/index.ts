import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailInfo {
  type: string;
  recipient: string;
  data: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: EmailInfo = await req.json();
    const { type, recipient, data } = body;

    // Get Resend API key from env
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set');
    }

    let emailParams: any;

    // Different email types
    switch (type) {
      case 'user_invitation':
        emailParams = {
          from: 'notification@nic.bn',
          to: recipient,
          subject: '您被邀请加入 NIC.BN 平台',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333;">您好 ${data.name || recipient}，</h1>
              <p>您被邀请加入 <strong>NIC.BN</strong> 域名交易平台。</p>
              <p>我们已为您创建了账户，请使用以下临时密码登录：</p>
              <div style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; margin: 20px 0;">
                <p style="font-family: monospace; font-size: 18px;">${data.tempPassword}</p>
              </div>
              <p>首次登录后，请立即修改您的密码。</p>
              <p>点击下面的链接开始使用：</p>
              <a href="${data.resetUrl}" style="background-color: #000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                登录并修改密码
              </a>
              <p>如果您有任何问题，请联系我们的支持团队。</p>
              <p>谢谢，<br>NIC.BN 团队</p>
            </div>
          `
        };
        break;
      
      case 'password_reset':
        emailParams = {
          from: 'notification@nic.bn',
          to: recipient,
          subject: '重置您的 NIC.BN 密码',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333;">您好 ${data.name || recipient}，</h1>
              <p>我们收到了重置您 <strong>NIC.BN</strong> 账户密码的请求。</p>
              <p>点击下面的链接重置您的密码：</p>
              <a href="${data.resetUrl}" style="background-color: #000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                重置密码
              </a>
              <p>如果您没有请求重置密码，请忽略此邮件，您的账户将保持安全。</p>
              <p>此链接将在24小时后过期。</p>
              <p>谢谢，<br>NIC.BN 团队</p>
            </div>
          `
        };
        break;
        
      case 'email_verification':
        emailParams = {
          from: 'notification@nic.bn',
          to: recipient,
          subject: '验证您的 NIC.BN 账户',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333;">您好 ${data.name || recipient}，</h1>
              <p>感谢您注册 <strong>NIC.BN</strong> 域名交易平台。</p>
              <p>请点击下面的链接验证您的电子邮箱地址：</p>
              <a href="${data.verificationUrl}" style="background-color: #000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                验证邮箱
              </a>
              <p>验证邮箱后，您将可以完全访问我们平台的所有功能。</p>
              <p>如果您没有注册账户，请忽略此邮件。</p>
              <p>谢谢，<br>NIC.BN 团队</p>
            </div>
          `
        };
        break;
        
      case 'domain_offer':
        emailParams = {
          from: 'notification@nic.bn',
          to: recipient,
          subject: `您收到了域名 ${data.domainName} 的报价`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333;">您好 ${data.recipientName || recipient}，</h1>
              <p>您收到了域名 <strong>${data.domainName}</strong> 的新报价。</p>
              <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>报价金额:</strong> ¥${data.offerAmount}</p>
                <p><strong>买家:</strong> ${data.buyerName}</p>
                <p><strong>留言:</strong> ${data.message || '无'}</p>
              </div>
              <p>点击下面的链接查看并回应此报价：</p>
              <a href="${data.offerUrl}" style="background-color: #000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                查看报价
              </a>
              <p>此报价将在 ${data.expiresIn || '7天'} 后过期。</p>
              <p>谢谢，<br>NIC.BN 团队</p>
            </div>
          `
        };
        break;
        
      case 'offer_accepted':
        emailParams = {
          from: 'notification@nic.bn',
          to: recipient,
          subject: `您的域名 ${data.domainName} 报价已被接受`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333;">恭喜 ${data.buyerName || recipient}！</h1>
              <p>您对域名 <strong>${data.domainName}</strong> 的报价已被卖家接受。</p>
              <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>报价金额:</strong> ¥${data.offerAmount}</p>
                <p><strong>卖家:</strong> ${data.sellerName}</p>
              </div>
              <p>请点击下面的链接完成支付并获取域名：</p>
              <a href="${data.paymentUrl}" style="background-color: #000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                完成交易
              </a>
              <p>请在 ${data.paymentDeadline || '48小时'} 内完成支付，否则此交易将被取消。</p>
              <p>谢谢，<br>NIC.BN 团队</p>
            </div>
          `
        };
        break;
        
      case 'offer_rejected':
        emailParams = {
          from: 'notification@nic.bn',
          to: recipient,
          subject: `您的域名 ${data.domainName} 报价已被拒绝`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333;">您好 ${data.buyerName || recipient}，</h1>
              <p>很遗憾，您对域名 <strong>${data.domainName}</strong> 的报价已被卖家拒绝。</p>
              <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>报价金额:</strong> ¥${data.offerAmount}</p>
                <p><strong>卖家留言:</strong> ${data.message || '卖家未留言'}</p>
              </div>
              <p>您可以点击下面的链接提交新的报价或浏览其他域名：</p>
              <a href="${data.domainUrl}" style="background-color: #000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                查看域名
              </a>
              <p>谢谢，<br>NIC.BN 团队</p>
            </div>
          `
        };
        break;
        
      case 'domain_verification_success':
        emailParams = {
          from: 'notification@nic.bn',
          to: recipient,
          subject: `域名 ${data.domainName} 验证成功`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333;">您好 ${data.ownerName || recipient}，</h1>
              <p>恭喜！您的域名 <strong>${data.domainName}</strong> 已成功通过验证。</p>
              <p>您现在可以将此域名上架出售。点击下面的链接管理您的域名：</p>
              <a href="${data.domainManagementUrl}" style="background-color: #000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                管理域名
              </a>
              <p>谢谢，<br>NIC.BN 团队</p>
            </div>
          `
        };
        break;
        
      case 'domain_verification_failed':
        emailParams = {
          from: 'notification@nic.bn',
          to: recipient,
          subject: `域名 ${data.domainName} 验证失败`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333;">您好 ${data.ownerName || recipient}，</h1>
              <p>很遗憾，您的域名 <strong>${data.domainName}</strong> 验证失败。</p>
              <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>失败原因:</strong> ${data.reason || '无法验证域名所有权'}</p>
              </div>
              <p>请点击下面的链接重新尝试验证：</p>
              <a href="${data.verificationUrl}" style="background-color: #000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                重新验证
              </a>
              <p>如果您需要帮助，请联系我们的支持团队。</p>
              <p>谢谢，<br>NIC.BN 团队</p>
            </div>
          `
        };
        break;
        
      case 'transaction_completed':
        emailParams = {
          from: 'notification@nic.bn',
          to: recipient,
          subject: `域名 ${data.domainName} 交易已完成`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333;">您好 ${data.recipientName || recipient}，</h1>
              <p>域名 <strong>${data.domainName}</strong> 的交易已成功完成。</p>
              <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>交易金额:</strong> ¥${data.amount}</p>
                <p><strong>交易ID:</strong> ${data.transactionId}</p>
                <p><strong>完成日期:</strong> ${data.completionDate}</p>
              </div>
              <p>点击下面的链接查看交易详情：</p>
              <a href="${data.transactionUrl}" style="background-color: #000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                查看交易
              </a>
              <p>谢谢，<br>NIC.BN 团队</p>
            </div>
          `
        };
        break;
        
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify(emailParams)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(result)}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
