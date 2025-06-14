
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

    console.log("收到的报价请求数据:", { domain, offer, email, domainOwnerId, ownerEmail, domainId });

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

    // 验证domain_listing是否存在
    let validDomainListingId = domainId;
    if (domainId) {
      console.log("验证domain_listing ID:", domainId);
      const { data: domainListing, error: domainError } = await supabase
        .from('domain_listings')
        .select('id, name, owner_id')
        .eq('id', domainId)
        .single();
      
      if (domainError || !domainListing) {
        console.error("域名列表记录不存在:", domainError);
        // 尝试通过域名查找
        const { data: domainByName, error: nameError } = await supabase
          .from('domain_listings')
          .select('id, name, owner_id')
          .eq('name', domain)
          .single();
        
        if (nameError || !domainByName) {
          console.error("通过域名查找也失败:", nameError);
          throw new Error(`未找到域名 ${domain} 的有效记录。请确认域名信息是否正确。`);
        }
        
        validDomainListingId = domainByName.id;
        console.log("通过域名找到的有效ID:", validDomainListingId);
      } else {
        console.log("找到有效的domain_listing:", domainListing);
      }
    } else {
      throw new Error("缺少域名ID信息");
    }

    let domainOwnerEmail = "admin@sale.nic.bn"; // Default fallback
    
    if (validDomainListingId) {
      const emailFromDB = await getDomainOwnerEmail(supabase, validDomainListingId);
      if (emailFromDB) {
        domainOwnerEmail = emailFromDB;
      }
    }

    if (ownerEmail && ownerEmail.includes('@')) {
      domainOwnerEmail = ownerEmail;
    }
    
    console.log("准备发送邮件到域名所有者:", domainOwnerEmail);

    // 直接插入domain_offers表，使用验证过的domain_listing_id
    console.log("直接插入domain_offers表，使用domain_listing_id:", validDomainListingId);
    const { data: insertData, error: insertError } = await supabase
      .from('domain_offers')
      .insert({
        domain_id: validDomainListingId,
        amount: parseFloat(offer),
        contact_email: email,
        message: message || null,
        buyer_id: buyerId || null,
        seller_id: domainOwnerId || null,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error("插入domain_offers失败:", insertError);
      throw new Error(`保存报价失败: ${insertError.message}`);
    }

    console.log("报价插入成功:", insertData);

    // 为卖家和买家创建通知
    if (domainOwnerId) {
      const { error: sellerNotificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: domainOwnerId,
          title: '💰 新的域名报价',
          message: `您的域名 ${domain} 收到了 $${offer} 的新报价`,
          type: 'offer',
          related_id: validDomainListingId,
          action_url: '/user-center?tab=transactions'
        });
      
      if (sellerNotificationError) {
        console.error("创建卖家通知失败:", sellerNotificationError);
      }
    }

    if (buyerId) {
      const { error: buyerNotificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: buyerId,
          title: '✅ 报价提交成功',
          message: `您对域名 ${domain} 的 $${offer} 报价已成功发送给卖家`,
          type: 'offer',
          related_id: validDomainListingId,
          action_url: '/user-center?tab=transactions'
        });
      
      if (buyerNotificationError) {
        console.error("创建买家通知失败:", buyerNotificationError);
      }
    }
    
    const { userEmailResponse, ownerEmailResponse } = await sendOfferEmails({ ...offerRequest, domainOwnerEmail });

    return new Response(
      JSON.stringify({ 
        message: "报价提交成功，邮件通知已发送给买家和卖家",
        userEmail: userEmailResponse,
        ownerEmail: ownerEmailResponse,
        domainOwnerEmail: domainOwnerEmail,
        offerId: insertData.id
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
