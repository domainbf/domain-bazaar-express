
export function getUserEmailHtml(
  domain: string,
  offer: string,
  message: string | undefined,
  dashboardUrl: string,
  siteName = '域见•你',
  siteHostname = 'NIC.RW',
  siteDomain = 'https://nic.rw',
  supportEmail = 'support@nic.rw',
): string {
  const primaryDashboardUrl = dashboardUrl || `${siteDomain}/user-center`;
  const offerNum = parseFloat(offer) || 0;
  const formatted = `¥${offerNum.toLocaleString()}`;
  const escrowFee = `¥${(offerNum * 0.01).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const domainUpper = domain.toUpperCase();
  const year = new Date().getFullYear();
  const previewText = `您对 ${domainUpper} 的 ${formatted} 报价已成功提交，等待卖家回复`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>报价提交成功 — ${siteName}</title>
  <style>body{margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;}.preheader{display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;max-height:0;overflow:hidden;}</style>
</head>
<body>
  <span class="preheader">${previewText}</span>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">

        <!-- Logo -->
        <tr><td style="padding-bottom:24px;text-align:center;">
          <a href="${siteDomain}" style="text-decoration:none;">
            <table cellpadding="0" cellspacing="0" role="presentation" style="display:inline-table;">
              <tr><td style="background:#0f172a;border-radius:12px;padding:10px 20px;">
                <span style="color:#f8fafc;font-size:20px;font-weight:800;letter-spacing:-0.5px;">${siteName}</span>
                <span style="color:#475569;font-size:11px;font-weight:600;margin-left:10px;letter-spacing:2px;text-transform:uppercase;">${siteHostname}</span>
              </td></tr>
            </table>
          </a>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.07);">
          <div style="height:4px;background:linear-gradient(90deg,#0f172a 0%,#334155 50%,#64748b 100%);"></div>

          <!-- Card header -->
          <div style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #f1f5f9;">
            <div style="width:64px;height:64px;background:#f0fdf4;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:32px;border:1px solid #bbf7d0;">✅</div>
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">报价提交成功</h1>
            <p style="margin:0;font-size:15px;color:#64748b;">您的报价已发送给卖家，请耐心等待回复</p>
          </div>

          <!-- Card body -->
          <div style="padding:32px 40px;">

            <!-- Domain + Price highlight -->
            <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;">报价域名</p>
              <p style="margin:0 0 16px;font-size:24px;font-weight:800;color:#0f172a;">${domainUpper}</p>
              <div style="display:inline-block;background:#0f172a;border-radius:10px;padding:12px 32px;">
                <p style="margin:0 0 2px;font-size:10px;font-weight:600;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">您的报价</p>
                <p style="margin:0;font-size:30px;font-weight:900;color:#f8fafc;letter-spacing:-1px;">${formatted}</p>
              </div>
            </div>

            <!-- Details table -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
              <tr>
                <td style="padding:12px 16px;background:#f8fafc;font-size:12px;font-weight:700;color:#94a3b8;width:35%;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">域名</td>
                <td style="padding:12px 16px;font-size:14px;color:#0f172a;font-weight:700;border-bottom:1px solid #f1f5f9;">${domainUpper}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background:#f8fafc;font-size:12px;font-weight:700;color:#94a3b8;width:35%;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">报价金额</td>
                <td style="padding:12px 16px;font-size:18px;color:#0f172a;font-weight:900;border-bottom:1px solid #f1f5f9;">${formatted}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background:#f8fafc;font-size:12px;font-weight:700;color:#94a3b8;width:35%;letter-spacing:0.5px;text-transform:uppercase;${message ? 'border-bottom:1px solid #f1f5f9;' : ''}">状态</td>
                <td style="padding:12px 16px;font-size:14px;${message ? 'border-bottom:1px solid #f1f5f9;' : ''}"><span style="display:inline-block;padding:3px 10px;background:#fef9c3;color:#854d0e;border-radius:4px;font-size:12px;font-weight:700;">等待卖家回复</span></td>
              </tr>
              ${message ? `<tr>
                <td style="padding:12px 16px;background:#f8fafc;font-size:12px;font-weight:700;color:#94a3b8;width:35%;letter-spacing:0.5px;text-transform:uppercase;">您的留言</td>
                <td style="padding:12px 16px;font-size:13px;color:#475569;font-style:italic;">"${message}"</td>
              </tr>` : ''}
            </table>

            <!-- Next steps -->
            <div style="background:#f8fafc;border-left:4px solid #0f172a;border-radius:0 10px 10px 0;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0f172a;">接下来会发生什么？</p>
              <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                <tr><td style="padding:3px 0;font-size:13px;color:#475569;"><span style="font-weight:700;color:#0f172a;margin-right:8px;">①</span>您的报价已发送给域名所有者</td></tr>
                <tr><td style="padding:3px 0;font-size:13px;color:#475569;"><span style="font-weight:700;color:#0f172a;margin-right:8px;">②</span>卖家将在 48 小时内回复您的报价</td></tr>
                <tr><td style="padding:3px 0;font-size:13px;color:#475569;"><span style="font-weight:700;color:#0f172a;margin-right:8px;">③</span>收到回复后，您将第一时间收到邮件通知</td></tr>
                <tr><td style="padding:3px 0;font-size:13px;color:#475569;"><span style="font-weight:700;color:#0f172a;margin-right:8px;">④</span>达成共识后，可通过平台完成担保交易</td></tr>
              </table>
            </div>

            <!-- Escrow promotion -->
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#15803d;">🛡️ 平台担保交易保障</p>
              <p style="margin:0 0 10px;font-size:13px;color:#166534;line-height:1.6;">当卖家接受报价后，通过平台担保交易可确保资金和域名同步安全转移，平台全程监管，真正零风险。</p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-size:12px;">
                <tr>
                  <td style="padding:5px 10px;background:#dcfce7;color:#166534;font-weight:700;border:1px solid #86efac;width:55%;">平台担保服务费（参考）</td>
                  <td style="padding:5px 10px;color:#0f172a;font-weight:700;border:1px solid #86efac;">${escrowFee}（1%）</td>
                </tr>
              </table>
            </div>

            <!-- Security warning -->
            <div style="background:#fefce8;border:1px solid #fef08a;border-radius:10px;padding:14px 16px;margin-bottom:24px;">
              <p style="margin:0;font-size:13px;color:#713f12;line-height:1.6;">⚠️ <strong>安全提醒：</strong>请务必通过本平台完成交易，切勿在站外私下转账。平台担保可保障您的资金和域名安全，站外交易风险自负，平台不予受理纠纷。</p>
            </div>

            <!-- CTA -->
            <div style="text-align:center;">
              <a href="${primaryDashboardUrl}" style="display:inline-block;background:#0f172a;color:#f8fafc;padding:16px 40px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 4px 14px rgba(15,23,42,0.2);">查看我的报价状态 →</a>
            </div>

          </div>

          <!-- Card footer -->
          <div style="padding:20px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
            <p style="margin:0;font-size:13px;color:#94a3b8;">有疑问？联系 <a href="mailto:${supportEmail}" style="color:#475569;text-decoration:none;font-weight:600;">${supportEmail}</a></p>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 20px 0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">© ${year} ${siteName} · ${siteHostname} · 本邮件由系统自动发送，请勿回复</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
