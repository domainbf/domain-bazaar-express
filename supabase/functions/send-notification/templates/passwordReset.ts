
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
        <div class="logo">NIC.BN</div>
        <div class="tagline">专业域名交易平台 | Professional Domain Trading Platform</div>
      </div>
      
      <div class="content">
        <h1 class="title">🔐 重置您的密码 | Reset Your Password</h1>
        <p class="subtitle">我们收到了您的密码重置请求</p>
        <p class="subtitle" style="margin-top:4px; color:#6b7280;">We received your password reset request</p>
        
        <p style="margin-bottom: 32px; font-size: 16px; line-height: 1.6;">
          为了保护您的账户安全，请点击下方按钮设置新密码。此链接将在 30 分钟后过期。<br/>
          <span style="color: #6b7280; font-size: 14px;">To protect your account security, please click the button below to set a new password. This link will expire in 30 minutes.</span>
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${baseUrl}/reset-password?token=${data.token}" class="button">
            🔐 重置密码 | Reset Password
          </a>
          <p style="margin-top: 16px; color: #6b7280; font-size: 13px; line-height: 1.5;">
            如果按钮无法点击，请复制此链接到浏览器打开：<br/>
            <span style="color: #6b7280; font-size: 12px;">If the button doesn't work, copy this link to your browser:</span><br/>
            <span style="word-break: break-all; color: #1f2937; background: #f8fafc; padding: 8px; border-radius: 4px; display: inline-block; margin-top: 8px;">${baseUrl}/reset-password?token=${data.token}</span>
          </p>
        </div>
        
        <div class="info-card">
          <h3>🛡️ 安全提示 | Security Tips</h3>
          <ul style="list-style: none; padding: 0; margin: 16px 0 0 0;">
            <li style="padding: 8px 0; position: relative; padding-left: 24px;">
              <span style="position: absolute; left: 0; color: #10b981;">✓</span>
              重置链接有效期为 30 分钟 | Link expires in 30 minutes
            </li>
            <li style="padding: 8px 0; position: relative; padding-left: 24px;">
              <span style="position: absolute; left: 0; color: #10b981;">✓</span>
              建议使用包含大小写字母、数字的强密码 | Use a strong password with letters, numbers
            </li>
            <li style="padding: 8px 0; position: relative; padding-left: 24px;">
              <span style="position: absolute; left: 0; color: #10b981;">✓</span>
              如非本人操作，请立即联系客服 | Contact support if you didn't request this
            </li>
            <li style="padding: 8px 0; position: relative; padding-left: 24px;">
              <span style="position: absolute; left: 0; color: #10b981;">✓</span>
              定期更换密码以确保账户安全 | Change passwords regularly for security
            </li>
          </ul>
        </div>
        
        <div class="highlight-box">
          <p><strong>⚠️ 如果您没有请求重置密码 | If you didn't request this reset:</strong></p>
          <p>请忽略此邮件，您的账户仍然安全。为了进一步保护账户安全，建议您定期更换密码。<br/>
          <span style="color: #6b7280; font-size: 14px;">Please ignore this email, your account is still secure. For additional security, we recommend changing your password regularly.</span></p>
        </div>
        
        <div class="divider"></div>
        
        <p style="color: #6b7280; font-size: 14px; text-align: center; margin-bottom: 8px;">
          如需帮助，请访问我们的 <a href="${baseUrl}/help" style="color: #1f2937; font-weight: 600;">帮助中心</a> 或联系客服团队。
        </p>
        <p style="color: #6b7280; font-size: 14px; text-align: center; margin-bottom: 32px;">
          For help, visit our <a href="${baseUrl}/help" style="color: #1f2937; font-weight: 600;">Help Center</a> or contact our support team.
        </p>
        
        <div style="text-align: center; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 24px; border-radius: 12px; border: 2px solid #e2e8f0;">
          <p style="margin: 0; color: #4b5563; font-size: 16px; font-weight: 600;">
            此致 | Best regards,<br/>
            <strong style="color: #1f2937; font-size: 18px;">NIC.BN 安全团队</strong><br/>
            <span style="color: #6b7280; font-size: 14px; font-weight: 400;">NIC.BN Security Team</span>
          </p>
        </div>
      </div>
      
      <div class="footer">
        <div class="social-links">
          <a href="${baseUrl}/help">帮助中心 | Help</a>
          <a href="${baseUrl}/security">安全指南 | Security</a>
          <a href="${baseUrl}/contact">联系客服 | Contact</a>
        </div>
        <p style="font-weight: 600; color: #1f2937;">© ${new Date().getFullYear()} NIC.BN Ltd. 版权所有 | All Rights Reserved</p>
        <p style="margin-top: 8px; font-size: 12px; color: #6b7280;">
          您收到此邮件是因为您在 <a href="${baseUrl}" style="color: #1f2937; font-weight: 600;">NIC.BN</a> 请求了密码重置<br/>
          You received this email because you requested a password reset on <a href="${baseUrl}" style="color: #1f2937; font-weight: 600;">NIC.BN</a>
        </p>
        <p style="margin-top: 12px; font-size: 12px; color: #9ca3af;">
          📧 由 <span class="brand-accent" style="font-weight: 700;">NIC.BN</span> 安全系统自动发送 | Automatically sent by NIC.BN Security System
        </p>
      </div>
    </div>
  </body>
</html>
`;
