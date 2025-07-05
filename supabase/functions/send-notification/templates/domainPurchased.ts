
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
        <p class="subtitle">恭喜您成功获得心仪的域名</p>
        
        <div class="domain-name">${data.domain}</div>
        <div class="price-display">¥${data.amount.toLocaleString()}</div>
        
        <p style="margin-bottom: 32px;">
          恭喜您！您已成功购买域名 <strong>${data.domain}</strong>，支付金额为 <strong>¥${data.amount.toLocaleString()}</strong>。
        </p>
        
        <div class="info-card">
          <h3>📋 购买详情</h3>
          <table class="details-table">
            <tr>
              <td>域名</td>
              <td>${data.domain}</td>
            </tr>
            <tr>
              <td>购买价格</td>
              <td>¥${data.amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td>购买时间</td>
              <td>${new Date().toLocaleString('zh-CN')}</td>
            </tr>
            <tr>
              <td>支付状态</td>
              <td><span class="status-badge status-success">已完成</span></td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${baseUrl}/user-center?tab=domains" class="button">
            管理我的域名
          </a>
        </div>
        
        <div class="info-card">
          <h3>🚀 接下来您可以</h3>
          <ul style="list-style: none; padding: 0; margin: 16px 0 0 0;">
            <li style="padding: 8px 0; position: relative; padding-left: 24px;">
              <span style="position: absolute; left: 0; color: #10b981;">✓</span>
              设置域名解析指向您的网站
            </li>
            <li style="padding: 8px 0; position: relative; padding-left: 24px;">
              <span style="position: absolute; left: 0; color: #10b981;">✓</span>
              配置邮箱服务使用新域名
            </li>
            <li style="padding: 8px 0; position: relative; padding-left: 24px;">
              <span style="position: absolute; left: 0; color: #10b981;">✓</span>
              在用户中心查看域名管理选项
            </li>
            <li style="padding: 8px 0; position: relative; padding-left: 24px;">
              <span style="position: absolute; left: 0; color: #10b981;">✓</span>
              如需转让可随时重新上架销售
            </li>
          </ul>
        </div>
        
        <div class="divider"></div>
        
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          如需域名管理方面的帮助，请查看我们的 <a href="${baseUrl}/help" style="color: #1f2937;">帮助文档</a> 或联系客服。
        </p>
        
        <p style="margin-top: 32px; text-align: center; color: #4b5563;">
          感谢您的信任<br>
          <strong style="color: #1f2937;">NIC.BN 团队</strong>
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
          您收到此邮件是因为您在 <a href="${baseUrl}">NIC.BN</a> 成功购买了域名
        </p>
      </div>
    </div>
  </body>
</html>
`;
