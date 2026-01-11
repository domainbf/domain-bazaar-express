
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

import { corsHeaders } from "./utils/cors.ts";
import { OfferRequest } from "./utils/types.ts";
import { sendOfferEmails } from "./services/email.ts";
import { saveOfferToDatabase, createOfferNotification } from "./services/db.ts";
import { verifyCaptcha } from "./services/captcha.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Send Offer Function Started ===");
    console.log("Request method:", req.method);
    console.log("Request URL:", req.url);
    
    if (req.method !== "POST") {
      console.log("Method not allowed:", req.method);
      return new Response(
        JSON.stringify({ 
          error: "Method not allowed",
          success: false
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    let requestData: OfferRequest;
    try {
      const body = await req.text();
      console.log("Raw request body length:", body.length);
      console.log("Raw request body:", body);
      
      if (!body || body.trim() === '') {
        console.error("Empty request body received");
        return new Response(
          JSON.stringify({ 
            error: "请求体为空，请检查请求参数",
            success: false
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
      
      requestData = JSON.parse(body);
      console.log("Parsed request data:", requestData);
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "请求格式错误，请检查数据格式",
          success: false
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { domain, offer, email, message, buyerId, sellerId, domainId, captchaToken } = requestData;

    console.log("收到报价请求:", { domain, offer, email, buyerId, sellerId, domainId });

    // 验证必需参数
    if (!domain || !offer || !email) {
      console.log("Missing required parameters:", { domain, offer, email });
      return new Response(
        JSON.stringify({ 
          error: "缺少必需的参数：域名、报价金额或邮箱地址",
          success: false
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 验证 CAPTCHA
    if (captchaToken) {
      try {
        console.log("验证 CAPTCHA...");
        const captchaValid = await verifyCaptcha(captchaToken);
        if (!captchaValid) {
          console.warn("CAPTCHA 验证失败");
        } else {
          console.log("CAPTCHA 验证成功");
        }
      } catch (captchaError: any) {
        console.warn("CAPTCHA 验证失败:", captchaError.message);
        // 不阻止流程，但记录错误
      }
    }

    // 初始化 Supabase 客户端
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ 
          error: "服务配置错误",
          success: false
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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 如果已经提供了domainId和sellerId，使用它们；否则查找
    let finalDomainId = domainId;
    let finalSellerId = sellerId;

    // 查找域名和所有者信息（如果没有提供）
    if (!finalDomainId || !finalSellerId) {
      console.log("查找域名信息:", domain);
      const { data: domainData, error: domainError } = await supabaseAdmin
        .from("domain_listings")
        .select("id, name, owner_id, price")
        .eq("name", domain)
        .eq("status", "available")
        .maybeSingle();

      if (domainError) {
        console.error("域名查找失败:", domainError);
        return new Response(
          JSON.stringify({ 
            error: "查询域名信息时出错",
            success: false
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

      if (!domainData) {
        console.error("域名不存在:", domain);
        return new Response(
          JSON.stringify({ 
            error: `域名 ${domain} 不存在或不可售`,
            success: false
          }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      finalDomainId = domainData.id;
      finalSellerId = domainData.owner_id;
      console.log("找到域名:", domainData);
    }

    // 获取域名所有者的邮箱（缺失则继续流程，仅跳过卖家邮件）
    const { data: ownerProfile, error: ownerError } = await supabaseAdmin
      .from("profiles")
      .select("contact_email, full_name")
      .eq("id", finalSellerId)
      .maybeSingle();

    let ownerEmail: string | null = null;
    if (ownerError) {
      console.warn("所有者信息获取失败，继续仅发送买家邮件:", ownerError);
    } else if (!ownerProfile?.contact_email) {
      console.warn("所有者邮箱不存在，继续仅发送买家邮件");
    } else {
      ownerEmail = ownerProfile.contact_email;
      console.log("域名所有者邮箱:", ownerEmail);
    }

    let offerId: string | null = null;
    try {
      // 保存报价到数据库
      console.log("保存报价到数据库...");
      offerId = await saveOfferToDatabase(supabaseAdmin, {
        ...requestData,
        domainId: finalDomainId,
        sellerId: finalSellerId,
      });
      console.log("报价保存成功, ID:", offerId);
      
      // 创建站内通知给卖家
      if (finalSellerId && offerId) {
        console.log("创建站内通知...");
        await createOfferNotification(
          supabaseAdmin,
          finalSellerId,
          domain,
          parseFloat(offer),
          offerId,
          email
        );
        console.log("站内通知创建成功");
      }
    } catch (dbError: any) {
      console.error("数据库操作失败:", dbError);
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
        domainOwnerEmail: ownerEmail || undefined,
      });
      console.log("邮件发送成功");
    } catch (emailError: any) {
      console.error("邮件发送失败:", emailError);
      return new Response(
        JSON.stringify({ 
          error: `邮件发送失败: ${emailError.message}`,
          success: false
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
        success: false
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
