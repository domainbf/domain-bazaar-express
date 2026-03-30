/**
 * NIC.BN — 报价流程邮件模板
 * 所有邮件均不含双方联系方式，仅引导通过平台沟通
 */

export interface BrandConfig {
  siteName: string;
  siteDomain: string;
  supportEmail: string;
}

// ─── 通用 Shell ────────────────────────────────────────────────────────────

function shell(opts: {
  previewText: string;
  accentColor: string;
  icon: string;
  iconBg: string;
  title: string;
  subtitle: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote?: string;
  brand: BrandConfig;
}): string {
  const { previewText, accentColor, icon, iconBg, title, subtitle, body,
    ctaLabel, ctaUrl, footerNote, brand } = opts;
  const { siteName, siteDomain, supportEmail } = brand;
  const host = siteDomain.replace(/^https?:\/\//, '').toUpperCase();
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="zh-CN" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    body,table,td{margin:0;padding:0;}
    body{background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    img{border:0;line-height:100%;outline:none;text-decoration:none;}
    a{color:inherit;text-decoration:none;}
    .pre{display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;max-height:0;max-width:0;overflow:hidden;mso-hide:all;font-size:0;}
    @media only screen and (max-width:600px){
      .outer{padding:16px 12px!important;}
      .card-head{padding:32px 24px 24px!important;}
      .card-body{padding:28px 24px!important;}
      .card-foot{padding:18px 24px!important;}
      .amount-text{font-size:26px!important;}
    }
  </style>
</head>
<body>
<div class="pre" style="display:none;font-size:0;max-height:0;overflow:hidden;">${previewText}&#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;</div>

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f0f4f8;">
  <tr><td align="center" style="padding:40px 16px;" class="outer">

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;">

      <!-- Brand Header -->
      <tr><td style="padding-bottom:24px;text-align:center;">
        <a href="${siteDomain}" style="text-decoration:none;display:inline-block;">
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr><td style="background:#0f172a;border-radius:10px;padding:11px 22px;text-align:left;">
              <span style="color:#f8fafc;font-size:20px;font-weight:900;letter-spacing:-0.5px;vertical-align:middle;">${siteName}</span>&#8201;&#8201;<span style="color:#475569;font-size:9px;font-weight:700;letter-spacing:3.5px;text-transform:uppercase;vertical-align:middle;">${host}</span>
            </td></tr>
          </table>
        </a>
      </td></tr>

      <!-- Main Card -->
      <tr><td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.07),0 1px 4px rgba(15,23,42,0.05);">

        <!-- Accent Bar -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr><td style="height:3px;background:${accentColor};font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>

        <!-- Card Head -->
        <div style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #f1f5f9;" class="card-head">
          <div style="width:68px;height:68px;background:${iconBg};border-radius:16px;display:inline-block;text-align:center;line-height:68px;font-size:34px;margin-bottom:20px;border:1px solid rgba(15,23,42,0.06);">${icon}</div>
          <h1 style="margin:0 0 10px;font-size:24px;font-weight:900;color:#0f172a;letter-spacing:-0.4px;line-height:1.3;">${title}</h1>
          <p style="margin:0;font-size:14px;color:#64748b;line-height:1.65;max-width:400px;margin:0 auto;">${subtitle}</p>
        </div>

        <!-- Card Body -->
        <div style="padding:36px 40px;" class="card-body">
          ${body}

          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:8px;">
            <tr><td align="center" style="padding:8px 0 4px;">
              <a href="${ctaUrl}" style="display:inline-block;background:#0f172a;color:#f8fafc;padding:15px 44px;border-radius:10px;font-size:14px;font-weight:800;text-decoration:none;letter-spacing:0.2px;mso-padding-alt:15px 44px;">${ctaLabel} &rarr;</a>
            </td></tr>
          </table>
        </div>

        <!-- Card Footer Note -->
        <div style="padding:18px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;" class="card-foot">
          <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
            ${footerNote || `如有疑问，请通过 <a href="${siteDomain}/user-center" style="color:#64748b;font-weight:700;text-decoration:none;">平台消息中心</a> 联系支持团队，或发送邮件至 <a href="mailto:${supportEmail}" style="color:#64748b;font-weight:700;text-decoration:none;">${supportEmail}</a>`}
          </p>
        </div>

      </td></tr>

      <!-- Email Footer -->
      <tr><td style="padding:24px 16px 8px;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;letter-spacing:0.2px;">&copy; ${year} ${siteName} &middot; ${host} &middot; 本邮件由系统自动发送，请勿直接回复</p>
        <p style="margin:0;font-size:11px;color:#b8c4d0;">所有交易沟通请通过 <a href="${siteDomain}/user-center" style="color:#94a3b8;font-weight:600;text-decoration:none;">平台消息中心</a> 进行，平台不承担私下交流产生的风险</p>
      </td></tr>

    </table>

  </td></tr>
</table>
</body>
</html>`;
}

// ─── 进度条（进行中状态） ────────────────────────────────────────────────────

function progressBar(currentStep: 1 | 2 | 3 | 4): string {
  const steps = [
    { label: '提交报价', sub: '买家发起' },
    { label: '卖家审核', sub: '处理报价' },
    { label: '达成协议', sub: '双方确认' },
    { label: '交易完成', sub: '域名过户' },
  ];

  const items = steps.map((s, i) => {
    const n = i + 1;
    const active = n === currentStep;
    const done = n < currentStep;
    const dotBg = done ? '#16a34a' : active ? '#0f172a' : '#e2e8f0';
    const dotColor = done || active ? '#ffffff' : '#94a3b8';
    const labelColor = active ? '#0f172a' : done ? '#16a34a' : '#94a3b8';
    const subColor = active ? '#64748b' : done ? '#86efac' : '#cbd5e1';
    const dot = done ? '&#10003;' : String(n);
    return `<td style="text-align:center;padding:0 4px;width:20%;">
      <div style="width:34px;height:34px;border-radius:50%;background:${dotBg};color:${dotColor};font-size:13px;font-weight:800;text-align:center;line-height:34px;margin:0 auto 7px;">${dot}</div>
      <p style="margin:0;font-size:11px;font-weight:700;color:${labelColor};">${s.label}</p>
      <p style="margin:2px 0 0;font-size:10px;color:${subColor};">${s.sub}</p>
    </td>`;
  });

  const lines = [0, 1, 2].map(i => {
    const done = (i + 1) < currentStep;
    return `<td style="padding:0;vertical-align:top;padding-top:16px;">
      <div style="height:2px;background:${done ? '#16a34a' : '#e2e8f0'};border-radius:2px;"></div>
    </td>`;
  });

  const cells: string[] = [];
  for (let i = 0; i < 4; i++) {
    cells.push(items[i]);
    if (i < 3) cells.push(lines[i]);
  }

  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
    <tr>${cells.join('')}</tr>
  </table>`;
}

// ─── 终止状态标识（拒绝 / 取消场景专用） ──────────────────────────────────

function terminatedBar(type: 'rejected' | 'cancelled', stage: '卖家拒绝' | '买家拒绝还价' | '买家已取消'): string {
  const isRejected = type === 'rejected';
  const steps = [
    { label: '提交报价', done: true },
    { label: '卖家审核', done: true },
    { label: isRejected ? '协商终止' : '报价撤回', done: false, terminal: true },
  ];
  const stageColor = isRejected ? '#dc2626' : '#64748b';
  const stageBg   = isRejected ? '#fef2f2' : '#f8fafc';
  const stageBdr  = isRejected ? '#fecaca' : '#e2e8f0';

  const dots = steps.map((s, i) => {
    if (s.terminal) {
      return `<td style="text-align:center;padding:0 4px;width:25%;">
        <div style="width:34px;height:34px;border-radius:50%;background:${stageColor};color:#ffffff;font-size:13px;font-weight:800;text-align:center;line-height:34px;margin:0 auto 7px;">&times;</div>
        <p style="margin:0;font-size:11px;font-weight:700;color:${stageColor};">${s.label}</p>
        <p style="margin:2px 0 0;font-size:10px;color:${isRejected ? '#fca5a5' : '#94a3b8'};">${stage}</p>
      </td>`;
    }
    return `<td style="text-align:center;padding:0 4px;width:25%;">
      <div style="width:34px;height:34px;border-radius:50%;background:#16a34a;color:#ffffff;font-size:13px;font-weight:800;text-align:center;line-height:34px;margin:0 auto 7px;">&#10003;</div>
      <p style="margin:0;font-size:11px;font-weight:700;color:#16a34a;">${s.label}</p>
      <p style="margin:2px 0 0;font-size:10px;color:#86efac;">已完成</p>
    </td>`;
  });

  const line1 = `<td style="padding:0;vertical-align:top;padding-top:16px;"><div style="height:2px;background:#16a34a;border-radius:2px;"></div></td>`;
  const line2 = `<td style="padding:0;vertical-align:top;padding-top:16px;"><div style="height:2px;background:${stageColor};border-radius:2px;opacity:0.4;"></div></td>`;

  return `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
    <tr>${dots[0]}${line1}${dots[1]}${line2}${dots[2]}</tr>
  </table>
  <div style="background:${stageBg};border:1px solid ${stageBdr};border-radius:10px;padding:13px 18px;margin-bottom:24px;text-align:center;">
    <p style="margin:0;font-size:13px;font-weight:700;color:${stageColor};">${type === 'rejected' ? '本次协商已终止' : '本次报价已撤回'} &mdash; 此流程已关闭</p>
  </div>`;
}

// ─── 辅助组件 ──────────────────────────────────────────────────────────────

function domainDisplay(name: string): string {
  return `<div style="background:#f8fafc;border-radius:12px;padding:18px 24px;text-align:center;margin-bottom:24px;border:1px solid #e2e8f0;">
    <p style="margin:0 0 5px;font-size:9px;font-weight:700;color:#94a3b8;letter-spacing:2.5px;text-transform:uppercase;">洽谈域名</p>
    <p style="margin:0;font-size:26px;font-weight:900;color:#0f172a;letter-spacing:-0.3px;">${name.toUpperCase()}</p>
  </div>`;
}

function amountDisplay(label: string, amount: string, color = '#0f172a'): string {
  return `<div style="background:#f8fafc;border-radius:12px;padding:16px 24px;margin-bottom:24px;border:1px solid #e2e8f0;">
    <p style="margin:0 0 5px;font-size:9px;font-weight:700;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;">${label}</p>
    <p style="margin:0;font-size:30px;font-weight:900;color:${color};letter-spacing:-0.5px;" class="amount-text">${amount}</p>
  </div>`;
}

function priceCompare(opts: { label1: string; price1: string; label2: string; price2: string }): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-spacing:10px;border-collapse:separate;margin-bottom:24px;">
    <tr>
      <td style="background:#f8fafc;border-radius:12px;padding:16px 18px;text-align:center;border:1px solid #e2e8f0;vertical-align:top;">
        <p style="margin:0 0 6px;font-size:9px;font-weight:700;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;">${opts.label1}</p>
        <p style="margin:0;font-size:20px;font-weight:800;color:#94a3b8;text-decoration:line-through;">${opts.price1}</p>
      </td>
      <td style="background:#0f172a;border-radius:12px;padding:16px 18px;text-align:center;vertical-align:top;">
        <p style="margin:0 0 6px;font-size:9px;font-weight:700;color:#475569;letter-spacing:2px;text-transform:uppercase;">${opts.label2}</p>
        <p style="margin:0;font-size:20px;font-weight:800;color:#f8fafc;">${opts.price2}</p>
      </td>
    </tr>
  </table>`;
}

function stepsList(steps: string[], style: { bg: string; border: string; titleColor: string; textColor: string; numColor: string }): string {
  const rows = steps.map((s, i) =>
    `<tr><td style="padding:5px 0;">
      <table cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr>
        <td style="width:24px;vertical-align:top;padding-top:1px;">
          <span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:${style.numColor};color:#ffffff;font-size:11px;font-weight:800;text-align:center;line-height:20px;">${i + 1}</span>
        </td>
        <td style="font-size:13px;color:${style.textColor};line-height:1.65;padding-left:6px;">${s}</td>
      </tr></table>
    </td></tr>`
  ).join('');
  return `<div style="background:${style.bg};border:1px solid ${style.border};border-radius:12px;padding:18px 20px;margin-bottom:24px;">
    <p style="margin:0 0 12px;font-size:10px;font-weight:800;color:${style.titleColor};letter-spacing:1.5px;text-transform:uppercase;">接下来怎么做</p>
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%">${rows}</table>
  </div>`;
}

function tipBlock(text: string, type: 'info' | 'warn' | 'success' | 'danger' = 'info'): string {
  const map = {
    info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a8a', icon: 'ℹ' },
    warn:    { bg: '#fefce8', border: '#fde68a', text: '#78350f', icon: '!' },
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#14532d', icon: '✓' },
    danger:  { bg: '#fef2f2', border: '#fecaca', text: '#7f1d1d', icon: '✕' },
  };
  const s = map[type];
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
    <tr>
      <td style="background:${s.bg};border:1px solid ${s.border};border-radius:10px;padding:14px 16px;vertical-align:top;">
        <table cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr>
          <td style="width:28px;vertical-align:top;padding-top:1px;"><span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:${s.border};color:${s.text};font-size:12px;font-weight:900;text-align:center;line-height:22px;">${s.icon}</span></td>
          <td style="font-size:13px;color:${s.text};line-height:1.65;padding-left:8px;">${text}</td>
        </tr></table>
      </td>
    </tr>
  </table>`;
}

function buyerMessageBlock(message: string, label = '买家留言'): string {
  return `<div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin-bottom:22px;border-left:3px solid #e2e8f0;">
    <p style="margin:0 0 6px;font-size:9px;font-weight:700;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;">${label}</p>
    <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;font-style:italic;">&ldquo;${message}&rdquo;</p>
  </div>`;
}

function platformNote(siteDomain: string): string {
  return `<div style="border-radius:10px;padding:14px 18px;margin-bottom:4px;text-align:center;border:1px solid #f1f5f9;background:#f8fafc;">
    <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6;">&#128274; <strong style="color:#0f172a;">请通过平台进行所有交流</strong> &mdash; 私下接触不受平台保护，请在 <a href="${siteDomain}/user-center" style="color:#0f172a;font-weight:700;text-decoration:none;">消息中心</a> 与对方安全沟通</p>
  </div>`;
}

// ─── 场景 1：买家提交报价 → 发给卖家 ──────────────────────────────────────

export function sellerNewOfferEmail(opts: {
  domainName: string;
  amount: string;
  buyerMessage?: string;
  brand: BrandConfig;
}): { subject: string; html: string } {
  const { domainName, amount, buyerMessage, brand } = opts;
  const ctaUrl = `${brand.siteDomain}/user-center?tab=received-offers`;

  const body = [
    progressBar(2),
    domainDisplay(domainName),
    amountDisplay('买家报价金额', amount),
    buyerMessage ? buyerMessageBlock(buyerMessage, '买家留言') : '',
    stepsList([
      '登录平台，进入「用户中心 → 收到的报价」',
      '审阅买家报价，可选择接受、拒绝或提出还价',
      '接受报价后系统自动生成交易记录并通知买家',
    ], { bg: '#f0fdf4', border: '#bbf7d0', titleColor: '#166534', textColor: '#166534', numColor: '#22c55e' }),
    platformNote(brand.siteDomain),
  ].join('');

  return {
    subject: `域名 ${domainName.toUpperCase()} 收到新报价 ${amount}`,
    html: shell({
      previewText: `您的域名 ${domainName} 收到了 ${amount} 的报价，请尽快登录处理`,
      accentColor: '#0f172a',
      icon: '&#128176;',
      iconBg: '#f0fdf4',
      title: '您的域名收到了新报价',
      subtitle: `有买家对您的域名 ${domainName.toUpperCase()} 发起了报价，请登录处理`,
      body,
      ctaLabel: '立即查看并处理报价',
      ctaUrl,
      brand,
    }),
  };
}

// ─── 场景 2：买家提交报价 → 发给买家（确认） ──────────────────────────────

export function buyerOfferConfirmEmail(opts: {
  domainName: string;
  amount: string;
  buyerMessage?: string;
  brand: BrandConfig;
}): { subject: string; html: string } {
  const { domainName, amount, buyerMessage, brand } = opts;
  const ctaUrl = `${brand.siteDomain}/user-center?tab=sent-offers`;

  const body = [
    progressBar(1),
    domainDisplay(domainName),
    amountDisplay('您的报价金额', amount),
    buyerMessage ? buyerMessageBlock(buyerMessage, '您的留言') : '',
    tipBlock('报价已成功发送给卖家，请耐心等待。卖家回复后您将同时收到站内通知及邮件提醒。', 'info'),
    stepsList([
      '等待卖家审阅您的报价（通常 24 小时内回复）',
      '卖家接受后系统自动生成交易订单',
      '按照交易指引完成付款，平台全程托管资金',
    ], { bg: '#eff6ff', border: '#bfdbfe', titleColor: '#1e40af', textColor: '#1e3a8a', numColor: '#3b82f6' }),
    platformNote(brand.siteDomain),
  ].join('');

  return {
    subject: `报价已提交：${domainName.toUpperCase()} ${amount}`,
    html: shell({
      previewText: `您对 ${domainName} 的 ${amount} 报价已成功发送，等待卖家回复`,
      accentColor: '#3b82f6',
      icon: '&#128228;',
      iconBg: '#eff6ff',
      title: '报价已成功提交',
      subtitle: `您对 ${domainName.toUpperCase()} 的报价已发送至卖家，请等待回复`,
      body,
      ctaLabel: '查看我的报价记录',
      ctaUrl,
      brand,
    }),
  };
}

// ─── 场景 3：卖家还价 → 发给买家 ──────────────────────────────────────────

export function buyerCounterOfferEmail(opts: {
  domainName: string;
  originalAmount: string;
  counterAmount: string;
  counterNote?: string;
  brand: BrandConfig;
}): { subject: string; html: string } {
  const { domainName, originalAmount, counterAmount, counterNote, brand } = opts;
  const ctaUrl = `${brand.siteDomain}/user-center?tab=sent-offers`;

  const body = [
    progressBar(2),
    domainDisplay(domainName),
    priceCompare({ label1: '您的出价', price1: originalAmount, label2: '卖家还价', price2: counterAmount }),
    counterNote ? buyerMessageBlock(counterNote, '卖家备注') : '',
    `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:10px;font-weight:800;color:#0f172a;letter-spacing:1.5px;text-transform:uppercase;">您的选择</p>
      <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
        <tr><td style="padding:6px 0;font-size:13px;color:#475569;line-height:1.6;"><span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:#dcfce7;color:#16a34a;font-size:12px;font-weight:900;text-align:center;line-height:22px;margin-right:10px;vertical-align:middle;">&#10003;</span>接受卖家还价，以 ${counterAmount} 达成交易</td></tr>
        <tr><td style="padding:6px 0;font-size:13px;color:#475569;line-height:1.6;"><span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:#fee2e2;color:#dc2626;font-size:12px;font-weight:900;text-align:center;line-height:22px;margin-right:10px;vertical-align:middle;">&times;</span>拒绝还价，本次协商结束</td></tr>
      </table>
    </div>`,
    platformNote(brand.siteDomain),
  ].join('');

  return {
    subject: `卖家还价：${domainName.toUpperCase()} — 还价 ${counterAmount}`,
    html: shell({
      previewText: `卖家对您 ${originalAmount} 的报价还价为 ${counterAmount}，请登录查看并决定`,
      accentColor: '#1d4ed8',
      icon: '&#128172;',
      iconBg: '#eff6ff',
      title: '卖家提出了还价',
      subtitle: `卖家对您的报价作出回应，请登录查看并作出决定`,
      body,
      ctaLabel: '查看还价并回复',
      ctaUrl,
      brand,
    }),
  };
}

// ─── 场景 4：卖家接受报价 → 发给买家 ──────────────────────────────────────

export function buyerOfferAcceptedEmail(opts: {
  domainName: string;
  amount: string;
  transactionId?: string;
  brand: BrandConfig;
}): { subject: string; html: string } {
  const { domainName, amount, brand } = opts;
  const ctaUrl = `${brand.siteDomain}/user-center?tab=transactions`;

  const body = [
    progressBar(3),
    domainDisplay(domainName),
    amountDisplay('已确认成交价格', amount, '#16a34a'),
    stepsList([
      '点击下方按钮进入交易详情页',
      '按照指引通过平台官方渠道完成付款（平台全程监管资金）',
      '平台确认到款后，即刻启动域名过户流程',
      '域名成功过户至您的账户，交易正式完成',
    ], { bg: '#f0fdf4', border: '#bbf7d0', titleColor: '#166534', textColor: '#166534', numColor: '#22c55e' }),
    tipBlock('请务必通过平台官方渠道完成付款，切勿向卖家进行私下转账，以免资金损失。如遇问题请随时联系平台客服。', 'success'),
    platformNote(brand.siteDomain),
  ].join('');

  return {
    subject: `恭喜！报价已接受：${domainName.toUpperCase()} ${amount}`,
    html: shell({
      previewText: `恭喜！卖家接受了您对 ${domainName} 的 ${amount} 报价，请尽快完成付款`,
      accentColor: '#16a34a',
      icon: '&#127881;',
      iconBg: '#f0fdf4',
      title: '报价已被卖家接受',
      subtitle: `恭喜，您与卖家就 ${domainName.toUpperCase()} 达成了交易意向，请尽快完成付款`,
      body,
      ctaLabel: '立即查看交易详情',
      ctaUrl,
      brand,
    }),
  };
}

// ─── 场景 5：买家接受还价 → 发给卖家 ──────────────────────────────────────

export function sellerCounterAcceptedEmail(opts: {
  domainName: string;
  amount: string;
  brand: BrandConfig;
}): { subject: string; html: string } {
  const { domainName, amount, brand } = opts;
  const ctaUrl = `${brand.siteDomain}/user-center?tab=transactions`;

  const body = [
    progressBar(3),
    domainDisplay(domainName),
    amountDisplay('已确认成交价格', amount, '#16a34a'),
    stepsList([
      '系统已自动生成交易记录，可在用户中心查看',
      '等待买家通过平台渠道完成付款',
      '平台确认到款后将通知您启动域名过户',
      '域名过户完成后，款项将结算至您的账户',
    ], { bg: '#f0fdf4', border: '#bbf7d0', titleColor: '#166534', textColor: '#166534', numColor: '#22c55e' }),
    tipBlock('请通过平台消息中心与买家沟通，请勿私下交换联系方式，确保您的资金权益受平台全程保护。', 'success'),
    platformNote(brand.siteDomain),
  ].join('');

  return {
    subject: `买家已接受还价：${domainName.toUpperCase()} ${amount}`,
    html: shell({
      previewText: `买家接受了您对 ${domainName} 的 ${amount} 还价，等待买家完成付款`,
      accentColor: '#16a34a',
      icon: '&#129309;',
      iconBg: '#f0fdf4',
      title: '买家已接受您的还价',
      subtitle: `买家同意以 ${amount} 完成 ${domainName.toUpperCase()} 的交易，请等待付款`,
      body,
      ctaLabel: '查看交易详情',
      ctaUrl,
      brand,
    }),
  };
}

// ─── 场景 6：报价被拒绝 → 发给买家 ────────────────────────────────────────

export function buyerOfferRejectedEmail(opts: {
  domainName: string;
  amount: string;
  brand: BrandConfig;
}): { subject: string; html: string } {
  const { domainName, amount, brand } = opts;
  const ctaUrl = `${brand.siteDomain}/user-center?tab=sent-offers`;

  const body = [
    terminatedBar('rejected', '卖家拒绝'),
    domainDisplay(domainName),
    amountDisplay('已拒绝的报价', amount, '#64748b'),
    tipBlock('卖家已正式拒绝此次报价，本次协商流程已关闭。相关记录将保存在您的报价历史中。', 'danger'),
    `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:10px;font-weight:800;color:#64748b;letter-spacing:1.5px;text-transform:uppercase;">相关说明</p>
      <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
        <tr><td style="padding:5px 0;font-size:13px;color:#64748b;line-height:1.6;"><span style="color:#94a3b8;margin-right:8px;font-weight:700;">&mdash;</span>卖家有权拒绝任何报价，无需说明理由</td></tr>
        <tr><td style="padding:5px 0;font-size:13px;color:#64748b;line-height:1.6;"><span style="color:#94a3b8;margin-right:8px;font-weight:700;">&mdash;</span>若有疑问，可通过平台消息中心联系卖家</td></tr>
        <tr><td style="padding:5px 0;font-size:13px;color:#64748b;line-height:1.6;"><span style="color:#94a3b8;margin-right:8px;font-weight:700;">&mdash;</span>您可继续浏览平台上的其他优质域名</td></tr>
      </table>
    </div>`,
    platformNote(brand.siteDomain),
  ].join('');

  return {
    subject: `报价未被接受：${domainName.toUpperCase()} ${amount}`,
    html: shell({
      previewText: `您对 ${domainName} 的 ${amount} 报价已被卖家拒绝，本次协商已结束`,
      accentColor: '#dc2626',
      icon: '&times;',
      iconBg: '#fef2f2',
      title: '您的报价已被拒绝',
      subtitle: `卖家拒绝了您对 ${domainName.toUpperCase()} 的本次报价，协商流程已关闭`,
      body,
      ctaLabel: '查看我的报价记录',
      ctaUrl,
      brand,
    }),
  };
}

// ─── 场景 7：买家拒绝还价 → 发给卖家 ──────────────────────────────────────

export function sellerCounterRejectedEmail(opts: {
  domainName: string;
  counterAmount: string;
  brand: BrandConfig;
}): { subject: string; html: string } {
  const { domainName, counterAmount, brand } = opts;
  const ctaUrl = `${brand.siteDomain}/user-center?tab=received-offers`;

  const body = [
    terminatedBar('rejected', '买家拒绝还价'),
    domainDisplay(domainName),
    amountDisplay('已拒绝的还价', counterAmount, '#64748b'),
    tipBlock('买家已正式拒绝您的还价，本次协商流程已关闭。报价记录将保留在您的账户中。', 'danger'),
    `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:10px;font-weight:800;color:#64748b;letter-spacing:1.5px;text-transform:uppercase;">相关说明</p>
      <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
        <tr><td style="padding:5px 0;font-size:13px;color:#64748b;line-height:1.6;"><span style="color:#94a3b8;margin-right:8px;font-weight:700;">&mdash;</span>买家已终止此轮协商，双方无需进一步操作</td></tr>
        <tr><td style="padding:5px 0;font-size:13px;color:#64748b;line-height:1.6;"><span style="color:#94a3b8;margin-right:8px;font-weight:700;">&mdash;</span>若有疑问，可通过平台消息中心与买家沟通</td></tr>
        <tr><td style="padding:5px 0;font-size:13px;color:#64748b;line-height:1.6;"><span style="color:#94a3b8;margin-right:8px;font-weight:700;">&mdash;</span>您的域名仍在正常挂牌，可接受其他买家报价</td></tr>
      </table>
    </div>`,
    platformNote(brand.siteDomain),
  ].join('');

  return {
    subject: `还价未被接受：${domainName.toUpperCase()} ${counterAmount}`,
    html: shell({
      previewText: `买家拒绝了您对 ${domainName} 的 ${counterAmount} 还价，本次协商已结束`,
      accentColor: '#dc2626',
      icon: '&times;',
      iconBg: '#fef2f2',
      title: '买家拒绝了您的还价',
      subtitle: `买家终止了就 ${domainName.toUpperCase()} 的本次协商，流程已关闭`,
      body,
      ctaLabel: '查看我的报价记录',
      ctaUrl,
      brand,
    }),
  };
}

// ─── 场景 8：报价已取消 → 发给卖家 ────────────────────────────────────────

export function sellerOfferCancelledEmail(opts: {
  domainName: string;
  amount: string;
  brand: BrandConfig;
}): { subject: string; html: string } {
  const { domainName, amount, brand } = opts;
  const ctaUrl = `${brand.siteDomain}/user-center?tab=received-offers`;

  const body = [
    terminatedBar('cancelled', '买家已取消'),
    domainDisplay(domainName),
    amountDisplay('已撤回的报价', amount, '#64748b'),
    `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:10px;font-weight:800;color:#64748b;letter-spacing:1.5px;text-transform:uppercase;">相关说明</p>
      <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
        <tr><td style="padding:5px 0;font-size:13px;color:#64748b;line-height:1.6;"><span style="color:#94a3b8;margin-right:8px;font-weight:700;">&mdash;</span>买家已主动撤回此次报价，本报价流程已关闭</td></tr>
        <tr><td style="padding:5px 0;font-size:13px;color:#64748b;line-height:1.6;"><span style="color:#94a3b8;margin-right:8px;font-weight:700;">&mdash;</span>取消操作由买家发起，与您的报价处理无关</td></tr>
        <tr><td style="padding:5px 0;font-size:13px;color:#64748b;line-height:1.6;"><span style="color:#94a3b8;margin-right:8px;font-weight:700;">&mdash;</span>如有疑问可通过平台消息中心与买家确认</td></tr>
      </table>
    </div>`,
    platformNote(brand.siteDomain),
  ].join('');

  return {
    subject: `报价已撤回：${domainName.toUpperCase()} ${amount}`,
    html: shell({
      previewText: `买家已撤回对域名 ${domainName} 的 ${amount} 报价申请`,
      accentColor: '#94a3b8',
      icon: '&#8212;',
      iconBg: '#f8fafc',
      title: '买家已撤回报价',
      subtitle: `买家主动撤回了对 ${domainName.toUpperCase()} 的本次报价，流程已关闭`,
      body,
      ctaLabel: '查看报价记录',
      ctaUrl,
      brand,
    }),
  };
}
