
import { emailStyles } from "./emailStyles.ts";

export const getEmailVerificationHtml = (data: { verificationUrl: string, name: string }, baseUrl: string) => `
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>验证邮箱 - NIC.BN</title>
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
      .welcome-card {
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border: 1px solid #0ea5e9;
        border-radius: 8px;
        padding: 24px;
        margin: 32px 0;
      }
      .welcome-card h3 {
        color: #0c4a6e;
        font-size: 18px;
        margin: 0 0 16px 0;
        font-weight: 600;
      }
      .feature-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .feature-list li {
        padding: 8px 0;
        color: #075985;
        position: relative;
        padding-left: 28px;
      }
      .feature-list li:before {
        content: "🚀";
        position: absolute;
        left: 0;
        font-size: 14px;
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
        <h1 class="title">欢迎加入 NIC.BN</h1>
        <p class="subtitle">感谢您注册我们的域名交易平台</p>
        
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 32px;">
          您好 <strong>${data.name}</strong>，欢迎加入 NIC.BN！请点击下方按钮验证您的邮箱地址，开始您的域名交易之旅。
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${data.verificationUrl}" class="button">
            ✅ 验证邮箱地址
          </a>
        </div>
        
        <div class="welcome-card">
          <h3>🎉 加入 NIC.BN 您将享受：</h3>
          <ul class="feature-list">
            <li>海量优质域名资源</li>
            <li>安全便捷的交易体验</li>
            <li>专业的域名估值服务</li>
            <li>7×24小时客服支持</li>
            <li>多种支付方式选择</li>
          </ul>
        </div>
        
        <div class="divider"></div>
        
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          验证完成后，您就可以开始浏览和购买心仪的域名了！如需帮助，请访问我们的 
          <a href="https://nic.bn/help" style="color: #111827;">帮助中心</a>。
        </p>
        
        <p style="margin-top: 32px; text-align: center; color: #4b5563;">
          期待与您的合作<br>
          <strong style="color: #111827;">NIC.BN 团队</strong>
        </p>
      </div>
      
      <div class="footer">
        <div class="social-links">
          <a href="https://nic.bn/marketplace">浏览域名</a> | 
          <a href="https://nic.bn/help">帮助中心</a> | 
          <a href="https://nic.bn/contact">联系我们</a>
        </div>
        <p>© ${new Date().getFullYear()} NIC.BN Ltd. 版权所有</p>
        <p style="margin-top: 8px; font-size: 12px;">
          您收到此邮件是因为您在 <a href="https://nic.bn">NIC.BN</a> 注册了账户
        </p>
      </div>
    </div>
  </body>
</html>
`;
