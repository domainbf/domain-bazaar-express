/**
 * Shared email template builder.
 * Generates consistent, branded HTML emails for all platform notifications.
 */

export interface EmailBrandConfig {
  siteName: string;
  siteHostname: string;
  siteDomain: string;
  supportEmail: string;
  year?: number;
}

/** Build a branded email wrapper around content HTML */
export function buildEmail(opts: {
  previewText?: string;
  accentColor?: string;
  headerEmoji?: string;
  title: string;
  subtitle?: string;
  body: string;
  footerNote?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  brand: EmailBrandConfig;
}): string {
  const {
    previewText = '',
    accentColor = '#0f172a',
    headerEmoji,
    title,
    subtitle,
    body,
    footerNote,
    ctaLabel,
    ctaUrl,
    brand,
  } = opts;

  const { siteName, siteHostname, siteDomain, supportEmail, year = new Date().getFullYear() } = brand;

  const ctaBlock = ctaLabel && ctaUrl
    ? `<div style="text-align:center;padding:8px 0 8px;">
        <a href="${ctaUrl}" style="display:inline-block;background:#0f172a;color:#f8fafc;padding:16px 40px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 4px 14px rgba(15,23,42,0.2);">${ctaLabel} →</a>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${title}</title>
  <style>
    body{margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;}
    .preheader{display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;max-height:0;max-width:0;overflow:hidden;mso-hide:all;}
    @media only screen and (max-width:600px){
      .email-body{padding:24px 12px!important;}
      .card-padding{padding:28px 24px!important;}
    }
  </style>
</head>
<body>
  <span class="preheader">${previewText}</span>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f1f5f9;padding:32px 16px;" class="email-body">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">

        <!-- Logo Header -->
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
          <!-- Accent strip -->
          <div style="height:4px;background:${accentColor};"></div>

          <!-- Card header -->
          <div style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #f1f5f9;" class="card-padding">
            ${headerEmoji ? `<div style="width:64px;height:64px;background:#f8fafc;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:32px;border:1px solid #e2e8f0;">${headerEmoji}</div>` : ''}
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">${title}</h1>
            ${subtitle ? `<p style="margin:0;font-size:15px;color:#64748b;">${subtitle}</p>` : ''}
          </div>

          <!-- Card body -->
          <div style="padding:32px 40px;" class="card-padding">
            ${body}
            ${ctaBlock}
          </div>

          <!-- Card footer -->
          <div style="padding:20px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
            <p style="margin:0;font-size:13px;color:#94a3b8;">
              ${footerNote || `有疑问？联系 <a href="mailto:${supportEmail}" style="color:#475569;text-decoration:none;font-weight:600;">${supportEmail}</a>`}
            </p>
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

/** Key-value info table */
export function infoTable(rows: Array<{ label: string; value: string; highlight?: boolean }>): string {
  const trs = rows.map(({ label, value, highlight }) =>
    `<tr>
      <td style="padding:12px 16px;background:#f8fafc;font-size:12px;font-weight:700;color:#94a3b8;width:35%;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">${label}</td>
      <td style="padding:12px 16px;font-size:14px;color:${highlight ? '#0f172a' : '#475569'};font-weight:${highlight ? '700' : '500'};border-bottom:1px solid #f1f5f9;">${value}</td>
    </tr>`
  ).join('');

  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
    ${trs}
  </table>`;
}

/** Highlighted message quote block */
export function quoteBlock(content: string, color: 'blue' | 'amber' | 'green' | 'red' | 'gray' = 'gray'): string {
  const colors: Record<string, { bg: string; border: string; text: string; label: string }> = {
    blue:  { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', label: '#3b82f6' },
    amber: { bg: '#fefce8', border: '#fef08a', text: '#713f12', label: '#854d0e' },
    green: { bg: '#f0fdf4', border: '#bbf7d0', text: '#14532d', label: '#15803d' },
    red:   { bg: '#fef2f2', border: '#fecaca', text: '#7f1d1d', label: '#dc2626' },
    gray:  { bg: '#f8fafc', border: '#e2e8f0', text: '#334155', label: '#64748b' },
  };
  const c = colors[color];
  return `<div style="background:${c.bg};border:1px solid ${c.border};border-radius:10px;padding:18px 20px;margin-bottom:24px;">
    <p style="margin:0;font-size:14px;color:${c.text};line-height:1.7;white-space:pre-wrap;">${content}</p>
  </div>`;
}

/** Big amount display block */
export function amountBlock(opts: {
  label: string;
  amount: string;
  sublabel?: string;
  color?: string;
}): string {
  return `<div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin-bottom:24px;border:1px solid #e2e8f0;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;">${opts.label}</p>
    <p style="margin:0;font-size:28px;font-weight:900;color:${opts.color || '#0f172a'};">${opts.amount}</p>
    ${opts.sublabel ? `<p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">${opts.sublabel}</p>` : ''}
  </div>`;
}

/** Alert/notice banner */
export function alertBanner(content: string, type: 'info' | 'warning' | 'success' | 'error' = 'info'): string {
  const styles: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', icon: 'ℹ️' },
    warning: { bg: '#fefce8', border: '#fef08a', text: '#713f12', icon: '⚠️' },
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#14532d', icon: '✅' },
    error:   { bg: '#fef2f2', border: '#fecaca', text: '#7f1d1d', icon: '❌' },
  };
  const s = styles[type];
  return `<div style="background:${s.bg};border:1px solid ${s.border};border-radius:10px;padding:14px 16px;margin-bottom:20px;display:flex;gap:10px;align-items:flex-start;">
    <span style="font-size:16px;">${s.icon}</span>
    <p style="margin:0;font-size:13px;color:${s.text};line-height:1.6;">${content}</p>
  </div>`;
}
