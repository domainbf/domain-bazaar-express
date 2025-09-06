import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.1.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment variable not set");
    }

    const resend = new Resend(resendApiKey);
    const { to, subject, html, from }: EmailRequest = await req.json();

    // 统一使用 sale.nic.bn 发件人地址
    const fromEmail = from || "NIC.BN 域名交易平台 <noreply@sale.nic.bn>";

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
    
    const response = await resend.emails.send({
      from: fromEmail,
      to: recipients,
      subject,
      html,
    });

    if (response.error) {
      console.error('Resend API 错误:', response.error);
      throw new Error(response.error.message || "邮件发送失败");
    }
    
    console.log(`邮件发送成功，ID: ${response.data?.id}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        id: response.data?.id
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('邮件发送失败:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "邮件发送失败",
        success: false
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);