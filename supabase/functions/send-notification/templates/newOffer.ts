
import { emailStyles } from "./emailStyles.ts";

export const getNewOfferHtml = (data: any, baseUrl: string) => `
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>新域名报价 - NIC.BN</title>
    ${emailStyles}
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <div class="logo">NIC.BN</div>
        <div class="tagline">专业域名交易平台</div>
      </div>
      
      <div class="content">
        <h1 class="title">💰 您收到新的域名报价</h1>
        <p class="subtitle">有买家对您的域名感兴趣</p>
        <p class="subtitle" style="margin-top:4px; color:#6b7280;">You have a new domain offer</p>
        <p style="margin: 8px 0 0 0; color: #6b7280;">A buyer is interested in your domain.</p>
        
        <div class="domain-name">${data.domain}</div>
        <div class="price-display">¥${data.amount.toLocaleString()}</div>
        
        <p style="margin-bottom: 32px;">
          恭喜！有买家对您的域名 <strong>${data.domain}</strong> 提出了 <strong>¥${data.amount.toLocaleString()}</strong> 的报价。
        </p>
        
        ${data.message ? `
        <div class="info-card">
          <h3>💬 买家留言</h3>
          <p style="margin: 0; color: #4b5563; font-style: italic;">"${data.message}"</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${baseUrl}/user-center?tab=transactions" class="button">
            查看报价详情 / View offer details
          </a>
          <p style="margin-top: 12px; color: #6b7280; font-size: 12px;">如果按钮无法点击，请复制此链接到浏览器打开：<br />
            <span style="word-break: break-all; color: #1f2937;">${baseUrl}/user-center?tab=transactions</span>
          </p>
        </div>
        
        <div class="info-card">
          <h3>📋 报价详情</h3>
          <table class="details-table">
            <tr>
              <td>域名</td>
              <td>${data.domain}</td>
            </tr>
            <tr>
              <td>报价金额</td>
              <td>¥${data.amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td>买家邮箱</td>
              <td>${data.buyerEmail || '未提供'}</td>
            </tr>
            <tr>
              <td>报价时间</td>
              <td>${new Date().toLocaleString('zh-CN')}</td>
            </tr>
          </table>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          请尽快回复报价，良好的沟通有助于促成交易。
        </p>
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          Please respond promptly. Clear communication helps close the deal.
        </p>
        <p style="margin-top: 32px; text-align: center; color: #4b5563;">
          祝您交易顺利<br>
          <strong style="color: #1f2937;">NIC.BN 团队</strong><br/>
          <span style="color:#6b7280">Good luck with your deal,<br/>NIC.BN Team</span>
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
          您收到此邮件是因为有人对您在 <a href="${baseUrl}">NIC.BN</a> 的域名提出了报价
        </p>
      </div>
    </div>
  </body>
</html>
`;
