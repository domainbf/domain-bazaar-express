
import { Resend } from "https://esm.sh/resend@4.1.2";

/**
 * 统一的 Resend 邮件发送服务
 */
export async function sendMailWithResend(
  to: string | string[],
  subject: string,
  html: string,
  opts?: { from?: string }
) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY 环境变量未设置");
  }

  const resend = new Resend(resendApiKey);
  
  // 使用 sale.nic.bn 域名发送邮件
  const fromEmail = opts?.from || "NIC.BN 域名交易平台 <sale@nic.bn>";

  try {
    console.log(`准备发送邮件到: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`发件人: ${fromEmail}`);
    console.log(`邮件主题: ${subject}`);
    
    // 确保收件人格式正确
    const recipients = Array.isArray(to) ? to : [to];
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of recipients) {
      if (!emailRegex.test(email)) {
        throw new Error(`无效的邮箱地址: ${email}`);
      }
    }
    
    const resp = await resend.emails.send({
      from: fromEmail,
      to: recipients,
      subject,
      html,
    });

    if (resp.error) {
      console.error('Resend API 错误:', resp.error);
      
      let errorMessage = "邮件发送失败";
      if (typeof resp.error === "object" && resp.error.message) {
        errorMessage = resp.error.message;
      } else if (typeof resp.error === "string") {
        errorMessage = resp.error;
      }
      
      throw new Error(errorMessage);
    }
    
    console.log(`邮件发送成功，ID: ${resp.data?.id}`);
    return resp;
    
  } catch (error: any) {
    console.error('邮件发送失败:', error);
    
    // 提供更友好的错误信息
    let friendlyMessage = error.message || "邮件发送失败";
    
    if (error.message?.includes('fetch')) {
      friendlyMessage = '网络连接错误，请检查网络设置';
    } else if (error.message?.includes('Invalid API key')) {
      friendlyMessage = 'API 密钥配置错误';
    } else if (error.message?.includes('domain is not verified')) {
      friendlyMessage = '发件域名未验证，请联系管理员';
    }
    
    throw new Error(friendlyMessage);
  }
}
