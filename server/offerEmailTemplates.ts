/**
 * NIC.BN — 报价流程邮件模板
 * 所有邮件均不含双方联系方式，仅引导通过平台沟通
 */

export interface BrandConfig {
  siteName: string;
  siteDomain: string;
  supportEmail: string;
}

// ─── 通用构建函数 ────────────────────────────────────────────────

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
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${title}</title>
  <style>
    body{margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;}
    .pre{display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;max-height:0;overflow:hidden;mso-hide:all;}
    a{color:inherit;}
    @media only screen and (max-width:600px){
      .wrap{padding:20px 12px!important;}
      .card-body{padding:28px 24px!important;}
      .card-head{padding:32px 24px 24px!important;}
    }
  </style>
</head>
<body>
<span class="pre">${previewText}</span>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f1f5f9;padding:40px 16px;" class="wrap">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;">

      <!-- Logo -->
      <tr><td style="padding-bottom:28px;text-align:center;">
        <a href="${siteDomain}" style="text-decoration:none;">
          <table cellpadding="0" cellspacing="0" role="presentation" style="display:inline-table;">
            <tr><td style="background:#0f172a;border-radius:12px;padding:10px 22px;display:flex;align-items:center;gap:10px;">
              <span style="color:#f8fafc;font-size:21px;font-weight:900;letter-spacing:-0.5px;">${siteName}</span>
              <span style="color:#475569;font-size:10px;font-weight:700;margin-left:12px;letter-spacing:3px;text-transform:uppercase;">${host}</span>
            </td></tr>
          </table>
        </a>
      </td></tr>

      <!-- Card -->
      <tr><td style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,0.08),0 2px 6px rgba(15,23,42,0.04);">

        <!-- Accent top bar -->
        <div style="height:4px;background:${accentColor};"></div>

        <!-- Header -->
        <div style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #f1f5f9;" class="card-head">
          <div style="width:72px;height:72px;background:${iconBg};border-radius:20px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:22px;font-size:36px;border:1px solid rgba(0,0,0,0.06);">${icon}</div>
          <h1 style="margin:0 0 10px;font-size:26px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;">${title}</h1>
          <p style="margin:0;font-size:15px;color:#64748b;line-height:1.6;">${subtitle}</p>
        </div>

        <!-- Body -->
        <div style="padding:36px 40px;" class="card-body">
          ${body}

          <!-- CTA -->
          <div style="text-align:center;padding:8px 0 4px;">
            <a href="${ctaUrl}" style="display:inline-block;background:#0f172a;color:#f8fafc;padding:16px 44px;border-radius:12px;font-size:15px;font-weight:800;text-decoration:none;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(15,23,42,0.25);">${ctaLabel} →</a>
          </div>
        </div>

        <!-- Card footer -->
        <div style="padding:20px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
          <p style="margin:0;font-size:13px;color:#94a3b8;">
            ${footerNote || `如有疑问，请通过平台消息中心联系支持团队，或发送邮件至 <a href="mailto:${supportEmail}" style="color:#475569;font-weight:700;text-decoration:none;">${supportEmail}</a>`}
          </p>
        </div>

      </td></tr>

      <!-- Bottom footer -->
      <tr><td style="padding:28px 20px 0;text-align:center;">
        <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;letter-spacing:0.3px;">© ${year} ${siteName} · ${host} · 本邮件由系统自动发送，请勿直接回复</p>
        <p style="margin:0;font-size:11px;color:#cbd5e1;">所有交易沟通请通过 <a href="${siteDomain}/user-center" style="color:#94a3b8;text-decoration:none;font-weight:600;">平台消息中心</a> 进行，平台不承担私下交流产生的风险</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/** 交易流程进度条 HTML */
function progressBar(currentStep: 1 | 2 | 3 | 4): string {
  const steps = [
    { label: '提交报价', sub: '买家' },
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
    const dot = done ? '✓' : String(n);
    return `<td style="text-align:center;width:25%;">
      <div style="width:36px;height:36px;border-radius:50%;background:${dotBg};color:${dotColor};font-size:14px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;margin-bottom:8px;">${dot}</div>
      <p style="margin:0;font-size:12px;font-weight:700;color:${labelColor};">${s.label}</p>
      <p style="margin:2px 0 0;font-size:10px;color:${subColor};">${s.sub}</p>
    </td>`;
  });

  const lines = [0, 1, 2].map(i => {
    const done = (i + 1) < currentStep;
    return `<td style="padding:0 4px;vertical-align:middle;">
      <div style="height:2px;background:${done ? '#16a34a' : '#e2e8f0'};border-radius:2px;margin-bottom:28px;"></div>
    </td>`;
  });

  // Interleave steps with connector lines
  const cells = [];
  for (let i = 0; i < 4; i++) {
    cells.push(items[i]);
    if (i < 3) cells.push(lines[i]);
  }

  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
    <tr>${cells.join('')}</tr>
  </table>`;
}

/** 金额对比块（原报价 vs 还价） */
function priceCompare(opts: { label1: string; price1: string; label2: string; price2: string }): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="border-spacing:10px;border-collapse:separate;margin-bottom:24px;">
    <tr>
      <td style="background:#f1f5f9;border-radius:12px;padding:18px 20px;text-align:center;width:50%;border:1px solid #e2e8f0;">
        <p style="margin:0 0 6px;font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;">${opts.label1}</p>
        <p style="margin:0;font-size:22px;font-weight:800;color:#94a3b8;text-decoration:line-through;">${opts.price1}</p>
      </td>
      <td style="background:#0f172a;border-radius:12px;padding:18px 20px;text-align:center;width:50%;">
        <p style="margin:0 0 6px;font-size:10px;font-weight:700;color:#475569;letter-spacing:1.5px;text-transform:uppercase;">${opts.label2}</p>
        <p style="margin:0;font-size:22px;font-weight:800;color:#f8fafc;">${opts.price2}</p>
      </td>
    </tr>
  </table>`;
}

/** 域名展示块 */
function domainDisplay(name: string): string {
  return `<div style="background:#f8fafc;border-radius:14px;padding:20px 24px;text-align:center;margin-bottom:24px;border:1px solid #e2e8f0;">
    <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;">洽谈域名</p>
    <p style="margin:0;font-size:28px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;">${name.toUpperCase()}</p>
  </div>`;
}

/** 金额展示块 */
function amountDisplay(label: string, amount: string, color = '#0f172a'): string {
  return `<div style="background:#f8fafc;border-radius:12px;padding:18px 24px;margin-bottom:24px;border:1px solid #e2e8f0;">
    <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;">${label}</p>
    <p style="margin:0;font-size:32px;font-weight:900;color:${color};letter-spacing:-1px;">${amount}</p>
  </div>`;
}

/** 步骤说明块 */
function nextStepsBlock(steps: string[], color: { bg: string; border: string; title: string; text: string; icon: string }): string {
  const rows = steps.map((s, i) =>
    `<tr><td style="padding:4px 0;font-size:13px;color:${color.text};line-height:1.6;">
      <span style="font-weight:800;margin-right:8px;color:${color.icon};">0${i + 1}</span>${s}
    </td></tr>`
  ).join('');
  return `<div style="background:${color.bg};border:1px solid ${color.border};border-radius:12px;padding:20px 22px;margin-bottom:24px;">
    <p style="margin:0 0 12px;font-size:11px;font-weight:800;color:${color.title};letter-spacing:1.5px;text-transform:uppercase;">接下来怎么做</p>
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%">${rows}</table>
  </div>`;
}

/** 提示栏 */
function tipBlock(text: string, type: 'info' | 'warn' | 'success' | 'danger' = 'info'): string {
  const map = {
    info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a8a', icon: 'ℹ️' },
    warn:    { bg: '#fefce8', border: '#fde68a', text: '#78350f', icon: '⚠️' },
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#14532d', icon: '✅' },
    danger:  { bg: '#fef2f2', border: '#fecaca', text: '#7f1d1d', icon: '🔔' },
  };
  const s = map[type];
  return `<div style="background:${s.bg};border:1px solid ${s.border};border-radius:10px;padding:14px 18px;margin-bottom:20px;display:flex;gap:10px;align-items:flex-start;">
    <span style="font-size:16px;flex-shrink:0;">${s.icon}</span>
    <p style="margin:0;font-size:13px;color:${s.text};line-height:1.65;">${text}</p>
  </div>`;
}

/** 卖家备注块 */
function sellerNote(note: string): string {
  return `<div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;margin-bottom:22px;">
    <p style="margin:0 0 6px;font-size:10px;font-weight:800;color:#854d0e;letter-spacing:1.5px;text-transform:uppercase;">卖家备注</p>
    <p style="margin:0;font-size:14px;color:#713f12;line-height:1.7;font-style:italic;">"${note}"</p>
  </div>`;
}

/** 平台沟通提示 */
function platformNote(siteDomain: string): string {
  return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px;margin-bottom:24px;text-align:center;">
    <p style="margin:0;font-size:12px;color:#64748b;">🔒 <strong>请通过平台进行所有交流</strong> — 私下接触不受平台保护，请在 <a href="${siteDomain}/user-center" style="color:#0f172a;font-weight:700;text-decoration:none;">消息中心</a> 与对方安全沟通</p>
  </div>`;
}

// ─── 场景 1：买家提交报价 → 发给卖家 ────────────────────────────

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
    amountDisplay('买家报价金额', amount, '#0f172a'),
    buyerMessage ? `<div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin-bottom:22px;border:1px solid #e2e8f0;">
      <p style="margin:0 0 6px;font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;">买家留言</p>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;">"${buyerMessage}"</p>
    </div>` : '',
    nextStepsBlock([
      '登录平台，进入「用户中心 → 收到的报价」',
      '审阅买家报价，选择接受、拒绝或还价',
      '接受报价后系统自动生成交易记录',
    ], { bg: '#f0fdf4', border: '#bbf7d0', title: '#166534', text: '#166534', icon: '#22c55e' }),
    platformNote(brand.siteDomain),
  ].join('');

  return {
    subject: `💰 域名 ${domainName.toUpperCase()} 收到新报价 ${amount}`,
    html: shell({
      previewText: `您的域名 ${domainName} 收到了 ${amount} 的新报价，请登录处理`,
      accentColor: '#0f172a',
      icon: '💰',
      iconBg: '#f0fdf4',
      title: '您收到了新报价',
      subtitle: `有买家对您的域名 ${domainName.toUpperCase()} 感兴趣，请尽快处理`,
      body,
      ctaLabel: '立即查看并处理报价',
      ctaUrl,
      brand,
    }),
  };
}

// ─── 场景 2：买家提交报价 → 发给买家（确认） ────────────────────

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
    buyerMessage ? `<div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin-bottom:22px;border:1px solid #e2e8f0;">
      <p style="margin:0 0 6px;font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;">您的留言</p>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;">"${buyerMessage}"</p>
    </div>` : '',
    tipBlock('您的报价已发送给卖家，请耐心等待卖家回复。卖家回复后您将收到站内通知及邮件提醒。', 'info'),
    nextStepsBlock([
      '等待卖家审阅您的报价（通常 24 小时内回复）',
      '卖家接受后，系统自动生成交易订单',
      '按照交易流程完成付款，平台监管资金安全',
    ], { bg: '#eff6ff', border: '#bfdbfe', title: '#1e40af', text: '#1e3a8a', icon: '#3b82f6' }),
    platformNote(brand.siteDomain),
  ].join('');

  return {
    subject: `✅ 报价已提交：${domainName.toUpperCase()} — ${amount}`,
    html: shell({
      previewText: `您对域名 ${domainName} 的 ${amount} 报价已成功提交，等待卖家回复`,
      accentColor: '#3b82f6',
      icon: '📤',
      iconBg: '#eff6ff',
      title: '报价提交成功',
      subtitle: `您对 ${domainName.toUpperCase()} 的报价已发送，卖家将尽快回复`,
      body,
      ctaLabel: '查看我发出的报价',
      ctaUrl,
      brand,
    }),
  };
}

// ─── 场景 3：卖家还价 → 发给买家 ────────────────────────────────

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
    counterNote ? sellerNote(counterNote) : '',
    `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 22px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:800;color:#0f172a;letter-spacing:1px;text-transform:uppercase;">您的选择</p>
      <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
        <tr><td style="padding:5px 0;font-size:13px;color:#475569;"><span style="font-weight:800;margin-right:10px;color:#16a34a;">✓</span>接受卖家还价，以 ${counterAmount} 达成交易</td></tr>
        <tr><td style="padding:5px 0;font-size:13px;color:#475569;"><span style="font-weight:800;margin-right:10px;color:#dc2626;">✕</span>拒绝还价，本次协商结束</td></tr>
      </table>
    </div>`,
    platformNote(brand.siteDomain),
  ].join('');

  return {
    subject: `💬 卖家还价：${domainName.toUpperCase()} — 还价 ${counterAmount}`,
    html: shell({
      previewText: `卖家对您 ${originalAmount} 的报价还价为 ${counterAmount}，请登录查看`,
      accentColor: '#1d4ed8',
      icon: '💬',
      iconBg: '#eff6ff',
      title: '卖家已还价',
      subtitle: `卖家对您的报价作出回应，请尽快登录处理`,
      body,
      ctaLabel: '查看还价并回复',
      ctaUrl,
      brand,
    }),
  };
}

// ─── 场景 4：卖家接受报价 → 发给买家 ────────────────────────────

export function buyerOfferAcceptedEmail(opts: {
  domainName: string;
  amount: string;
  transactionId?: string;
  brand: BrandConfig;
}): { subject: string; html: string } {
  const { domainName, amount, transactionId, brand } = opts;
  const ctaUrl = transactionId
    ? `${brand.siteDomain}/user-center?tab=transactions`
    : `${brand.siteDomain}/user-center?tab=transactions`;

  const body = [
    progressBar(3),
    domainDisplay(domainName),
    amountDisplay('成交价格', amount, '#16a34a'),
    nextStepsBlock([
      '点击下方按钮进入交易详情',
      '按照指引完成付款（平台全程监管）',
      '平台确认收款后启动域名过户流程',
      '域名成功过户，交易完成',
    ], { bg: '#f0fdf4', border: '#bbf7d0', title: '#166534', text: '#166534', icon: '#22c55e' }),
    tipBlock('付款请通过平台官方渠道进行，请勿向卖家私下转账，避免资金风险。如有疑问请联系平台客服。', 'success'),
    platformNote(brand.siteDomain),
  ].join('');

  return {
    subject: `🎉 恭喜！报价已接受：${domainName.toUpperCase()} — ${amount}`,
    html: shell({
      previewText: `恭喜！卖家接受了您对 ${domainName} 的 ${amount} 报价，请尽快完成付款`,
      accentColor: '#16a34a',
      icon: '🎉',
      iconBg: '#f0fdf4',
      title: '报价已被接受！',
      subtitle: `恭喜，卖家接受了您的报价，交易已正式启动`,
      body,
      ctaLabel: '立即查看交易详情',
      ctaUrl,
      brand,
    }),
  };
}

// ─── 场景 5：买家接受还价 → 发给卖家 ────────────────────────────

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
    amountDisplay('成交价格', amount, '#16a34a'),
    nextStepsBlock([
      '系统已自动生成交易记录',
      '等待买家完成平台付款',
      '平台确认收款后通知您启动域名过户',
      '域名成功过户后，款项将转入您的账户',
    ], { bg: '#f0fdf4', border: '#bbf7d0', title: '#166534', text: '#166534', icon: '#22c55e' }),
    tipBlock('请通过平台消息中心与买家沟通，不要私下交换联系方式，确保资金安全受平台保护。', 'success'),
    platformNote(brand.siteDomain),
  ].join('');

  return {
    subject: `🎉 买家接受还价：${domainName.toUpperCase()} — ${amount}`,
    html: shell({
      previewText: `买家接受了您对 ${domainName} 的还价 ${amount}，请等待买家完成付款`,
      accentColor: '#16a34a',
      icon: '🤝',
      iconBg: '#f0fdf4',
      title: '买家已接受您的还价',
      subtitle: `太好了！买家同意以 ${amount} 完成交易`,
      body,
      ctaLabel: '查看交易详情',
      ctaUrl,
      brand,
    }),
  };
}

// ─── 场景 6：报价被拒绝 → 发给买家 ─────────────────────────────

export function buyerOfferRejectedEmail(opts: {
  domainName: string;
  amount: string;
  brand: BrandConfig;
}): { subject: string; html: string } {
  const { domainName, amount, brand } = opts;
  const ctaUrl = `${brand.siteDomain}/marketplace`;

  const body = [
    progressBar(2),
    domainDisplay(domainName),
    amountDisplay('您的报价金额', amount),
    tipBlock('卖家未接受本次报价，域名仍在挂牌中，您可以调整价格后重新报价，或联系平台客服协助协商。', 'warn'),
    `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 22px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:800;color:#0f172a;letter-spacing:1px;text-transform:uppercase;">您可以</p>
      <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
        <tr><td style="padding:5px 0;font-size:13px;color:#475569;"><span style="font-weight:800;margin-right:10px;color:#0f172a;">→</span>适当提高报价后重新提交</td></tr>
        <tr><td style="padding:5px 0;font-size:13px;color:#475569;"><span style="font-weight:800;margin-right:10px;color:#0f172a;">→</span>通过平台消息功能与卖家进一步沟通</td></tr>
        <tr><td style="padding:5px 0;font-size:13px;color:#475569;"><span style="font-weight:800;margin-right:10px;color:#0f172a;">→</span>浏览其他类似域名</td></tr>
      </table>
    </div>`,
    platformNote(brand.siteDomain),
  ].join('');

  return {
    subject: `报价结果通知：${domainName.toUpperCase()} — 未能达成交易`,
    html: shell({
      previewText: `很遗憾，您对 ${domainName} 的 ${amount} 报价未被卖家接受`,
      accentColor: '#64748b',
      icon: '📋',
      iconBg: '#f8fafc',
      title: '本次报价未能达成',
      subtitle: `域名仍在挂牌中，您可以调整后继续洽谈`,
      body,
      ctaLabel: '继续浏览域名市场',
      ctaUrl,
      brand,
    }),
  };
}

// ─── 场景 7：买家拒绝还价 → 发给卖家 ────────────────────────────

export function sellerCounterRejectedEmail(opts: {
  domainName: string;
  counterAmount: string;
  brand: BrandConfig;
}): { subject: string; html: string } {
  const { domainName, counterAmount, brand } = opts;
  const ctaUrl = `${brand.siteDomain}/user-center?tab=received-offers`;

  const body = [
    progressBar(2),
    domainDisplay(domainName),
    amountDisplay('您的还价金额', counterAmount),
    tipBlock('买家拒绝了您的还价，本次协商结束。买家仍可重新提交报价，请保持域名挂牌。', 'warn'),
    `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 22px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:800;color:#0f172a;letter-spacing:1px;text-transform:uppercase;">建议</p>
      <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
        <tr><td style="padding:5px 0;font-size:13px;color:#475569;"><span style="font-weight:800;margin-right:10px;color:#0f172a;">→</span>等待买家重新提交报价</td></tr>
        <tr><td style="padding:5px 0;font-size:13px;color:#475569;"><span style="font-weight:800;margin-right:10px;color:#0f172a;">→</span>检查域名定价是否合理</td></tr>
        <tr><td style="padding:5px 0;font-size:13px;color:#475569;"><span style="font-weight:800;margin-right:10px;color:#0f172a;">→</span>通过平台消息功能主动沟通</td></tr>
      </table>
    </div>`,
    platformNote(brand.siteDomain),
  ].join('');

  return {
    subject: `买家拒绝还价：${domainName.toUpperCase()} — ${counterAmount}`,
    html: shell({
      previewText: `买家拒绝了您对 ${domainName} 的 ${counterAmount} 还价，本次协商结束`,
      accentColor: '#64748b',
      icon: '📋',
      iconBg: '#f8fafc',
      title: '买家拒绝了还价',
      subtitle: `本次协商结束，域名仍在挂牌中`,
      body,
      ctaLabel: '查看所有报价',
      ctaUrl,
      brand,
    }),
  };
}

// ─── 场景 8：报价已取消 → 发给卖家 ──────────────────────────────

export function sellerOfferCancelledEmail(opts: {
  domainName: string;
  amount: string;
  brand: BrandConfig;
}): { subject: string; html: string } {
  const { domainName, amount, brand } = opts;
  const ctaUrl = `${brand.siteDomain}/user-center?tab=received-offers`;

  const body = [
    domainDisplay(domainName),
    amountDisplay('已取消的报价', amount),
    tipBlock('买家已主动取消了此次报价。域名仍在正常挂牌，等待下一个买家。', 'info'),
    platformNote(brand.siteDomain),
  ].join('');

  return {
    subject: `报价已取消：${domainName.toUpperCase()} — ${amount}`,
    html: shell({
      previewText: `买家取消了对域名 ${domainName} 的 ${amount} 报价`,
      accentColor: '#94a3b8',
      icon: '📌',
      iconBg: '#f8fafc',
      title: '买家已取消报价',
      subtitle: `域名持续挂牌中，等待新的买家报价`,
      body,
      ctaLabel: '查看域名报价记录',
      ctaUrl,
      brand,
    }),
  };
}
