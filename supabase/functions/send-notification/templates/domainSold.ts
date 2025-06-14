
import { emailStyles } from "./emailStyles.ts";

export const getDomainSoldHtml = (data: { domain: string; amount: number; buyer: string }, baseUrl: string) => `
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>域名售出 - NIC.BN</title>
    ${emailStyles}
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <div class="logo">🌐 NIC.BN</div>
        <div class="tagline">专业域名交易平台</div>
      </div>
      
      <div class="content">
        <h1 class="title">🎊 恭喜！域名售出成功</h1>
        <p class="subtitle">您的域名交易已顺利完成</p>
        
        <div class="info-card" style="text-align: center; border-left-color: #10b981;">
          <div class="domain-name">${data.domain}</div>
          <div class="price-display">$${data.amount.toLocaleString()}</div>
          <span class="status-badge status-success">交易完成</span>
        </div>
        
        <table class="details-table">
          <tr>
            <td>🌐 售出域名</td>
            <td><strong>${data.domain}</strong></td>
          </tr>
          <tr>
            <td>💰 成交金额</td>
            <td><strong style="color: #10b981; font-size: 18px;">$${data.amount.toLocaleString()}</strong></td>
          </tr>
          <tr>
            <td>🛒 买家</td>
            <td>${data.buyer}</td>
          </tr>
          <tr>
            <td>📅 交易时间</td>
            <td>${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</td>
          </tr>
        </table>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${baseUrl}/user-center?tab=transactions" class="button">
            📊 查看交易详情
          </a>
        </div>
        
        <div class="highlight-box">
          <h3 style="margin-bottom: 12px; color: #92400e;">💡 后续事项：</h3>
          <ul style="margin: 0; padding-left: 20px; color: #92400e;">
            <li>资金将在 1-3 个工作日内到账</li>
            <li>域名转移将在 24-48 小时内完成</li>
            <li>交易记录可在用户中心查看</li>
            <li>如有问题请及时联系客服</li>
          </ul>
        </div>
        
        <div class="divider"></div>
        
        <p style="color: #6b7280;">感谢您选择 NIC.BN 平台！我们期待为您提供更多优质的域名交易服务。</p>
        
        <p style="margin-top: 32px;">
          再次恭喜！<br>
          <strong style="color: #1f2937;">NIC.BN 交易团队</strong>
        </p>
      </div>
      
      <div class="footer">
        <div class="social-links">
          <a href="#">继续出售</a> | 
          <a href="#">推荐奖励</a> | 
          <a href="#">客服支持</a>
        </div>
        <p>© ${new Date().getFullYear()} NIC.BN Ltd. 版权所有</p>
      </div>
    </div>
  </body>
</html>
`;
