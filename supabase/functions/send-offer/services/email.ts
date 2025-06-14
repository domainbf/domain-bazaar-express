import { OfferRequest } from '../utils/types.ts';
import { sendMailWithResend } from '../../utils/sendMailWithResend.ts';

function getUserEmailHtml(domain: string, offer: string, message: string | undefined, dashboardUrl: string): string {
  return `
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
            .button { display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; margin: 25px 0; transition: all 0.2s; text-shadow: 0 1px 2px rgba(0,0,0,0.1); box-shadow: 0 2px 4px rgba(5,150,105,0.3); }
            .button:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(5,150,105,0.4); }
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
              <div class="logo">🎯 域名交易平台</div>
              <h1>域名交易平台</h1>
            </div>
            <div class="content">
              <h2>🎉 您的报价已提交成功</h2>
              <p>感谢您对 <span class="domain-name">${domain}</span> 的兴趣。我们已收到您的报价，并已转发给域名所有者。</p>
              
              <div class="offer-card">
                <div style="text-align: center;">
                  <div class="domain-name">${domain}</div>
                  <div class="price">¥${offer}</div>
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
                    <td><strong>¥${offer}</strong></td>
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
              <p>© ${new Date().getFullYear()} 域名交易平台 - 保留所有权利</p>
              <p>您收到此邮件是因为您在 域名交易平台 平台上提交了域名报价</p>
            </div>
          </div>
        </body>
      </html>
    `;
}

function getOwnerEmailHtml(domain: string, offer: string, email: string, message: string | undefined, buyerId: string | null | undefined, dashboardUrl: string): string {
  return `
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
            .button { display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; margin: 25px 0; transition: all 0.2s; text-shadow: 0 1px 2px rgba(0,0,0,0.1); box-shadow: 0 2px 4px rgba(5,150,105,0.3); }
            .button:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(5,150,105,0.4); }
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
              <div class="logo">💰 域名交易平台</div>
              <h1>新的域名报价</h1>
            </div>
            <div class="content">
              <h2>🚀 恭喜！您收到了新的域名报价</h2>
              <p>您的域名 <span class="domain-name">${domain}</span> 收到了一个很有竞争力的报价！</p>
              
              <div class="offer-card">
                <h3 style="margin-top: 0; color: #059669; text-align: center;">💎 新报价详情</h3>
                <div class="highlight">¥${offer}</div>
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
                    <td><span style="color: #10b981; font-weight: bold; font-size: 18px;">¥${offer}</span></td>
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
              <p>© ${new Date().getFullYear()} 域名交易平台 - 保留所有权利</p>
              <p>您收到此邮件是因为您是域名 ${domain} 的持有者</p>
            </div>
          </div>
        </body>
      </html>
    `;
}

export async function sendOfferEmails({
  domain,
  offer,
  email,
  message,
  buyerId,
  dashboardUrl,
  domainOwnerEmail,
}: OfferRequest & { domainOwnerEmail: string }) {
  const finalDashboardUrl = dashboardUrl || "https://sale.nic.bn/user-center?tab=domains";

  const userEmailHtml = getUserEmailHtml(domain, offer, message, finalDashboardUrl);
  const ownerEmailHtml = getOwnerEmailHtml(domain, offer, email, message, buyerId, finalDashboardUrl);

  const from = "域名交易平台 <noreply@sale.nic.bn>";

  // The new utility will throw a detailed error on failure, which is caught by the main function.
  const userEmailResponse = await sendMailWithResend(
    email,
    `✅ 您对 ${domain} 的报价已收到 - ¥${offer}`,
    userEmailHtml,
    { from }
  );

  const ownerEmailResponse = await sendMailWithResend(
    domainOwnerEmail,
    `💰 ${domain} 收到新报价：¥${offer}`,
    ownerEmailHtml,
    { from }
  );

  return { userEmailResponse, ownerEmailResponse };
}

// 解析 Resend 常见报错，返回中文友好提示
function getResendErrorMessage(errorObj: any): string {
  if (!errorObj) return "未知错误";
  // 典型错误模式
  if (typeof errorObj === "object" && errorObj.message) {
    if (/Domain not verified/i.test(errorObj.message)) {
      return "发件域名未验证，请至 Resend 域名认证页面确认已通过";
    }
    if (/Invalid API key/i.test(errorObj.message)) {
      return "API Key 无效，请确认在 Supabase Secrets 配置的密钥正确有效";
    }
    if (/Blocked sender/i.test(errorObj.message)) {
      return "发件人邮箱未被允许，请在 Resend 的发件人设置页面进行添加和认证";
    }
    if (/Mailbox unavailable/i.test(errorObj.message)) {
      return "目标邮箱地址不可用或格式错误";
    }
    return errorObj.message;
  }
  return typeof errorObj === "string" ? errorObj : JSON.stringify(errorObj);
}
