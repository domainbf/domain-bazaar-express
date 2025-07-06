
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from './utils/cors.ts';
import { OfferRequest } from './utils/types.ts';
import { verifyCaptcha } from './services/captcha.ts';
import { sendOfferEmails } from './services/email.ts';

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Send Offer Function Started ===");
    
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

    console.log("收到的报价请求数据:", { 
      domain, 
      offer, 
      email, 
      domainOwnerId, 
      ownerEmail, 
      domainId,
      buyerId,
      hasCaptchaToken: !!captchaToken 
    });

    // 验证必填字段
    if (!domain || !offer || !email) {
      console.error("缺少必填字段:", { domain: !!domain, offer: !!offer, email: !!email });
      throw new Error("域名、报价金额和联系邮箱是必填项");
    }

    // 验证人机验证
    console.log("开始验证人机验证...");
    try {
      const isCaptchaValid = await verifyCaptcha(captchaToken);
      if (!isCaptchaValid) {
        console.error("人机验证失败");
        throw new Error("人机验证失败，请重试");
      }
      console.log("人机验证通过");
    } catch (captchaError) {
      console.warn("人机验证服务暂时不可用，继续处理请求...");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 验证domain_listing是否存在
    let validDomainListingId = domainId;
    let realDomainOwnerId = domainOwnerId;
    let domainOwnerEmail = "admin@nic.bn"; // 使用nic.bn域名的默认邮箱
    
    console.log("开始验证域名列表记录...");
    
    if (domainId) {
      console.log("验证domain_listing ID:", domainId);
      
      // 先查询 domain_listings 表
      const { data: domainListing, error: domainError } = await supabase
        .from('domain_listings')
        .select('id, name, owner_id')
        .eq('id', domainId)
        .maybeSingle();
      
      if (domainError) {
        console.error("查询域名列表时出错:", domainError);
        throw new Error(`查询域名信息时出错: ${domainError.message}`);
      }
      
      if (!domainListing) {
        console.log("未找到域名ID，尝试通过域名查找...");
        // 尝试通过域名查找
        const { data: domainByName, error: nameError } = await supabase
          .from('domain_listings')
          .select('id, name, owner_id')
          .eq('name', domain)
          .maybeSingle();
        
        if (nameError) {
          console.error("通过域名查找出错:", nameError);
          throw new Error(`查询域名信息时出错: ${nameError.message}`);
        }
        
        if (!domainByName) {
          console.error("通过域名也未找到记录");
          throw new Error(`未找到域名 ${domain} 的有效记录。请确认域名信息是否正确。`);
        }
        
        validDomainListingId = domainByName.id;
        realDomainOwnerId = domainByName.owner_id;
        console.log("通过域名找到的有效ID:", validDomainListingId, "所有者ID:", realDomainOwnerId);
      } else {
        realDomainOwnerId = domainListing.owner_id;
        console.log("找到有效的domain_listing:", domainListing);
      }

      // 如果有 owner_id，单独查询 profiles 表获取邮箱
      if (realDomainOwnerId) {
        console.log("查询所有者Profile信息...");
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('contact_email, username, full_name')
          .eq('id', realDomainOwnerId)
          .maybeSingle();
        
        if (profileError) {
          console.error("查询Profile时出错:", profileError);
        } else if (profileData?.contact_email) {
          domainOwnerEmail = profileData.contact_email;
          console.log("从Profile获取到邮箱:", domainOwnerEmail);
        } else {
          console.log("Profile中没有找到contact_email，使用默认邮箱");
        }
      }
    } else {
      console.error("缺少域名ID信息");
      throw new Error("缺少域名ID信息");
    }

    // 如果传入了 ownerEmail，使用传入的邮箱
    if (ownerEmail && ownerEmail.includes('@')) {
      domainOwnerEmail = ownerEmail;
      console.log("使用传入的所有者邮箱:", domainOwnerEmail);
    }
    
    console.log("最终使用的域名所有者邮箱:", domainOwnerEmail);
    console.log("最终使用的域名所有者ID:", realDomainOwnerId);

    // 插入domain_offers表
    console.log("准备插入domain_offers表...");
    const { data: insertData, error: insertError } = await supabase
      .from('domain_offers')
      .insert({
        domain_id: validDomainListingId,
        amount: parseFloat(offer),
        contact_email: email,
        message: message || null,
        buyer_id: buyerId || null,
        seller_id: realDomainOwnerId || null,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error("插入domain_offers失败:", insertError);
      throw new Error(`保存报价失败: ${insertError.message}`);
    }

    console.log("报价插入成功:", insertData);

    // 创建通知
    console.log("开始创建通知...");
    
    // 为卖家创建通知
    if (realDomainOwnerId) {
      console.log("为卖家创建通知...");
      const { error: sellerNotificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: realDomainOwnerId,
          title: '💰 新的域名报价',
          message: `您的域名 ${domain} 收到了 $${offer} 的新报价`,
          type: 'offer',
          related_id: validDomainListingId,
          action_url: '/user-center?tab=transactions'
        });
      
      if (sellerNotificationError) {
        console.error("创建卖家通知失败:", sellerNotificationError);
      } else {
        console.log("卖家通知创建成功");
      }
    }

    // 为买家创建通知
    if (buyerId) {
      console.log("为买家创建通知...");
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
      } else {
        console.log("买家通知创建成功");
      }
    }
    
    // 发送邮件给买家和卖家
    console.log("开始发送邮件...");
    console.log("邮件发送参数:", {
      domain,
      offer,
      email,
      message,
      buyerId,
      domainOwnerEmail,
      dashboardUrl: "https://nic.bn/user-center?tab=domains"
    });

    try {
      const { userEmailResponse, ownerEmailResponse } = await sendOfferEmails({ 
        ...offerRequest, 
        domainOwnerEmail,
        dashboardUrl: "https://nic.bn/user-center?tab=domains"
      });
      
      console.log("邮件发送完成 - 买家邮件:", userEmailResponse.data ? "成功" : "失败");
      console.log("邮件发送完成 - 卖家邮件:", ownerEmailResponse.data ? "成功" : "失败");

      if (userEmailResponse.error) {
        console.error("买家邮件发送错误:", userEmailResponse.error);
      }
      if (ownerEmailResponse.error) {
        console.error("卖家邮件发送错误:", ownerEmailResponse.error);
      }

      console.log("=== Send Offer Function Completed Successfully ===");
      
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
    } catch (emailError: any) {
      console.warn("邮件发送失败，但报价已保存:", emailError);
      // 邮件发送失败不影响报价保存成功
      return new Response(
        JSON.stringify({ 
          message: "报价提交成功，邮件通知暂时无法发送",
          offerId: insertData.id,
          emailError: emailError.message
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

  } catch (error: any) {
    console.error("=== Send Offer Function Error ===");
    console.error("错误类型:", error.constructor.name);
    console.error("错误消息:", error.message);
    console.error("错误堆栈:", error.stack);
    console.error("================================");
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "提交报价失败",
        details: error.stack
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
