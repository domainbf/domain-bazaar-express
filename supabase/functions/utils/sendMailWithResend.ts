
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
  
  // 优先使用 nic.bn 域名，如果失败则使用测试域名
  const fromEmail = opts?.from || "NIC.BN 域名交易平台 <noreply@nic.bn>";

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
      
      // 如果是域名验证错误，尝试使用测试域名重新发送
      if (resp.error.message?.includes('domain is not verified') && fromEmail.includes('nic.bn')) {
        console.log('nic.bn 域名未验证，尝试使用测试域名重新发送...');
        const fallbackEmail = "NIC.BN 域名交易平台 <onboarding@resend.dev>";
        
        const fallbackResp = await resend.emails.send({
          from: fallbackEmail,
          to: recipients,
          subject,
          html,
        });
        
        if (fallbackResp.error) {
          throw new Error(fallbackResp.error.message || "邮件发送失败");
        }
        
        console.log(`邮件发送成功（使用备用域名），ID: ${fallbackResp.data?.id}`);
        return fallbackResp;
      }
      
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
