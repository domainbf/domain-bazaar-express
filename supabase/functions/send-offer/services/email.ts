
import { OfferRequest } from '../utils/types.ts';
import { sendMailWithResend } from '../../utils/sendMailWithResend.ts';
import { getUserEmailHtml } from '../templates/userOfferTemplate.ts';
import { getOwnerEmailHtml } from '../templates/ownerOfferTemplate.ts';

export async function sendOfferEmails({
  domain,
  offer,
  email,
  message,
  buyerId,
  dashboardUrl,
  domainOwnerEmail,
}: OfferRequest & { domainOwnerEmail: string }) {
  // Use nic.bn as the primary domain for dashboard URL
  const finalDashboardUrl = dashboardUrl && dashboardUrl.includes('nic.bn') 
    ? dashboardUrl 
    : "https://nic.bn/user-center?tab=domains";

  const userEmailHtml = getUserEmailHtml(domain, offer, message, finalDashboardUrl);
  const ownerEmailHtml = getOwnerEmailHtml(domain, offer, email, message, buyerId, finalDashboardUrl);

  // 使用已验证的 sale.nic.bn 域名
  const from = "NIC.BN 域名交易平台 <noreply@sale.nic.bn>";

  // The new utility will throw a detailed error on failure, which is caught by the main function.
  const userEmailResponse = await sendMailWithResend(
    email,
    `✅ 您对 ${domain} 的报价已收到 - ¥${offer}`,
    userEmailHtml,
    { from }
  );

  const ownerEmailResponse = await sendMailWithResend(
    domainOwnerEmail,
    `💰 ${domain} 收到新报价：¥${offer}`,
    ownerEmailHtml,
    { from }
  );

  return { userEmailResponse, ownerEmailResponse };
}
