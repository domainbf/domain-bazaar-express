
import { Resend } from "https://esm.sh/resend@4.1.2";

/**
 * 统一的 Resend 邮件发送服务，使用已验证的 nic.bn 域名
 */
export async function sendMailWithResend(
  to: string | string[],
  subject: string,
  html: string,
  opts?: { from?: string }
) {
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
  
  // 使用已验证的 nic.bn 域名发送邮件
  const fromEmail = opts?.from || "NIC.BN 域名交易平台 <noreply@nic.bn>";

  try {
    const resp = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (resp.error) {
      console.error('Resend API error:', resp.error);
      let msg = typeof resp.error === "object" && resp.error.message
        ? resp.error.message
        : JSON.stringify(resp.error);
      throw new Error(`发送邮件失败: ${msg}`);
    }
    
    console.log(`邮件发送成功，ID: ${resp.data?.id}`);
    return resp;
  } catch (error: any) {
    console.error('邮件发送失败:', error);
    throw new Error(`邮件发送失败: ${error.message}`);
  }
}
