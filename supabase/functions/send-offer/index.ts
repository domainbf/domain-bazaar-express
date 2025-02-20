
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const ADMIN_EMAIL = "9208522@qq.com"; // 设置管理员邮箱

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OfferRequest {
  domain: string;
  offer: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, offer, email }: OfferRequest = await req.json();

    console.log('Received offer request:', { domain, offer, email });

    // 验证输入数据
    if (!domain || !offer || !email) {
      throw new Error('所有字段都是必填的');
    }

    // 保存报价到数据库
    const { data: offerData, error: offerError } = await supabaseClient
      .from('domain_offers')
      .insert([
        {
          domain_id: domain,
          amount: parseFloat(offer),
          contact_email: email,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (offerError) {
      console.error('Database error:', offerError);
      throw new Error('保存报价时出错');
    }

    console.log('Offer saved successfully:', offerData);

    // 发送邮件通知
    try {
      // 1. 发送管理员通知邮件
      const adminEmailResponse = await resend.emails.send({
        from: "Domain Sales <noreply@domain.bf>",
        to: [ADMIN_EMAIL], // 使用固定的管理员邮箱
        subject: `【新域名报价通知】${domain}`,
        html: `
          <h2>收到新域名报价</h2>
          <p>系统收到了新的域名报价请求，详情如下：</p>
          <p><strong>域名:</strong> ${domain}</p>
          <p><strong>报价金额:</strong> $${offer}</p>
          <p><strong>报价用户邮箱:</strong> ${email}</p>
          <hr>
          <p>请及时处理该报价请求。</p>
        `,
      });

      console.log('Admin notification email sent:', adminEmailResponse);

      // 2. 发送用户确认邮件
      const userEmailResponse = await resend.emails.send({
        from: "Domain Sales <noreply@domain.bf>",
        to: [email],
        subject: `您的域名报价已收到 - ${domain}`,
        html: `
          <h2>感谢您的报价!</h2>
          <p>尊敬的用户您好，</p>
          <p>我们已收到您对以下域名的报价：</p>
          <p><strong>域名:</strong> ${domain}</p>
          <p><strong>报价金额:</strong> $${offer}</p>
          <br>
          <p>我们的团队会尽快审核您的报价并与您联系。</p>
          <p>如有任何问题，请随时回复此邮件或联系我们的客服团队。</p>
          <br>
          <p>顺祝商祺，</p>
          <p>Domain Sales 团队</p>
        `,
      });

      console.log('User confirmation email sent:', userEmailResponse);

    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // 记录具体的邮件发送错误
      throw new Error(`邮件发送失败: ${emailError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '报价已成功提交，确认邮件已发送',
        data: offerData 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in send-offer function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || '提交报价时发生错误'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // 保持200以避免客户端的non-2xx错误
      }
    );
  }
};

serve(handler);
