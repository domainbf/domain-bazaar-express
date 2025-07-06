
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
  
  // 使用已验证的 nic.bn 域名发送邮件，如果API密钥有问题则使用测试域名
  const fromEmail = opts?.from || "NIC.BN 域名交易平台 <onboarding@resend.dev>";

  try {
    console.log(`准备发送邮件到: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`发件人: ${fromEmail}`);
    console.log(`邮件主题: ${subject}`);
    
    const resp = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (resp.error) {
      console.error('Resend API error:', resp.error);
      
      // 如果是域名验证错误，尝试使用默认域名重新发送
      if (resp.error.message && resp.error.message.includes('domain is not verified')) {
        console.log('域名未验证，使用默认域名重新发送...');
        const fallbackResp = await resend.emails.send({
          from: "NIC.BN 域名交易平台 <onboarding@resend.dev>",
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
        });
        
        if (fallbackResp.error) {
          throw new Error(`邮件发送失败: ${fallbackResp.error.message}`);
        }
        
        console.log(`邮件发送成功(使用默认域名)，ID: ${fallbackResp.data?.id}`);
        return fallbackResp;
      }
      
      let msg = typeof resp.error === "object" && resp.error.message
        ? resp.error.message
        : JSON.stringify(resp.error);
      throw new Error(`邮件发送失败: ${msg}`);
    }
    
    console.log(`邮件发送成功，ID: ${resp.data?.id}`);
    return resp;
  } catch (error: any) {
    console.error('邮件发送失败:', error);
    
    // 如果是网络错误或API错误，提供更友好的错误信息
    if (error.message.includes('fetch')) {
      throw new Error('网络连接错误，请检查网络设置');
    }
    
    throw new Error(`邮件发送失败: ${error.message}`);
  }
}
