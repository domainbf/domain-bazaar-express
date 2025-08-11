
import { getEmailVerificationHtml } from '../templates/emailVerification.ts';
import { getPasswordResetHtml } from '../templates/passwordReset.ts';
import { getNewOfferHtml } from '../templates/newOffer.ts';
import { getOfferResponseHtml } from '../templates/offerResponse.ts';
import { getDomainSoldHtml } from '../templates/domainSold.ts';
import { getDomainPurchasedHtml } from '../templates/domainPurchased.ts';

export function generateEmailContent(type: string, data: any, baseUrl: string): { subject: string; body: string } {
  let subject = "";
  let body = "";
  
  // 统一使用 nic.bn 作为主域名
  const primaryUrl = "https://nic.bn";

  switch (type) {
    case "email_verification":
      subject = "🎉 欢迎加入 NIC.BN - 请验证您的邮箱 | Welcome to NIC.BN – Verify your email";
      body = getEmailVerificationHtml(data, primaryUrl);
      break;

    case "password_reset":
      subject = "🔐 重置您的 NIC.BN 账户密码 | Reset your NIC.BN password";
      body = getPasswordResetHtml(data, primaryUrl);
      break;

    case "new_offer":
      subject = `💰 新的域名报价：${data.domain} - 买家出价 ¥${data.amount.toLocaleString()} | New offer for ${data.domain}`;
      body = getNewOfferHtml(data, primaryUrl);
      break;

    case "offer_response":
      subject = `📬 您的域名报价有回复：${data.domain} | Your domain offer has a response`;
      body = getOfferResponseHtml(data, primaryUrl);
      break;

    case "domain_sold":
      subject = `✅ 恭喜！您的域名 ${data.domain} 已成功售出 | Domain sold: ${data.domain}`;
      body = getDomainSoldHtml(data, primaryUrl);
      break;

    case "domain_purchased":
      subject = `🎉 域名购买成功：${data.domain} | Purchase successful: ${data.domain}`;
      body = getDomainPurchasedHtml(data, primaryUrl);
      break;

    default:
      throw new Error(`未知的通知类型: ${type}`);
  }

  return { subject, body };
}
