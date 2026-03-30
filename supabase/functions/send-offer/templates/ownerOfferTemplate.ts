
export function getOwnerEmailHtml(domain: string, offer: string, email: string, message: string | undefined, buyerId: string | null | undefined, dashboardUrl: string): string {
  const primaryDashboardUrl = dashboardUrl || `/user-center`;
  const offerNum = parseFloat(offer) || 0;
  const escrowFee = (offerNum * 0.01).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return `
      <!DOCTYPE html>
      <html lang="zh-CN">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>您收到了新域名报价</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft YaHei', sans-serif;
              line-height: 1.6; color: #111827; background: #f3f4f6; padding: 20px;
            }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .header { background: #111827; padding: 32px 24px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 22px; font-weight: 600; }
            .logo { color: white; font-size: 24px; font-weight: 700; margin-bottom: 8px; }
            .content { padding: 32px 24px; }
            .button { display: inline-block; background: #111827; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; margin: 8px 4px; }
            .footer { text-align: center; padding: 24px; font-size: 13px; color: #6b7280; background: #f9fafb; border-top: 1px solid #e5e7eb; }
            .offer-card { background: #f9fafb; padding: 24px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb; }
            .offer-details { background: #ffffff; padding: 0; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb; overflow: hidden; }
            .offer-details table { width: 100%; border-collapse: collapse; }
            .offer-details td, .offer-details th { padding: 12px 16px; text-align: left; border-bottom: 1px solid #f3f4f6; }
            .offer-details tr:last-child td, .offer-details tr:last-child th { border-bottom: none; }
            .offer-details th { background: #f9fafb; font-weight: 500; color: #6b7280; width: 30%; font-size: 14px; }
            .offer-details td { color: #111827; font-weight: 500; }
            .price-highlight { color: #111827; font-weight: 700; font-size: 32px; text-align: center; margin: 16px 0; }
            .domain-name { font-weight: 600; color: #111827; }
            .actions { text-align: center; margin: 24px 0; }
            h2 { color: #111827; margin-bottom: 16px; font-size: 18px; font-weight: 600; }
            p { margin: 12px 0; line-height: 1.6; color: #374151; }
            .info-box { background: #f9fafb; padding: 16px; border-radius: 6px; border-left: 3px solid #111827; margin: 20px 0; }
            .info-box ul { margin: 8px 0; padding-left: 20px; }
            .info-box li { margin: 6px 0; color: #374151; }
            .buyer-badge { display: inline-block; padding: 4px 12px; background: #f3f4f6; color: #111827; border-radius: 4px; font-size: 14px; font-weight: 500; }
            .escrow-box { background: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0; margin: 20px 0; }
            .escrow-box h3 { color: #15803d; font-size: 15px; font-weight: 700; margin-bottom: 12px; }
            .escrow-box ul { margin: 0; padding-left: 20px; }
            .escrow-box li { color: #166534; font-size: 13px; margin: 5px 0; }
            .fee-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
            .fee-table td { padding: 6px 10px; border: 1px solid #86efac; }
            .fee-table td:first-child { background: #dcfce7; color: #166534; font-weight: 600; width: 55%; }
            .fee-table td:last-child { color: #111827; font-weight: 700; }
            .warning-box { background: #fffbeb; padding: 14px 16px; border-radius: 6px; border: 1px solid #fde68a; margin: 20px 0; font-size: 13px; color: #92400e; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🌐 域见•你</div>
              <h1>您收到了新的域名报价</h1>
            </div>
            <div class="content">
              <h2>💰 恭喜！您的域名收到了报价</h2>
              <p>您的域名 <span class="domain-name">${domain}</span> 收到了一个新的购买报价。</p>

              <div class="offer-card">
                <div class="price-highlight">¥${offer}</div>
                <p style="text-align: center; margin: 8px 0; color: #6b7280; font-size: 14px;">买家报价</p>
              </div>

              <div class="offer-details">
                <table>
                  <tr><th>域名</th><td><strong>${domain}</strong></td></tr>
                  <tr><th>报价金额</th><td style="font-size: 18px; font-weight: 700;">¥${offer}</td></tr>
                  <tr><th>买家身份</th><td><span class="buyer-badge">${buyerId ? `已注册用户` : `访客用户`}</span></td></tr>
                  <tr><th>报价时间</th><td>${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</td></tr>
                  ${message ? `<tr><th>买家留言</th><td style="font-style: italic; color: #6b7280;">"${message}"</td></tr>` : ''}
                </table>
              </div>

              <div class="info-box">
                <p style="margin: 0 0 8px 0;"><strong style="color: #111827;">📌 处理建议</strong></p>
                <ul>
                  <li>快速回复可以提高成交机会，建议 48 小时内给予回复</li>
                  <li>您可以在平台上接受报价、拒绝或提出还价</li>
                  <li>双方谈妥后，请通过平台完成担保交易，保障双方权益</li>
                </ul>
              </div>

              <!-- 平台担保交易推广 -->
              <div class="escrow-box">
                <h3>🛡️ 选择平台担保交易，安全有保障</h3>
                <p style="color: #166534; font-size: 13px; margin: 0 0 10px 0;">当您与买家就价格达成一致后，可通过平台发起担保交易。平台将全程托管资金，确保买家付款后您安全收款、买家拿到域名控制权后资金才会放款。</p>
                <table class="fee-table">
                  <tr><td>货币转换手续费</td><td>按实际汇率结算（如适用）</td></tr>
                  <tr><td>平台担保服务费</td><td>交易总价 × 1%</td></tr>
                  <tr><td>本笔预估担保费（参考）</td><td>¥${escrowFee}</td></tr>
                </table>
                <p style="color: #166534; font-size: 12px; margin: 10px 0 0 0;">✅ 担保交易全程监管资金，域名变更前不放款，保障卖家和买家双方利益。</p>
              </div>

              <!-- 平台政策提醒 -->
              <div class="warning-box">
                ⚠️ <strong>重要提醒：</strong>为保障交易安全，请务必通过本平台完成交易流程。绕过平台私下交易存在资金和域名双重风险，平台对站外交易纠纷不予受理。
              </div>

              <div class="actions">
                <a href="${primaryDashboardUrl}" class="button">登录平台 · 查看并回复报价</a>
              </div>

              <p style="margin-top: 24px;">感谢您使用 域见•你 域名交易平台，祝您交易顺利！</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} 域见•你 域名交易平台</p>
              <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">您收到此邮件是因为您是域名 ${domain} 的持有者</p>
            </div>
          </div>
        </body>
      </html>
    `;
}
