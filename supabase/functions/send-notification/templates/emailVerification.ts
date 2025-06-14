
import { emailStyles } from "./emailStyles.ts";

export const getEmailVerificationHtml = (data: { name: string; verificationUrl: string }, baseUrl: string) => `
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>邮箱验证 - NIC.BN</title>
    ${emailStyles}
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <div class="logo">🌐 NIC.BN</div>
        <div class="tagline">专业域名交易平台</div>
      </div>
      
      <div class="content">
        <h1 class="title">欢迎加入 NIC.BN！</h1>
        <p class="subtitle">感谢您选择我们的专业域名交易平台</p>
        
        <p>尊敬的 <strong>${data.name}</strong>，</p>
        <p>欢迎来到 NIC.BN 域名交易平台！为了确保您的账户安全并开始您的域名交易之旅，请点击下方按钮验证您的邮箱地址。</p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${data.verificationUrl}" class="button">
            ✉️ 立即验证邮箱
          </a>
        </div>
        
        <div class="info-card">
          <h3 style="margin-bottom: 16px; color: #1f2937;">🎯 验证后您可以：</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 8px 0;">✅ 浏览和购买精品域名</li>
            <li style="padding: 8px 0;">✅ 发布和管理您的域名</li>
            <li style="padding: 8px 0;">✅ 参与域名竞拍和报价</li>
            <li style="padding: 8px 0;">✅ 获得专业市场分析</li>
          </ul>
        </div>
        
        <div class="highlight-box">
          <p><strong style="color: #92400e;">⚠️ 重要提醒：</strong></p>
          <ul style="margin: 12px 0; padding-left: 20px; color: #92400e;">
            <li>验证链接有效期为 24 小时</li>
            <li>如果您没有注册账户，请忽略此邮件</li>
            <li>验证成功后即可享受完整平台功能</li>
          </ul>
        </div>
        
        <div class="divider"></div>
        
        <p style="color: #6b7280;">如有任何疑问，请随时联系我们的客服团队。我们很高兴为您提供专业的域名交易服务！</p>
        
        <p style="margin-top: 32px;">
          此致<br>
          <strong style="color: #1f2937;">NIC.BN 团队</strong>
        </p>
      </div>
      
      <div class="footer">
        <div class="social-links">
          <a href="#">帮助中心</a> | 
          <a href="#">服务条款</a> | 
          <a href="#">隐私政策</a>
        </div>
        <p>© ${new Date().getFullYear()} NIC.BN Ltd. 版权所有</p>
        <p style="margin-top: 8px; font-size: 12px;">
          您收到此邮件是因为您在 <a href="${baseUrl}" style="color: #1f2937;">NIC.BN</a> 注册了账户
        </p>
      </div>
    </div>
  </body>
</html>
`;
