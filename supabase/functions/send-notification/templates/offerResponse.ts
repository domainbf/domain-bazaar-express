
import { emailStyles } from "./emailStyles.ts";

export const getOfferResponseHtml = (data: { domain: string; amount: number; response: string; counter_offer?: number }, baseUrl: string) => `
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>报价回复 - NIC.BN</title>
    ${emailStyles}
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <div class="logo">📬 NIC.BN</div>
        <div class="tagline">交易进展通知</div>
      </div>
      
      <div class="content">
        <h1 class="title">📨 您的域名报价有新回复</h1>
        <p class="subtitle">卖家已回复您的报价，请查看详情</p>
        
        <div class="info-card" style="text-align: center; background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); border-left-color: #f59e0b;">
          <div class="domain-name">${data.domain}</div>
          <span class="status-badge status-warning">卖家已回复</span>
        </div>
        
        <table class="details-table">
          <tr>
            <td>🌐 域名</td>
            <td><strong>${data.domain}</strong></td>
          </tr>
          <tr>
            <td>💰 您的报价</td>
            <td><strong>$${data.amount.toLocaleString()}</strong></td>
          </tr>
          <tr>
            <td>📝 卖家回复</td>
            <td><span class="status-badge ${data.response === 'accepted' ? 'status-success' : data.response === 'rejected' ? 'status-warning' : 'status-info'}">${data.response}</span></td>
          </tr>
          ${data.counter_offer ? `
          <tr>
            <td>💵 卖家反报价</td>
            <td><strong style="color: #059669; font-size: 18px;">$${data.counter_offer.toLocaleString()}</strong></td>
          </tr>` : ''}
        </table>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${baseUrl}/user-center?tab=transactions" class="button">
            💼 查看完整交易详情
          </a>
        </div>
        
        <div class="highlight-box">
          <h3 style="margin-bottom: 12px;">📋 下一步操作：</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>登录账户查看完整回复内容</li>
            <li>如有反报价，请及时考虑回应</li>
            <li>可继续与卖家进行友好协商</li>
          </ul>
        </div>
        
        <div class="divider"></div>
        
        <p style="color: #6b7280;">感谢您使用 NIC.BN 进行域名交易。我们的托管服务确保交易安全可靠！</p>
        
        <p style="margin-top: 32px;">
          祝您交易愉快！<br>
          <strong style="color: #667eea;">NIC.BN 交易团队</strong>
        </p>
      </div>
      
      <div class="footer">
        <div class="social-links">
          <a href="#">交易帮助</a> | 
          <a href="#">争议解决</a> | 
          <a href="#">联系客服</a>
        </div>
        <p>© ${new Date().getFullYear()} NIC.BN Ltd. 版权所有</p>
      </div>
    </div>
  </body>
</html>
`;
