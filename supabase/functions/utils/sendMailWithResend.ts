
import { Resend } from "https://esm.sh/resend@4.1.2";

/**
 * 用统一的 Resend 服务发送邮件，所有后端 Edge Function 复用。
 * @param to 收件人邮箱
 * @param subject 邮件标题
 * @param html 邮件内容
 * @returns 邮件发送结果
 * @throws 失败时抛出详细错误
 */
export async function sendMailWithResend(
  to: string | string[],
  subject: string,
  html: string,
  opts?: { from?: string }
) {
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
  const fromEmail = opts?.from || "NIC.BN 域名交易平台 <noreply@nic.bn>";

  const resp = await resend.emails.send({
    from: fromEmail,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });

  if (resp.error) {
    let msg =
      typeof resp.error === "object" && resp.error.message
        ? resp.error.message
        : JSON.stringify(resp.error);
    throw new Error(`发送邮件失败: ${msg}`);
  }
  return resp;
}
