
export function getUserEmailHtml(domain: string, offer: string, message: string | undefined, dashboardUrl: string): string {
  // Use nic.bn as the primary domain
  const primaryDashboardUrl = dashboardUrl.includes('nic.bn') ? dashboardUrl : `https://nic.bn/user-center`;
  
  return `
      <!DOCTYPE html>
      <html lang="zh-CN">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>您的域名报价已收到 - NIC.BN</title>
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
              text-align: center;
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
            .status-waiting { 
              color: #f59e0b; 
              font-weight: bold; 
            }
            .domain-name { 
              font-weight: 700; 
              color: #1f2937; 
              font-size: 20px; 
            }
            .price { 
              font-size: 28px; 
              font-weight: 800; 
              color: #10b981; 
              margin: 10px 0;
            }
            h2 { 
              color: #1f2937; 
              margin-bottom: 20px; 
            }
            p { 
              margin: 16px 0; 
              line-height: 1.8; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🌐 NIC.BN</div>
              <h1>专业域名交易平台</h1>
            </div>
            <div class="content">
              <h2>🎉 您的报价已提交成功</h2>
              <p>感谢您对 <span class="domain-name">${domain}</span> 的兴趣。我们已收到您的报价，并已转发给域名所有者。</p>
              
              <div class="offer-card">
                <div class="domain-name">${domain}</div>
                <div class="price">¥${offer}</div>
              </div>
              
              <div class="offer-details">
                <h3>📋 报价详情</h3>
                <table>
                  <tr>
                    <th>🌐 域名</th>
                    <td><strong>${domain}</strong></td>
                  </tr>
                  <tr>
                    <th>💰 报价金额</th>
                    <td><strong>¥${offer}</strong></td>
                  </tr>
                  <tr>
                    <th>📊 状态</th>
                    <td><span class="status-waiting">⏳ 等待回应</span></td>
                  </tr>
                  <tr>
                    <th>⏰ 提交时间</th>
                    <td>${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</td>
                  </tr>
                  ${message ? `<tr>
                    <th>💬 您的留言</th>
                    <td>${message}</td>
                  </tr>` : ''}
                </table>
              </div>
              
              <p>✅ <strong>下一步：</strong>域名所有者将审核您的报价并尽快回复。当他们回应时，您将收到邮件通知。</p>
              <p>💡 <strong>建议：</strong>如您创建了账户，可以随时在用户中心查看所有报价记录和状态更新。</p>
              
              <div style="text-align: center;">
                <a href="${primaryDashboardUrl}" class="button">🔍 查看用户中心</a>
              </div>
              
              <p style="margin-top: 30px;">如果您有任何问题，请回复此邮件或联系我们的客服团队。</p>
              <p>祝您交易成功！<br><strong>NIC.BN 团队</strong></p>
            </div>
            <div class="footer">
              <div style="margin-bottom: 12px;">
                <a href="https://nic.bn/help" style="color: #1f2937; text-decoration: none;">帮助中心</a> | 
                <a href="https://nic.bn/contact" style="color: #1f2937; text-decoration: none;">联系客服</a>
              </div>
              <p>© ${new Date().getFullYear()} NIC.BN Ltd. - 保留所有权利</p>
              <p>您收到此邮件是因为您在 <a href="https://nic.bn" style="color: #1f2937;">NIC.BN</a> 平台上提交了域名报价</p>
            </div>
          </div>
        </body>
      </html>
    `;
}
