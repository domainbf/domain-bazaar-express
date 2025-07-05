
import { emailStyles } from "./emailStyles.ts";

export const getOfferResponseHtml = (data: any, baseUrl: string) => `
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
        <div class="logo">NIC.BN</div>
        <div class="tagline">专业域名交易平台</div>
      </div>
      
      <div class="content">
        <h1 class="title">📬 您的域名报价有回复</h1>
        <p class="subtitle">卖家已回复您的报价</p>
        
        <div class="domain-name">${data.domain}</div>
        
        <p style="margin-bottom: 32px;">
          您对域名 <strong>${data.domain}</strong> 的报价已收到卖家回复。
        </p>
        
        <div class="info-card">
          <h3>📋 报价信息</h3>
          <table class="details-table">
            <tr>
              <td>域名</td>
              <td>${data.domain}</td>
            </tr>
            <tr>
              <td>您的报价</td>
              <td>¥${data.amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td>报价状态</td>
              <td>
                <span class="status-badge ${data.status === 'accepted' ? 'status-success' : data.status === 'rejected' ? 'status-warning' : 'status-info'}">
                  ${data.status === 'accepted' ? '已接受' : data.status === 'rejected' ? '已拒绝' : '待处理'}
                </span>
              </td>
            </tr>
          </table>
        </div>
        
        ${data.response ? `
        <div class="info-card">
          <h3>💬 卖家回复</h3>
          <p style="margin: 0; color: #4b5563; font-style: italic;">"${data.response}"</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${baseUrl}/user-center?tab=transactions" class="button">
            查看详情
          </a>
        </div>
        
        <div class="divider"></div>
        
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          如有疑问，请随时联系我们的客服团队。
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
          您收到此邮件是因为您在 <a href="${baseUrl}">NIC.BN</a> 的域名报价有了新回复
        </p>
      </div>
    </div>
  </body>
</html>
`;
