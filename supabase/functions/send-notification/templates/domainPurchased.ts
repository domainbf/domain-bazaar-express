
import { emailStyles } from "./emailStyles.ts";

export const getDomainPurchasedHtml = (data: { domain: string; amount: number; seller: string }, baseUrl: string) => `
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
        <div class="logo">🎉 NIC.BN</div>
        <div class="tagline">购买成功通知</div>
      </div>
      
      <div class="content">
        <h1 class="title">🎊 域名购买成功！</h1>
        <p class="subtitle">恭喜您成功获得心仪的域名</p>
        
        <div class="info-card" style="text-align: center; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-left-color: #3b82f6;">
          <div class="domain-name">${data.domain}</div>
          <div class="price-display" style="color: #3b82f6;">$${data.amount.toLocaleString()}</div>
          <span class="status-badge status-info">已购买</span>
        </div>
        
        <table class="details-table">
          <tr>
            <td>🌐 购买域名</td>
            <td><strong>${data.domain}</strong></td>
          </tr>
          <tr>
            <td>💰 支付金额</td>
            <td><strong style="color: #3b82f6; font-size: 18px;">$${data.amount.toLocaleString()}</strong></td>
          </tr>
          <tr>
            <td>👤 卖家</td>
            <td>${data.seller}</td>
          </tr>
          <tr>
            <td>📅 购买时间</td>
            <td>${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</td>
          </tr>
        </table>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${baseUrl}/user-center?tab=domains" class="button">
            🏠 管理我的域名
          </a>
        </div>
        
        <div class="highlight-box">
          <h3 style="margin-bottom: 12px;">🔄 域名转移流程：</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>域名将在 24-48 小时内转移到您的账户</li>
            <li>转移完成后您将收到确认邮件</li>
            <li>可在用户中心查看域名管理详情</li>
            <li>如需技术支持请联系我们</li>
          </ul>
        </div>
        
        <div class="divider"></div>
        
        <p style="color: #6b7280;">感谢您信任 NIC.BN 平台！我们将继续为您提供专业的域名管理和交易服务。</p>
        
        <p style="margin-top: 32px;">
          祝您使用愉快！<br>
          <strong style="color: #667eea;">NIC.BN 客户服务团队</strong>
        </p>
      </div>
      
      <div class="footer">
        <div class="social-links">
          <a href="#">域名管理指南</a> | 
          <a href="#">DNS 设置</a> | 
          <a href="#">技术支持</a>
        </div>
        <p>© ${new Date().getFullYear()} NIC.BN Ltd. 版权所有</p>
      </div>
    </div>
  </body>
</html>
`;
