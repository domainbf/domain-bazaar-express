
import { emailStyles } from "./emailStyles.ts";

export const getPasswordResetHtml = (data: { token: string }, baseUrl: string) => `
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>密码重置 - NIC.BN</title>
    ${emailStyles}
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <div class="logo">🌐 NIC.BN</div>
        <div class="tagline">专业域名交易平台</div>
      </div>
      
      <div class="content">
        <h1 class="title">重置您的密码</h1>
        <p class="subtitle">我们收到了您的密码重置请求</p>
        
        <p>为了保护您的账户安全，请点击下方按钮设置新密码：</p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="https://nic.bn/reset-password?token=${data.token}" class="button">
            🔄 重置密码
          </a>
        </div>
        
        <div class="info-card">
          <h3 style="margin-bottom: 16px; color: #1f2937;">🛡️ 安全提示：</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 8px 0;">🕐 重置链接有效期为 30 分钟</li>
            <li style="padding: 8px 0;">🔒 建议使用包含大小写字母、数字的强密码</li>
            <li style="padding: 8px 0;">❌ 如非本人操作，请立即联系客服</li>
          </ul>
        </div>
        
        <div class="highlight-box">
          <p><strong style="color: #92400e;">⚠️ 如果您没有请求重置密码：</strong></p>
          <p style="color: #92400e;">请忽略此邮件，您的账户仍然安全。为了进一步保护账户安全，建议您定期更换密码并开启两步验证。</p>
        </div>
        
        <div class="divider"></div>
        
        <p style="color: #6b7280;">如需帮助，请访问我们的帮助中心或联系客服团队。我们致力于保护您的账户安全！</p>
        
        <p style="margin-top: 32px;">
          此致<br>
          <strong style="color: #1f2937;">NIC.BN 安全团队</strong>
        </p>
      </div>
      
      <div class="footer">
        <div class="social-links">
          <a href="https://nic.bn/help">帮助中心</a> | 
          <a href="https://nic.bn/security">安全指南</a> | 
          <a href="https://nic.bn/contact">联系客服</a>
        </div>
        <p>© ${new Date().getFullYear()} NIC.BN Ltd. 版权所有</p>
        <p style="margin-top: 8px; font-size: 12px;">
          您收到此邮件是因为您在 <a href="https://nic.bn" style="color: #1f2937;">NIC.BN</a> 请求了密码重置
        </p>
      </div>
    </div>
  </body>
</html>
`;
