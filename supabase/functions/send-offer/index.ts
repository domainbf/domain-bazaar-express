
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

    // 验证输入数据
    if (!domain || !offer || !email) {
      throw new Error('所有字段都是必填的');
    }

    // 检查域名是否存在且可出售
    const { data: domainData, error: domainError } = await supabaseClient
      .from('domains')
      .select('id, status')
      .eq('name', domain)
      .single();

    if (domainError || !domainData) {
      throw new Error('域名不存在或无法出售');
    }

    if (domainData.status === 'sold') {
      throw new Error('该域名已售出');
    }

    // 保存报价到数据库
    const { data: offerData, error: offerError } = await supabaseClient
      .from('domain_offers')
      .insert([
        {
          domain_name: domain,
          offer_amount: parseFloat(offer),
          contact_email: email,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (offerError) {
      console.error('数据库保存错误:', offerError);
      throw new Error('保存报价时出错');
    }

    // 发送邮件通知
    const emailResponse = await resend.emails.send({
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

    console.log('报价处理成功:', {
      offer: offerData,
      email: emailResponse
    });

    return new Response(
      JSON.stringify({ success: true, message: '报价已成功提交' }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("报价处理错误:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || '提交报价时发生错误'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
};

serve(handler);
