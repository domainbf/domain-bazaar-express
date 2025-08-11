
import { emailStyles } from "./emailStyles.ts";

export const getEmailVerificationHtml = (data: { verificationUrl: string, name: string }, baseUrl: string) => `
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>验证邮箱 - NIC.BN</title>
    ${emailStyles}
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <div class="logo">NIC.BN</div>
        <div class="tagline">专业域名交易平台</div>
      </div>
      
      <div class="content">
        <h1 class="title">🎉 欢迎加入 NIC.BN</h1>
        <p class="subtitle">感谢您注册我们的域名交易平台</p>
        <p class="subtitle" style="margin-top:4px; color:#6b7280;">Welcome to NIC.BN</p>
        <p style="margin: 8px 0 0 0; color: #6b7280;">Thanks for signing up. Please verify your email to get started.</p>
        
        <p style="margin-bottom: 32px;">
          您好 <strong>${data.name}</strong>，欢迎加入 NIC.BN！请点击下方按钮验证您的邮箱地址，开始您的域名交易之旅。
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${data.verificationUrl}" class="button">
            验证邮箱地址 / Verify email
          </a>
          <p style="margin-top: 12px; color: #6b7280; font-size: 12px;">如果按钮无法点击，请复制此链接到浏览器打开：<br />
            <span style="word-break: break-all; color: #1f2937;">${data.verificationUrl}</span>
          </p>
        </div>
        
        <div class="info-card">
          <h3>🚀 加入 NIC.BN 您将享受：</h3>
          <ul style="list-style: none; padding: 0; margin: 16px 0 0 0;">
            <li style="padding: 8px 0; position: relative; padding-left: 24px;">
              <span style="position: absolute; left: 0; color: #10b981;">✓</span>
              海量优质域名资源
            </li>
            <li style="padding: 8px 0; position: relative; padding-left: 24px;">
              <span style="position: absolute; left: 0; color: #10b981;">✓</span>
              安全便捷的交易体验
            </li>
            <li style="padding: 8px 0; position: relative; padding-left: 24px;">
              <span style="position: absolute; left: 0; color: #10b981;">✓</span>
              专业的域名估值服务
            </li>
            <li style="padding: 8px 0; position: relative; padding-left: 24px;">
              <span style="position: absolute; left: 0; color: #10b981;">✓</span>
              7×24小时客服支持
            </li>
          </ul>
        </div>
        
        <div class="divider"></div>
        
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          验证完成后，您就可以开始浏览和购买心仪的域名了！如需帮助，请访问我们的 
          <a href="${baseUrl}/help" style="color: #1f2937;">帮助中心</a>。
        </p>
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          After verification, you can browse and purchase your favorite domains. For help, visit our 
          <a href="${baseUrl}/help" style="color: #1f2937;">Help Center</a>.
        </p>
        <p style="margin-top: 32px; text-align: center; color: #4b5563;">
          期待与您的合作<br>
          <strong style="color: #1f2937;">NIC.BN 团队</strong><br/>
          <span style="color:#6b7280">Best regards,<br/>NIC.BN Team</span>
        </p>
      </div>
      
      <div class="footer">
        <div class="social-links">
          <a href="${baseUrl}/marketplace">浏览域名</a>
          <a href="${baseUrl}/help">帮助中心</a>
          <a href="${baseUrl}/contact">联系我们</a>
        </div>
        <p>© ${new Date().getFullYear()} NIC.BN Ltd. 版权所有</p>
        <p style="margin-top: 8px; font-size: 12px;">
          您收到此邮件是因为您在 <a href="${baseUrl}">NIC.BN</a> 注册了账户
        </p>
      </div>
    </div>
  </body>
</html>
`;
