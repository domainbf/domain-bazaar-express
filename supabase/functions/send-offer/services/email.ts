
import { OfferRequest } from '../utils/types.ts';
import { sendMailWithResend } from '../../utils/sendMailWithResend.ts';
import { getUserEmailHtml } from '../templates/userOfferTemplate.ts';
import { getOwnerEmailHtml } from '../templates/ownerOfferTemplate.ts';

const SYMBOLS: Record<string, string> = {
  CNY: '¥', USD: '$', EUR: '€', GBP: '£', JPY: '¥', HKD: 'HK$',
  SGD: 'S$', AUD: 'A$', CAD: 'C$', KRW: '₩', TWD: 'NT$', THB: '฿',
};

export async function sendOfferEmails({
  domain,
  offer,
  email,
  message,
  buyerId,
  dashboardUrl,
  domainOwnerEmail,
  currency,
  currencySymbol,
  formattedOffer,
}: OfferRequest & { domainOwnerEmail?: string | null }) {
  const cur = (currency || 'CNY').toUpperCase();
  const sym = currencySymbol || SYMBOLS[cur] || '';
  const n = typeof offer === 'number' ? offer : parseFloat(String(offer)) || 0;
  const display = formattedOffer || `${sym}${n.toLocaleString()} ${cur}`;

  console.log("开始发送报价邮件...", { domain, display, email, domainOwnerEmail });

  const finalDashboardUrl = dashboardUrl || "/user-center?tab=domains";

  const userEmailHtml = getUserEmailHtml(domain, String(offer), message, finalDashboardUrl, { currency: cur, symbol: sym, display });
  const ownerEmailHtml = getOwnerEmailHtml(domain, String(offer), email, message, buyerId, finalDashboardUrl, { currency: cur, symbol: sym, display });

  // 允许通过 OFFER_MAIL_FROM 覆盖；未配置时回落到 Resend 默认 sender，避免整封失败。
  const from = Deno.env.get('OFFER_MAIL_FROM') || '域见•你 域名交易平台 <onboarding@resend.dev>';

  try {
    const userEmailResponse = await sendMailWithResend(
      email,
      `✅ 您对 ${domain} 的报价已收到 - ${display}`,
      userEmailHtml,
      { from }
    );

    let ownerEmailResponse: any = null;
    if (domainOwnerEmail) {
      ownerEmailResponse = await sendMailWithResend(
        domainOwnerEmail,
        `💰 ${domain} 收到新报价：${display}`,
        ownerEmailHtml,
        { from }
      );
    } else {
      console.warn("卖家邮箱缺失，已跳过卖家通知邮件");
    }

    return { userEmailResponse, ownerEmailResponse };
  } catch (error: any) {
    console.error("报价邮件发送失败:", error);
    throw new Error(`邮件发送失败: ${error.message}`);
  }
}
