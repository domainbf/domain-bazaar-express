
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

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
      // 发送管理员通知邮件
      await resend.emails.send({
        from: "Domain Sales <noreply@domain.bf>",
        to: ["sales@domain.bf"],
        subject: `新域名报价: ${domain}`,
        html: `
          <h2>新域名报价详情</h2>
          <p><strong>域名:</strong> ${domain}</p>
          <p><strong>报价:</strong> $${offer}</p>
          <p><strong>联系邮箱:</strong> ${email}</p>
        `,
      });

      // 发送用户确认邮件
      await resend.emails.send({
        from: "Domain Sales <noreply@domain.bf>",
        to: [email],
        subject: `您的域名报价已收到 - ${domain}`,
        html: `
          <h2>感谢您的报价!</h2>
          <p>我们已收到您对以下域名的报价：</p>
          <p><strong>域名:</strong> ${domain}</p>
          <p><strong>报价金额:</strong> $${offer}</p>
          <br>
          <p>我们会尽快审核您的报价并与您联系。</p>
          <p>如有任何问题，请随时回复此邮件。</p>
          <br>
          <p>顺祝商祺，</p>
          <p>Domain Sales 团队</p>
        `,
      });

      console.log('Emails sent successfully to admin and user');
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // 不阻止流程继续，只记录错误
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '报价已成功提交',
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
