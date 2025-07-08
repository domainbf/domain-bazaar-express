import { sendMailWithResend } from "../../utils/sendMailWithResend.ts";

/**
 * 统一邮件发送服务，底层使用 Resend 和 sale.nic.bn 域名
 */
export async function sendEmail(
  _resend: any, // 参数保留，兼容旧调用，实际已忽略
  recipient: string,
  subject: string,
  body: string
) {
  try {
    await sendMailWithResend(recipient, subject, body, {
      from: "NIC.BN 域名交易平台 <noreply@sale.nic.bn>",
    });
    console.log(`邮件发送成功: ${recipient}`);
  } catch (error: any) {
    console.error(`邮件发送失败 ${recipient}:`, error);
    throw new Error(`邮件发送失败: ${error.message || error}`);
  }
}