
import { emailStyles } from "./emailStyles.ts";

export const getNewOfferHtml = (data: { domain: string; amount: number; buyer_email: string; message?: string }, baseUrl: string) => `
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>新的域名报价 - NIC.BN</title>
    ${emailStyles}
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <div class="logo">💰 NIC.BN</div>
        <div class="tagline">域名交易通知</div>
      </div>
      
      <div class="content">
        <h1 class="title">🎉 恭喜！您收到新的域名报价</h1>
        <p class="subtitle">有买家对您的域名很感兴趣</p>
        
        <div class="info-card" style="text-align: center; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-left-color: #10b981;">
          <div class="domain-name">${data.domain}</div>
          <div class="price-display">$${data.amount.toLocaleString()}</div>
          <span class="status-badge status-success">新报价</span>
        </div>
        
        <table class="details-table">
          <tr>
            <td>📧 买家邮箱</td>
            <td>${data.buyer_email}</td>
          </tr>
          <tr>
            <td>💵 报价金额</td>
            <td><strong style="color: #059669;">$${data.amount.toLocaleString()}</strong></td>
          </tr>
          <tr>
            <td>⏰ 报价时间</td>
            <td>${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</td>
          </tr>
          ${data.message ? `
          <tr>
            <td>💬 买家留言</td>
            <td style="font-style: italic; color: #4b5563;">"${data.message}"</td>
          </tr>` : ''}
        </table>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${baseUrl}/user-center?tab=transactions" class="button">
            💼 查看和回复报价
          </a>
        </div>
        
        <div class="highlight-box">
          <h3 style="margin-bottom: 12px;">🚀 快速回复提示：</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>及时回复可提高成交机会</li>
            <li>您可以接受、拒绝或提出反报价</li>
            <li>专业的沟通有助于建立信任</li>
          </ul>
        </div>
        
        <div class="divider"></div>
        
        <p style="color: #6b7280;">感谢您使用 NIC.BN 平台进行域名交易。我们致力于为您提供安全、高效的交易环境！</p>
        
        <p style="margin-top: 32px;">
          祝交易顺利！<br>
          <strong style="color: #667eea;">NIC.BN 交易团队</strong>
        </p>
      </div>
      
      <div class="footer">
        <div class="social-links">
          <a href="#">交易指南</a> | 
          <a href="#">手续费说明</a> | 
          <a href="#">客服支持</a>
        </div>
        <p>© ${new Date().getFullYear()} NIC.BN Ltd. 版权所有</p>
        <p style="margin-top: 8px; font-size: 12px;">
          您收到此邮件是因为您是域名 <strong>${data.domain}</strong> 的持有者
        </p>
      </div>
    </div>
  </body>
</html>
`;
