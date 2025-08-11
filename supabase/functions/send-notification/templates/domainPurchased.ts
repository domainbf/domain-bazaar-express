
import { emailStyles } from "./emailStyles.ts";

export const getDomainPurchasedHtml = (data: any, baseUrl: string) => `
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>域名购买成功 - NIC.BN</title>
    ${emailStyles}
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <div class="logo">NIC.BN</div>
        <div class="tagline">专业域名交易平台</div>
      </div>
      
      <div class="content">
        <h1 class="title">🎉 域名购买成功</h1>
        <p class="subtitle">您已成功购买域名</p>
        <p class="subtitle" style="margin-top:4px; color:#6b7280;">Your domain purchase was successful</p>
        <p style="margin: 8px 0 0 0; color: #6b7280;">You have successfully purchased the domain.</p>
        
        <div class="domain-name">${data.domain}</div>
        <div class="price-display">¥${data.amount.toLocaleString()}</div>
        
        <p style="margin-bottom: 32px;">
          恭喜！您已成功购买域名 <strong>${data.domain}</strong>，支付金额为 <strong>¥${data.amount.toLocaleString()}</strong>。
        </p>
        
        <div class="info-card">
          <h3>📋 购买详情</h3>
          <table class="details-table">
            <tr>
              <td>域名</td>
              <td>${data.domain}</td>
            </tr>
            <tr>
              <td>支付金额</td>
              <td>¥${data.amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td>购买时间</td>
              <td>${new Date().toLocaleString('zh-CN')}</td>
            </tr>
            <tr>
              <td>交易状态</td>
              <td><span class="status-badge status-success">已完成</span></td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${baseUrl}/user-center?tab=transactions" class="button">
            查看交易记录 / View transactions
          </a>
          <p style="margin-top: 12px; color: #6b7280; font-size: 12px;">如果按钮无法点击，请复制此链接到浏览器打开：<br />
            <span style="word-break: break-all; color: #1f2937;">${baseUrl}/user-center?tab=transactions</span>
          </p>
        </div>
        
        <div class="highlight-box">
          <p><strong>🔗 域名管理</strong></p>
          <p>您现在可以在用户中心管理您的域名。如需域名转移或DNS设置帮助，请联系我们的客服团队。</p>
        </div>
        
        <div class="divider"></div>
        
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          感谢您选择 NIC.BN 进行域名购买，祝您使用愉快！
        </p>
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          Thank you for choosing NIC.BN. Enjoy your new domain!
        </p>
        <p style="margin-top: 32px; text-align: center; color: #4b5563;">
          此致<br>
          <strong style="color: #1f2937;">NIC.BN 团队</strong><br/>
          <span style="color:#6b7280">Best regards,<br/>NIC.BN Team</span>
        </p>
      </div>
      
      <div class="footer">
        <div class="social-links">
          <a href="${baseUrl}/user-center">用户中心</a>
          <a href="${baseUrl}/help">帮助中心</a>
          <a href="${baseUrl}/contact">联系我们</a>
        </div>
        <p>© ${new Date().getFullYear()} NIC.BN Ltd. 版权所有</p>
        <p style="margin-top: 8px; font-size: 12px;">
          您收到此邮件是因为您在 <a href="${baseUrl}">NIC.BN</a> 购买了域名
        </p>
      </div>
    </div>
  </body>
</html>
`;
