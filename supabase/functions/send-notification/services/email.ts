
import { sendMailWithResend } from "../../utils/sendMailWithResend.ts";

/**
 * 通过统一邮件工具发送邮件，底层全部用 Resend
 */
export async function sendEmail(
  _resend: any, // 参数保留，兼容旧调用，可忽略
  recipient: string,
  subject: string,
  body: string
) {
  // 这里实际已忽略 _resend，统一走 sendMailWithResend
  try {
    await sendMailWithResend(recipient, subject, body, {
      from: "NIC.BN 域名交易平台 <noreply@nic.bn>",
    });
    console.log(`Successfully sent email to ${recipient}`);
  } catch (error: any) {
    console.error(`Failed to send email to ${recipient}:`, error);
    throw new Error(`Failed to send email: ${error.message || error}`);
  }
}
