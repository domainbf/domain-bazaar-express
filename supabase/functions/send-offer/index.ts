
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

import { corsHeaders } from "./utils/cors.ts";
import { OfferRequest } from "./utils/types.ts";
import { sendOfferEmails } from "./services/email.ts";
import { saveOfferToDatabase } from "./services/db.ts";
import { verifyCaptcha } from "./services/captcha.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Send Offer Function Started ===");
    
    const requestData: OfferRequest = await req.json();
    const { domain, offer, email, message, buyerId, captchaToken } = requestData;

    console.log("收到报价请求:", { domain, offer, email, buyerId });

    // 验证必需参数
    if (!domain || !offer || !email) {
      throw new Error("缺少必需的参数：域名、报价金额或邮箱地址");
    }

    // 验证 CAPTCHA
    if (captchaToken) {
      try {
        console.log("验证 CAPTCHA...");
        const captchaValid = await verifyCaptcha(captchaToken);
        if (!captchaValid) {
          throw new Error("CAPTCHA 验证失败，请重试");
        }
        console.log("CAPTCHA 验证成功");
      } catch (captchaError: any) {
        console.warn("CAPTCHA 验证失败:", captchaError.message);
        // 不阻止流程，但记录错误
      }
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 查找域名和所有者信息
    console.log("查找域名信息:", domain);
    const { data: domainData, error: domainError } = await supabaseAdmin
      .from("domain_listings")
      .select("id, name, owner_id, price")
      .eq("name", domain)
      .eq("status", "available")
      .single();

    if (domainError || !domainData) {
      console.error("域名查找失败:", domainError);
      throw new Error(`域名 ${domain} 不存在或不可售`);
    }

    console.log("找到域名:", domainData);

    // 获取域名所有者的邮箱
    const { data: ownerProfile, error: ownerError } = await supabaseAdmin
      .from("profiles")
      .select("contact_email, full_name")
      .eq("id", domainData.owner_id)
      .single();

    if (ownerError || !ownerProfile?.contact_email) {
      console.error("所有者信息获取失败:", ownerError);
      throw new Error("无法获取域名所有者联系信息");
    }

    console.log("域名所有者邮箱:", ownerProfile.contact_email);

    try {
      // 保存报价到数据库
      console.log("保存报价到数据库...");
      await saveOfferToDatabase(supabaseAdmin, {
        ...requestData,
        domainId: domainData.id,
        sellerId: domainData.owner_id,
      });
      console.log("报价保存成功");
    } catch (dbError: any) {
      console.error("数据库保存失败:", dbError);
      // 不阻止邮件发送，但记录错误
    }

    try {
      // 发送邮件通知
      console.log("开始发送邮件通知...");
      await sendOfferEmails({
        domain,
        offer,
        email,
        message: message || "",
        buyerId: buyerId || null,
        dashboardUrl: "https://nic.bn/user-center?tab=transactions",
        domainOwnerEmail: ownerProfile.contact_email,
      });
      console.log("邮件发送成功");
    } catch (emailError: any) {
      console.error("邮件发送失败:", emailError);
      throw new Error(`邮件发送失败: ${emailError.message}`);
    }

    console.log(`报价处理成功: ${domain} - ¥${offer}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "报价提交成功，买家和卖家都将收到邮件通知"
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error: any) {
    console.error("=== Send Offer Function Error ===");
    console.error("错误类型:", error.constructor.name);
    console.error("错误消息:", error.message);
    console.error("错误堆栈:", error.stack);
    console.error("====================================");
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "报价提交失败",
        details: error.stack
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
