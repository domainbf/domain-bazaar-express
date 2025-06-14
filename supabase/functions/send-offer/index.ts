
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from './utils/cors.ts';
import { OfferRequest } from './utils/types.ts';
import { verifyCaptcha } from './services/captcha.ts';
import { sendOfferEmails } from './services/email.ts';
import { getDomainOwnerEmail, storeOfferInDB, createInAppNotifications } from './services/db.ts';

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
    } = offerRequest;

    console.log("收到的报价请求数据:", { domain, offer, email, domainOwnerId: offerRequest.domainOwnerId, ownerEmail });

    const isCaptchaValid = await verifyCaptcha(captchaToken);
    if (!isCaptchaValid) {
      throw new Error("人机验证失败，请重试");
    }
    
    if (!domain || !offer || !email) {
      throw new Error("域名、报价金额和联系邮箱是必填项");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
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
    
    console.log("发送邮件到域名所有者:", domainOwnerEmail);

    if (domainId) {
        await storeOfferInDB(supabase, offerRequest);
    }
    
    const { userEmailResponse, ownerEmailResponse } = await sendOfferEmails({ ...offerRequest, domainOwnerEmail });

    if (offerRequest.domainId && (offerRequest.domainOwnerId || offerRequest.buyerId)) {
        await createInAppNotifications(supabase, offerRequest);
    }

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
    console.error("send-offer函数中的错误:", error);
    return new Response(
      JSON.stringify({ error: error.message || "提交报价失败" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
