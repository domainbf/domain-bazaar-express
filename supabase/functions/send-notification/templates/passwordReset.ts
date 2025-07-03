
import { emailStyles } from "./emailStyles.ts";

export const getPasswordResetHtml = (data: { token: string }, baseUrl: string) => `
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>密码重置 - NIC.BN</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
        background-color: #f9fafb;
        color: #111827;
        line-height: 1.6;
      }
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        margin-top: 20px;
        margin-bottom: 20px;
      }
      .header {
        background: linear-gradient(135deg, #000000 0%, #374151 100%);
        padding: 40px 30px;
        text-align: center;
        color: white;
      }
      .logo {
        font-size: 32px;
        font-weight: bold;
        margin-bottom: 8px;
        letter-spacing: -0.02em;
      }
      .tagline {
        font-size: 16px;
        opacity: 0.9;
        margin: 0;
      }
      .content {
        padding: 40px 30px;
      }
      .title {
        font-size: 28px;
        font-weight: bold;
        color: #111827;
        margin: 0 0 12px 0;
        text-align: center;
      }
      .subtitle {
        font-size: 16px;
        color: #6b7280;
        text-align: center;
        margin: 0 0 32px 0;
      }
      .button {
        display: inline-block;
        background: linear-gradient(135deg, #000000 0%, #374151 100%);
        color: white;
        text-decoration: none;
        padding: 16px 32px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        text-align: center;
        transition: all 0.3s ease;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      .button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 12px -2px rgba(0, 0, 0, 0.2);
      }
      .info-card {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 24px;
        margin: 32px 0;
      }
      .info-card h3 {
        color: #1f2937;
        font-size: 18px;
        margin: 0 0 16px 0;
        font-weight: 600;
      }
      .info-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .info-list li {
        padding: 8px 0;
        color: #4b5563;
        position: relative;
        padding-left: 28px;
      }
      .info-list li:before {
        content: "✓";
        position: absolute;
        left: 0;
        color: #10b981;
        font-weight: bold;
      }
      .highlight-box {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border: 1px solid #f59e0b;
        border-radius: 8px;
        padding: 20px;
        margin: 24px 0;
      }
      .highlight-box p {
        margin: 0 0 8px 0;
        color: #92400e;
      }
      .highlight-box p:last-child {
        margin-bottom: 0;
      }
      .divider {
        height: 1px;
        background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);
        margin: 32px 0;
      }
      .footer {
        background-color: #f9fafb;
        padding: 30px;
        text-align: center;
        border-top: 1px solid #e5e7eb;
      }
      .social-links {
        margin-bottom: 16px;
      }
      .social-links a {
        color: #6b7280;
        text-decoration: none;
        font-size: 14px;
        margin: 0 8px;
        transition: color 0.3s ease;
      }
      .social-links a:hover {
        color: #111827;
      }
      .footer p {
        color: #6b7280;
        font-size: 14px;
        margin: 8px 0;
      }
      .footer a {
        color: #111827;
        text-decoration: none;
      }
      .footer a:hover {
        text-decoration: underline;
      }
      @media (max-width: 640px) {
        .email-container {
          margin: 10px;
          border-radius: 8px;
        }
        .header {
          padding: 30px 20px;
        }
        .content {
          padding: 30px 20px;
        }
        .title {
          font-size: 24px;
        }
        .button {
          padding: 14px 28px;
          font-size: 15px;
        }
      }
    </style>
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
        
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 32px;">
          为了保护您的账户安全，请点击下方按钮设置新密码。此链接将在 30 分钟后过期。
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="https://nic.bn/reset-password?token=${data.token}" class="button">
            🔄 重置密码
          </a>
        </div>
        
        <div class="info-card">
          <h3>🛡️ 安全提示</h3>
          <ul class="info-list">
            <li>重置链接有效期为 30 分钟</li>
            <li>建议使用包含大小写字母、数字的强密码</li>
            <li>如非本人操作，请立即联系客服</li>
            <li>定期更换密码以确保账户安全</li>
          </ul>
        </div>
        
        <div class="highlight-box">
          <p><strong>⚠️ 如果您没有请求重置密码：</strong></p>
          <p>请忽略此邮件，您的账户仍然安全。为了进一步保护账户安全，建议您定期更换密码。</p>
        </div>
        
        <div class="divider"></div>
        
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          如需帮助，请访问我们的 <a href="https://nic.bn/help" style="color: #111827;">帮助中心</a> 或联系客服团队。
        </p>
        
        <p style="margin-top: 32px; text-align: center; color: #4b5563;">
          此致<br>
          <strong style="color: #111827;">NIC.BN 安全团队</strong>
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
          您收到此邮件是因为您在 <a href="https://nic.bn">NIC.BN</a> 请求了密码重置
        </p>
      </div>
    </div>
  </body>
</html>
`;
