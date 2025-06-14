
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from './utils/cors.ts';
import { OfferRequest } from './utils/types.ts';
import { verifyCaptcha } from './services/captcha.ts';
import { sendOfferEmails } from './services/email.ts';
import { getDomainOwnerEmail } from './services/db.ts';

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const offerRequest: OfferRequest = await req.json();
    const { 
      domain, 
      offer, 
      email,
      captchaToken,
      domainId,
      ownerEmail,
      message,
      buyerId,
      domainOwnerId
    } = offerRequest;

    console.log("收到的报价请求数据:", { domain, offer, email, domainOwnerId, ownerEmail });

    const isCaptchaValid = await verifyCaptcha(captchaToken);
    if (!isCaptchaValid) {
      throw new Error("人机验证失败，请重试");
    }
    
    if (!domain || !offer || !email) {
      throw new Error("域名、报价金额和联系邮箱是必填项");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let domainOwnerEmail = "admin@sale.nic.bn"; // Default fallback
    
    if (domainId) {
      const emailFromDB = await getDomainOwnerEmail(supabase, domainId);
      if (emailFromDB) {
        domainOwnerEmail = emailFromDB;
      }
    }

    if (ownerEmail && ownerEmail.includes('@')) {
      domainOwnerEmail = ownerEmail;
    }
    
    console.log("准备发送邮件到域名所有者:", domainOwnerEmail);

    if (domainId) {
      const rpcParams = {
        p_domain_name: domain,
        p_offer_amount: parseFloat(offer),
        p_contact_email: email,
        p_message: message || null,
        p_buyer_id: buyerId || null,
        p_seller_id: domainOwnerId || null,
        p_domain_listing_id: domainId
      };
      console.log("调用 handle_new_offer RPC，参数:", JSON.stringify(rpcParams, null, 2));

      const { error: rpcError } = await supabase.rpc('handle_new_offer', rpcParams);

      if (rpcError) {
        console.error("调用 handle_new_offer RPC 失败:", JSON.stringify(rpcError, null, 2));
        throw new Error(`数据库操作失败: ${rpcError.message}。请检查域名信息是否正确或联系支持。`);
      }
      
      console.log("调用 handle_new_offer RPC 成功。");
    }
    
    const { userEmailResponse, ownerEmailResponse } = await sendOfferEmails({ ...offerRequest, domainOwnerEmail });

    return new Response(
      JSON.stringify({ 
        message: "报价提交成功，邮件通知已发送给买家和卖家",
        userEmail: userEmailResponse,
        ownerEmail: ownerEmailResponse,
        domainOwnerEmail: domainOwnerEmail
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("send-offer 函数中的顶层捕获错误:", error);
    return new Response(
      JSON.stringify({ error: error.message || "提交报价失败" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
