
export function getOwnerEmailHtml(domain: string, offer: string, email: string, message: string | undefined, buyerId: string | null | undefined, dashboardUrl: string): string {
  // Use nic.bn as the primary domain
  const primaryDashboardUrl = dashboardUrl.includes('nic.bn') ? dashboardUrl : `https://nic.bn/user-center`;
  
  return `
      <!DOCTYPE html>
      <html lang="zh-CN">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>您收到了新域名报价 - NIC.BN</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #1f2937; 
              background: #f3f4f6;
              padding: 20px;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: #ffffff; 
              border-radius: 12px; 
              overflow: hidden; 
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            .header { 
              background: #1f2937; 
              padding: 40px 32px; 
              text-align: center; 
            }
            .header h1 { 
              color: white; 
              margin: 0; 
              font-size: 24px; 
              font-weight: 700; 
            }
            .logo { 
              color: white; 
              font-size: 28px; 
              font-weight: 800; 
              margin-bottom: 8px;
            }
            .content { 
              padding: 40px 32px; 
            }
            .button { 
              display: inline-block; 
              background: #1f2937; 
              color: white; 
              text-decoration: none; 
              padding: 14px 28px; 
              border-radius: 8px; 
              font-weight: 600; 
              margin: 24px 0; 
              transition: all 0.3s ease;
            }
            .button:hover { 
              background: #374151;
            }
            .footer { 
              text-align: center; 
              padding: 32px; 
              font-size: 14px; 
              color: #6b7280; 
              background: #f3f4f6; 
            }
            .offer-card { 
              background: #f9fafb; 
              padding: 24px; 
              border-radius: 12px; 
              margin: 24px 0; 
              border-left: 4px solid #10b981;
            }
            .offer-details { 
              background: #f9fafb; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0;
            }
            .offer-details table { 
              width: 100%; 
              border-collapse: collapse; 
            }
            .offer-details td, .offer-details th { 
              padding: 12px; 
              text-align: left; 
              border-bottom: 1px solid #e5e7eb; 
            }
            .offer-details th { 
              background: #f3f4f6; 
              font-weight: 600; 
              color: #374151; 
              width: 40%; 
            }
            .highlight { 
              color: #10b981; 
              font-weight: 800; 
              font-size: 28px; 
              text-align: center; 
            }
            .domain-name { 
              font-weight: 700; 
              color: #1f2937; 
              font-size: 20px; 
            }
            .actions { 
              text-align: center; 
              margin: 30px 0; 
            }
            h2 { 
              color: #1f2937; 
              margin-bottom: 20px; 
            }
            p { 
              margin: 16px 0; 
              line-height: 1.8; 
            }
            .urgent { 
              background: #fef3c7; 
              padding: 20px; 
              border-radius: 8px; 
              border-left: 4px solid #f59e0b; 
              margin: 20px 0; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🌐 NIC.BN</div>
              <h1>新的域名报价</h1>
            </div>
            <div class="content">
              <h2>🚀 恭喜！您收到了新的域名报价</h2>
              <p>您的域名 <span class="domain-name">${domain}</span> 收到了一个很有竞争力的报价！</p>
              
              <div class="offer-card">
                <h3 style="margin-top: 0; color: #10b981; text-align: center;">💎 新报价详情</h3>
                <div class="highlight">¥${offer}</div>
                <p style="text-align: center; margin: 10px 0; color: #10b981;"><strong>域名：${domain}</strong></p>
              </div>
              
              <div class="offer-details">
                <table>
                  <tr>
                    <th>🌐 域名</th>
                    <td><strong>${domain}</strong></td>
                  </tr>
                  <tr>
                    <th>💰 报价金额</th>
                    <td><span style="color: #10b981; font-weight: bold; font-size: 18px;">¥${offer}</span></td>
                  </tr>
                  <tr>
                    <th>📧 买家邮箱</th>
                    <td><a href="mailto:${email}" style="color: #1f2937;">${email}</a></td>
                  </tr>
                  <tr>
                    <th>👤 买家身份</th>
                    <td>${buyerId ? `✅ 注册用户` : `👤 访客用户`}</td>
                  </tr>
                  <tr>
                    <th>⏰ 报价时间</th>
                    <td>${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</td>
                  </tr>
                  ${message ? `<tr>
                    <th>💬 买家留言</th>
                    <td style="font-style: italic; background: #f0f9ff; padding: 10px; border-radius: 4px;">"${message}"</td>
                  </tr>` : ''}
                </table>
              </div>
              
              <div class="urgent">
                <p><strong style="color: #92400e;">⚡ 行动建议：</strong></p>
                <ul style="margin: 10px 0; color: #92400e;">
                  <li>📈 <strong>快速回复</strong>可以提高成交几率</li>
                  <li>💡 考虑买家的诚意和报价合理性</li>
                  <li>🤝 友好沟通有助于达成共识</li>
                </ul>
              </div>
              
              <p>您可以通过控制面板快速回应此报价，接受、拒绝或提出反报价：</p>
              
              <div class="actions">
                <a href="${primaryDashboardUrl}" class="button">💼 立即查看和回复</a>
              </div>
              
              <p>感谢您选择我们的域名交易平台。如需任何协助，我们的客服团队随时为您服务！</p>
              <p>祝您交易成功！<br><strong>NIC.BN 团队</strong></p>
            </div>
            <div class="footer">
              <div style="margin-bottom: 12px;">
                <a href="https://nic.bn/help" style="color: #1f2937; text-decoration: none;">帮助中心</a> | 
                <a href="https://nic.bn/contact" style="color: #1f2937; text-decoration: none;">联系客服</a>
              </div>
              <p>© ${new Date().getFullYear()} NIC.BN Ltd. - 保留所有权利</p>
              <p>您收到此邮件是因为您是域名 ${domain} 的持有者</p>
            </div>
          </div>
        </body>
      </html>
    `;
}
