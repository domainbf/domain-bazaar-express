
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
}: OfferRequest & { domainOwnerEmail?: string | null }) {
  console.log("开始发送报价邮件...");
  console.log("发送参数:", { domain, offer, email, domainOwnerEmail });
  
  // 使用 nic.bn 作为主域名
  const finalDashboardUrl = dashboardUrl && dashboardUrl.includes('nic.bn') 
    ? dashboardUrl 
    : "https://nic.bn/user-center?tab=domains";

  const userEmailHtml = getUserEmailHtml(domain, offer, message, finalDashboardUrl);
  const ownerEmailHtml = getOwnerEmailHtml(domain, offer, email, message, buyerId, finalDashboardUrl);

  // 使用已验证的 sale.nic.bn 域名
  const from = "NIC.BN 域名交易平台 <noreply@sale.nic.bn>";

  try {
    // 发送给买家的确认邮件
    console.log("发送买家确认邮件到:", email);
    const userEmailResponse = await sendMailWithResend(
      email,
      `✅ 您对 ${domain} 的报价已收到 - ¥${offer}`,
      userEmailHtml,
      { from }
    );
    console.log("买家邮件发送成功:", userEmailResponse.data?.id);

    let ownerEmailResponse: any = null;
    if (domainOwnerEmail) {
      console.log("发送卖家通知邮件到:", domainOwnerEmail);
      ownerEmailResponse = await sendMailWithResend(
        domainOwnerEmail,
        `💰 ${domain} 收到新报价：¥${offer}`,
        ownerEmailHtml,
        { from }
      );
      console.log("卖家邮件发送成功:", ownerEmailResponse.data?.id);
    } else {
      console.warn("卖家邮箱缺失，已跳过卖家通知邮件");
    }

    console.log("所有报价邮件发送完成");
    return { userEmailResponse, ownerEmailResponse };
    
  } catch (error: any) {
    console.error("报价邮件发送失败:", error);
    throw new Error(`邮件发送失败: ${error.message}`);
  }
}
