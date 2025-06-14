import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { Resend } from "https://esm.sh/resend@4.1.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, recipient, data } = await req.json();

    // Connect to Supabase
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Set up email template variables
    let emailSubject = "";
    let emailBody = "";

    const baseUrl = Deno.env.get("SITE_URL") || "https://sale.nic.bn";
    const fromEmail = "noreply@sale.nic.bn";

    // Common email styles for consistency
    const emailStyles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #1a1a1a; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 40px 20px;
        }
        .email-container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: #ffffff; 
          border-radius: 24px; 
          overflow: hidden; 
          box-shadow: 0 25px 50px rgba(0,0,0,0.15);
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          padding: 48px 32px; 
          text-align: center; 
          position: relative;
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="1" fill="white" opacity="0.05"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          pointer-events: none;
        }
        .logo { 
          color: white; 
          font-size: 32px; 
          font-weight: 800; 
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          position: relative;
          z-index: 1;
        }
        .tagline { 
          color: rgba(255,255,255,0.9); 
          font-size: 16px; 
          font-weight: 500;
          position: relative;
          z-index: 1;
        }
        .content { 
          padding: 48px 32px; 
          background: #ffffff;
        }
        .title { 
          font-size: 28px; 
          font-weight: 700; 
          color: #1a1a1a; 
          margin-bottom: 16px;
          line-height: 1.3;
        }
        .subtitle { 
          font-size: 18px; 
          color: #6b7280; 
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          text-decoration: none; 
          padding: 16px 32px; 
          border-radius: 12px; 
          font-weight: 600; 
          font-size: 16px;
          margin: 24px 0; 
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .button:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
        }
        .info-card { 
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
          padding: 24px; 
          border-radius: 16px; 
          margin: 24px 0; 
          border-left: 4px solid #667eea;
        }
        .highlight-box { 
          background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); 
          padding: 20px; 
          border-radius: 12px; 
          margin: 24px 0; 
          border-left: 4px solid #f59e0b;
        }
        .price-display { 
          font-size: 36px; 
          font-weight: 800; 
          color: #059669; 
          text-align: center; 
          margin: 20px 0;
          text-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);
        }
        .domain-name { 
          font-size: 24px; 
          font-weight: 700; 
          color: #1e40af; 
          text-align: center; 
          margin: 16px 0;
        }
        .details-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 24px 0;
        }
        .details-table td { 
          padding: 12px 16px; 
          border-bottom: 1px solid #e5e7eb; 
          vertical-align: top;
        }
        .details-table td:first-child { 
          font-weight: 600; 
          color: #4b5563; 
          width: 40%;
        }
        .footer { 
          text-align: center; 
          padding: 32px; 
          background: #f8fafc; 
          color: #6b7280; 
          font-size: 14px;
        }
        .social-links { 
          margin: 20px 0; 
        }
        .social-links a { 
          display: inline-block; 
          margin: 0 8px; 
          color: #667eea; 
          text-decoration: none;
        }
        .divider { 
          height: 1px; 
          background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%); 
          margin: 32px 0;
        }
        .status-badge { 
          display: inline-block; 
          padding: 8px 16px; 
          border-radius: 20px; 
          font-size: 14px; 
          font-weight: 600; 
          text-transform: uppercase; 
          letter-spacing: 0.5px;
        }
        .status-success { 
          background: #d1fae5; 
          color: #065f46;
        }
        .status-warning { 
          background: #fef3c7; 
          color: #92400e;
        }
        .status-info { 
          background: #dbeafe; 
          color: #1e40af;
        }
      </style>
    `;

    // Process based on notification type
    switch (type) {
      case "email_verification":
        emailSubject = "🎉 欢迎加入 NIC.BN - 请验证您的邮箱";
        emailBody = `
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
                    <p><strong>⚠️ 重要提醒：</strong></p>
                    <ul style="margin: 12px 0; padding-left: 20px;">
                      <li>验证链接有效期为 24 小时</li>
                      <li>如果您没有注册账户，请忽略此邮件</li>
                      <li>验证成功后即可享受完整平台功能</li>
                    </ul>
                  </div>
                  
                  <div class="divider"></div>
                  
                  <p style="color: #6b7280;">如有任何疑问，请随时联系我们的客服团队。我们很高兴为您提供专业的域名交易服务！</p>
                  
                  <p style="margin-top: 32px;">
                    此致<br>
                    <strong style="color: #667eea;">NIC.BN 团队</strong>
                  </p>
                </div>
                
                <div class="footer">
                  <div class="social-links">
                    <a href="#">Twitter</a> | 
                    <a href="#">LinkedIn</a> | 
                    <a href="#">Facebook</a>
                  </div>
                  <p>© ${new Date().getFullYear()} NIC.BN Ltd. 版权所有</p>
                  <p style="margin-top: 8px; font-size: 12px;">
                    您收到此邮件是因为您在 <a href="${baseUrl}" style="color: #667eea;">NIC.BN</a> 注册了账户
                  </p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;

      case "password_reset":
        emailSubject = "🔐 重置您的 NIC.BN 账户密码";
        emailBody = `
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
                  <div class="logo">🔐 NIC.BN</div>
                  <div class="tagline">账户安全保护</div>
                </div>
                
                <div class="content">
                  <h1 class="title">重置您的密码</h1>
                  <p class="subtitle">我们收到了您的密码重置请求</p>
                  
                  <p>为了保护您的账户安全，请点击下方按钮设置新密码：</p>
                  
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="${baseUrl}/reset-password?token=${data.token}" class="button">
                      🔄 重置密码
                    </a>
                  </div>
                  
                  <div class="info-card">
                    <h3 style="margin-bottom: 16px; color: #1f2937;">🛡️ 安全提示：</h3>
                    <ul style="list-style: none; padding: 0;">
                      <li style="padding: 8px 0;">🕐 重置链接有效期为 24 小时</li>
                      <li style="padding: 8px 0;">🔒 建议使用包含大小写字母、数字的强密码</li>
                      <li style="padding: 8px 0;">❌ 如非本人操作，请立即联系客服</li>
                    </ul>
                  </div>
                  
                  <div class="highlight-box">
                    <p><strong>⚠️ 如果您没有请求重置密码：</strong></p>
                    <p>请忽略此邮件，您的账户仍然安全。为了进一步保护账户安全，建议您定期更换密码并开启两步验证。</p>
                  </div>
                  
                  <div class="divider"></div>
                  
                  <p style="color: #6b7280;">如需帮助，请联系我们的安全团队。我们致力于保护您的账户安全！</p>
                  
                  <p style="margin-top: 32px;">
                    此致<br>
                    <strong style="color: #667eea;">NIC.BN 安全团队</strong>
                  </p>
                </div>
                
                <div class="footer">
                  <div class="social-links">
                    <a href="#">帮助中心</a> | 
                    <a href="#">安全指南</a> | 
                    <a href="#">联系客服</a>
                  </div>
                  <p>© ${new Date().getFullYear()} NIC.BN Ltd. 版权所有</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;

      case "new_offer":
        emailSubject = `💰 新的域名报价：${data.domain} - 买家出价 $${data.amount.toLocaleString()}`;
        emailBody = `
          <!DOCTYPE html>
          <html lang="zh-CN">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>新的域名报价 - NIC.BN</title>
              ${emailStyles}
            </head>
            <body>
              <div class="email-container">
                <div class="header">
                  <div class="logo">💰 NIC.BN</div>
                  <div class="tagline">域名交易通知</div>
                </div>
                
                <div class="content">
                  <h1 class="title">🎉 恭喜！您收到新的域名报价</h1>
                  <p class="subtitle">有买家对您的域名很感兴趣</p>
                  
                  <div class="info-card" style="text-align: center; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-left-color: #10b981;">
                    <div class="domain-name">${data.domain}</div>
                    <div class="price-display">$${data.amount.toLocaleString()}</div>
                    <span class="status-badge status-success">新报价</span>
                  </div>
                  
                  <table class="details-table">
                    <tr>
                      <td>📧 买家邮箱</td>
                      <td>${data.buyer_email}</td>
                    </tr>
                    <tr>
                      <td>💵 报价金额</td>
                      <td><strong style="color: #059669;">$${data.amount.toLocaleString()}</strong></td>
                    </tr>
                    <tr>
                      <td>⏰ 报价时间</td>
                      <td>${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</td>
                    </tr>
                    ${data.message ? `
                    <tr>
                      <td>💬 买家留言</td>
                      <td style="font-style: italic; color: #4b5563;">"${data.message}"</td>
                    </tr>` : ''}
                  </table>
                  
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="${baseUrl}/user-center?tab=transactions" class="button">
                      💼 查看和回复报价
                    </a>
                  </div>
                  
                  <div class="highlight-box">
                    <h3 style="margin-bottom: 12px;">🚀 快速回复提示：</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                      <li>及时回复可提高成交机会</li>
                      <li>您可以接受、拒绝或提出反报价</li>
                      <li>专业的沟通有助于建立信任</li>
                    </ul>
                  </div>
                  
                  <div class="divider"></div>
                  
                  <p style="color: #6b7280;">感谢您使用 NIC.BN 平台进行域名交易。我们致力于为您提供安全、高效的交易环境！</p>
                  
                  <p style="margin-top: 32px;">
                    祝交易顺利！<br>
                    <strong style="color: #667eea;">NIC.BN 交易团队</strong>
                  </p>
                </div>
                
                <div class="footer">
                  <div class="social-links">
                    <a href="#">交易指南</a> | 
                    <a href="#">手续费说明</a> | 
                    <a href="#">客服支持</a>
                  </div>
                  <p>© ${new Date().getFullYear()} NIC.BN Ltd. 版权所有</p>
                  <p style="margin-top: 8px; font-size: 12px;">
                    您收到此邮件是因为您是域名 <strong>${data.domain}</strong> 的持有者
                  </p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;

      case "offer_response":
        emailSubject = `📬 您的域名报价有回复：${data.domain}`;
        emailBody = `
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
                  <div class="logo">📬 NIC.BN</div>
                  <div class="tagline">交易进展通知</div>
                </div>
                
                <div class="content">
                  <h1 class="title">📨 您的域名报价有新回复</h1>
                  <p class="subtitle">卖家已回复您的报价，请查看详情</p>
                  
                  <div class="info-card" style="text-align: center; background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); border-left-color: #f59e0b;">
                    <div class="domain-name">${data.domain}</div>
                    <span class="status-badge status-warning">卖家已回复</span>
                  </div>
                  
                  <table class="details-table">
                    <tr>
                      <td>🌐 域名</td>
                      <td><strong>${data.domain}</strong></td>
                    </tr>
                    <tr>
                      <td>💰 您的报价</td>
                      <td><strong>$${data.amount.toLocaleString()}</strong></td>
                    </tr>
                    <tr>
                      <td>📝 卖家回复</td>
                      <td><span class="status-badge ${data.response === 'accepted' ? 'status-success' : data.response === 'rejected' ? 'status-warning' : 'status-info'}">${data.response}</span></td>
                    </tr>
                    ${data.counter_offer ? `
                    <tr>
                      <td>💵 卖家反报价</td>
                      <td><strong style="color: #059669; font-size: 18px;">$${data.counter_offer.toLocaleString()}</strong></td>
                    </tr>` : ''}
                  </table>
                  
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="${baseUrl}/user-center?tab=transactions" class="button">
                      💼 查看完整交易详情
                    </a>
                  </div>
                  
                  <div class="highlight-box">
                    <h3 style="margin-bottom: 12px;">📋 下一步操作：</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                      <li>登录账户查看完整回复内容</li>
                      <li>如有反报价，请及时考虑回应</li>
                      <li>可继续与卖家进行友好协商</li>
                    </ul>
                  </div>
                  
                  <div class="divider"></div>
                  
                  <p style="color: #6b7280;">感谢您使用 NIC.BN 进行域名交易。我们的托管服务确保交易安全可靠！</p>
                  
                  <p style="margin-top: 32px;">
                    祝您交易愉快！<br>
                    <strong style="color: #667eea;">NIC.BN 交易团队</strong>
                  </p>
                </div>
                
                <div class="footer">
                  <div class="social-links">
                    <a href="#">交易帮助</a> | 
                    <a href="#">争议解决</a> | 
                    <a href="#">联系客服</a>
                  </div>
                  <p>© ${new Date().getFullYear()} NIC.BN Ltd. 版权所有</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;

      case "domain_sold":
        emailSubject = `✅ 恭喜！您的域名 ${data.domain} 已成功售出`;
        emailBody = `
          <!DOCTYPE html>
          <html lang="zh-CN">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>域名售出 - NIC.BN</title>
              ${emailStyles}
            </head>
            <body>
              <div class="email-container">
                <div class="header">
                  <div class="logo">🎉 NIC.BN</div>
                  <div class="tagline">交易成功通知</div>
                </div>
                
                <div class="content">
                  <h1 class="title">🎊 恭喜！域名售出成功</h1>
                  <p class="subtitle">您的域名交易已顺利完成</p>
                  
                  <div class="info-card" style="text-align: center; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-left-color: #10b981;">
                    <div class="domain-name">${data.domain}</div>
                    <div class="price-display">$${data.amount.toLocaleString()}</div>
                    <span class="status-badge status-success">交易完成</span>
                  </div>
                  
                  <table class="details-table">
                    <tr>
                      <td>🌐 售出域名</td>
                      <td><strong>${data.domain}</strong></td>
                    </tr>
                    <tr>
                      <td>💰 成交金额</td>
                      <td><strong style="color: #059669; font-size: 18px;">$${data.amount.toLocaleString()}</strong></td>
                    </tr>
                    <tr>
                      <td>🛒 买家</td>
                      <td>${data.buyer}</td>
                    </tr>
                    <tr>
                      <td>📅 交易时间</td>
                      <td>${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</td>
                    </tr>
                  </table>
                  
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="${baseUrl}/user-center?tab=transactions" class="button">
                      📊 查看交易详情
                    </a>
                  </div>
                  
                  <div class="highlight-box">
                    <h3 style="margin-bottom: 12px;">💡 后续事项：</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                      <li>资金将在 1-3 个工作日内到账</li>
                      <li>域名转移将在 24-48 小时内完成</li>
                      <li>交易记录可在用户中心查看</li>
                      <li>如有问题请及时联系客服</li>
                    </ul>
                  </div>
                  
                  <div class="divider"></div>
                  
                  <p style="color: #6b7280;">感谢您选择 NIC.BN 平台！我们期待为您提供更多优质的域名交易服务。</p>
                  
                  <p style="margin-top: 32px;">
                    再次恭喜！<br>
                    <strong style="color: #667eea;">NIC.BN 交易团队</strong>
                  </p>
                </div>
                
                <div class="footer">
                  <div class="social-links">
                    <a href="#">继续出售</a> | 
                    <a href="#">推荐奖励</a> | 
                    <a href="#">客服支持</a>
                  </div>
                  <p>© ${new Date().getFullYear()} NIC.BN Ltd. 版权所有</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;

      case "domain_purchased":
        emailSubject = `🎉 域名购买成功：${data.domain}`;
        emailBody = `
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
        break;

      // ... keep existing code for other notification types (verification_complete, domain_value_estimate, analytics_report)

      default:
        throw new Error("Unknown notification type");
    }

    // Create notification in database if recipient is a UUID (user ID)
    if (recipient.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      try {
        // Determine notification type and title
        let notificationType = 'system';
        let notificationTitle = '系统通知';
        let actionUrl = '/user-center?tab=notifications';
        
        if (type.includes('offer')) {
          notificationType = 'offer';
          notificationTitle = '新的域名报价';
          actionUrl = '/user-center?tab=transactions';
        } else if (type.includes('verification')) {
          notificationType = 'verification';
          notificationTitle = '域名验证更新';
          actionUrl = '/user-center?tab=domains';
        } else if (type.includes('domain_')) {
          notificationType = 'transaction';
          notificationTitle = '域名交易更新';
          actionUrl = '/user-center?tab=transactions';
        }
        
        // Create notification in database
        await supabaseAdmin.from('notifications').insert({
          user_id: recipient,
          title: data.title || notificationTitle,
          message: data.message || emailSubject,
          type: notificationType,
          is_read: false,
          created_at: new Date().toISOString(),
          related_id: data.related_id,
          action_url: data.action_url || actionUrl
        });
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
        // Continue with email even if notification fails
      }
    }

    // Send the email through Resend if recipient is an email
    if (recipient.includes('@')) {
      const { error } = await resend.emails.send({
        from: fromEmail,
        to: [recipient],
        subject: emailSubject,
        html: emailBody,
      });

      if (error) {
        throw new Error(`Failed to send email: ${error.message}`);
      }
    }

    console.log(`Successfully sent ${type} notification to ${recipient}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
