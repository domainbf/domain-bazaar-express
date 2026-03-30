
export function getOwnerEmailHtml(
  domain: string,
  offer: string,
  email: string,
  message: string | undefined,
  buyerId: string | null | undefined,
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
  const previewText = `您的域名 ${domainUpper} 收到了一个 ${formatted} 的购买报价`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>您收到了新域名报价 — ${siteName}</title>
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
          <div style="height:4px;background:linear-gradient(90deg,#0f172a 0%,#334155 100%);"></div>

          <!-- Card header -->
          <div style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #f1f5f9;">
            <div style="width:64px;height:64px;background:#fefce8;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:32px;border:1px solid #fef08a;">💰</div>
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">您收到了新域名报价</h1>
            <p style="margin:0;font-size:15px;color:#64748b;">有买家对您的域名感兴趣，请尽快查看并回复</p>
          </div>

          <!-- Card body -->
          <div style="padding:32px 40px;">

            <!-- Domain + Price highlight -->
            <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;">域名</p>
              <p style="margin:0 0 16px;font-size:24px;font-weight:800;color:#0f172a;">${domainUpper}</p>
              <div style="display:inline-block;background:#0f172a;border-radius:10px;padding:12px 32px;">
                <p style="margin:0 0 2px;font-size:10px;font-weight:600;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">买家出价</p>
                <p style="margin:0;font-size:30px;font-weight:900;color:#f8fafc;letter-spacing:-1px;">${formatted}</p>
              </div>
            </div>

            <!-- Offer details -->
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
                <td style="padding:12px 16px;background:#f8fafc;font-size:12px;font-weight:700;color:#94a3b8;width:35%;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">买家类型</td>
                <td style="padding:12px 16px;font-size:14px;color:#475569;border-bottom:1px solid #f1f5f9;"><span style="display:inline-block;padding:3px 10px;background:#f1f5f9;color:#475569;border-radius:4px;font-size:12px;font-weight:600;">${buyerId ? '已注册用户' : '访客用户'}</span></td>
              </tr>
              ${message ? `<tr>
                <td style="padding:12px 16px;background:#f8fafc;font-size:12px;font-weight:700;color:#94a3b8;width:35%;letter-spacing:0.5px;text-transform:uppercase;">买家留言</td>
                <td style="padding:12px 16px;font-size:13px;color:#475569;font-style:italic;">"${message}"</td>
              </tr>` : ''}
            </table>

            <!-- Action tips -->
            <div style="background:#f8fafc;border-left:4px solid #0f172a;border-radius:0 10px 10px 0;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0f172a;">处理建议</p>
              <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                <tr><td style="padding:3px 0;font-size:13px;color:#475569;"><span style="font-weight:700;color:#0f172a;margin-right:8px;">·</span>建议在 48 小时内回复，快速响应可提高成交率</td></tr>
                <tr><td style="padding:3px 0;font-size:13px;color:#475569;"><span style="font-weight:700;color:#0f172a;margin-right:8px;">·</span>您可以接受报价、拒绝或在平台提出还价</td></tr>
                <tr><td style="padding:3px 0;font-size:13px;color:#475569;"><span style="font-weight:700;color:#0f172a;margin-right:8px;">·</span>双方谈妥后，通过平台担保交易保障双方权益</td></tr>
              </table>
            </div>

            <!-- Escrow promotion -->
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#15803d;">🛡️ 选择平台担保交易</p>
              <p style="margin:0 0 10px;font-size:13px;color:#166534;line-height:1.6;">与买家就价格达成一致后，通过平台发起担保交易。平台全程监管资金，域名变更前不放款，保障卖家安全收款。</p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-size:12px;">
                <tr>
                  <td style="padding:5px 10px;background:#dcfce7;color:#166534;font-weight:700;border:1px solid #86efac;width:55%;">本笔预估担保服务费（参考）</td>
                  <td style="padding:5px 10px;color:#0f172a;font-weight:700;border:1px solid #86efac;">${escrowFee}（1%）</td>
                </tr>
              </table>
            </div>

            <!-- Security warning -->
            <div style="background:#fefce8;border:1px solid #fef08a;border-radius:10px;padding:14px 16px;margin-bottom:24px;">
              <p style="margin:0;font-size:13px;color:#713f12;line-height:1.6;">⚠️ <strong>重要提醒：</strong>为保障交易安全，请务必通过本平台完成交易流程。绕过平台私下交易存在资金和域名双重风险，平台对站外交易纠纷不予受理。</p>
            </div>

            <!-- CTA -->
            <div style="text-align:center;">
              <a href="${primaryDashboardUrl}" style="display:inline-block;background:#0f172a;color:#f8fafc;padding:16px 40px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 4px 14px rgba(15,23,42,0.2);">登录平台查看并回复报价 →</a>
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
          <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;">您收到此邮件是因为您是域名 ${domainUpper} 的持有者</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
