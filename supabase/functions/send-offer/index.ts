
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

import { corsHeaders } from "./utils/cors.ts";
import { OfferRequest } from "./utils/types.ts";
import { sendOfferEmails } from "./services/email.ts";
import { saveOfferToDatabase, createOfferNotification, findRecentDuplicateOffer, deleteOffer, recordAuditLog, incrementDuplicateCount, getMergePolicy } from "./services/db.ts";
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

    const { domain, offer, email, message, buyerId, sellerId, domainId, captchaToken, currency, currencySymbol, formattedOffer } = requestData;

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
        .in("status", ["available", "active"])
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

    // 获取域名货币（用于邮件与通知）
    let domainCurrency = 'CNY';
    try {
      const { data: domainInfo } = await supabaseAdmin
        .from('domain_listings')
        .select('currency')
        .eq('id', finalDomainId)
        .maybeSingle();
      if (domainInfo?.currency) domainCurrency = domainInfo.currency;
    } catch (_e) {
      console.warn("获取域名货币失败，使用默认CNY");
    }

    // 请求元信息（用于审计）
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip') || null;
    const userAgent = req.headers.get('user-agent') || null;
    const idempotencyKey = (requestData as any).idempotencyKey || null;
    const normalizedCurrency = (currency || domainCurrency || 'CNY').toUpperCase();
    const numericAmount = parseFloat(String(offer));

    // 读取站点合并策略与窗口
    const mergePolicy = await getMergePolicy(supabaseAdmin);

    // 幂等性检查：在配置窗口内查找重复报价
    let offerId: string | null = null;
    let wasDuplicate = false;
    let duplicateOfId: string | null = null;
    try {
      const dupId = await findRecentDuplicateOffer(supabaseAdmin, {
        domainId: finalDomainId, amount: numericAmount, currency: normalizedCurrency,
        buyerId: buyerId || null, email, windowSec: mergePolicy.windowSec,
      });
      if (dupId) {
        wasDuplicate = true;
        duplicateOfId = dupId;

        if (mergePolicy.strategy === 'reject') {
          await recordAuditLog(supabaseAdmin, {
            offerId: dupId, domainId: finalDomainId, buyerId: buyerId || null, sellerId: finalSellerId,
            eventType: 'duplicate_hit', idempotencyKey, duplicateOf: dupId,
            amount: numericAmount, currency: normalizedCurrency, contactEmail: email,
            ipAddress, userAgent,
            metadata: { merge_strategy: 'reject', window_sec: mergePolicy.windowSec },
          });
          return new Response(
            JSON.stringify({ success: false, duplicate: true, errorType: 'duplicate', error: '请勿重复提交相同金额的报价，请稍后再试。' }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (mergePolicy.strategy === 'auto_merge') {
          offerId = dupId;
          await incrementDuplicateCount(supabaseAdmin, dupId);
          await recordAuditLog(supabaseAdmin, {
            offerId: dupId, domainId: finalDomainId, buyerId: buyerId || null, sellerId: finalSellerId,
            eventType: 'duplicate_hit', idempotencyKey, duplicateOf: dupId,
            amount: numericAmount, currency: normalizedCurrency, contactEmail: email,
            ipAddress, userAgent,
            metadata: { merge_strategy: 'auto_merge_to_first', window_sec: mergePolicy.windowSec },
          });
          return new Response(
            JSON.stringify({ success: true, duplicate: true, offerId: dupId, message: "您已提交过相同金额的报价，已自动归并到原记录" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // shadow_record: fallthrough — create a new row but mark duplicate_of in audit
        await incrementDuplicateCount(supabaseAdmin, dupId);
      }
    } catch (dupErr) { console.warn("幂等性检查失败，继续创建:", dupErr); }


    // 保存报价
    try {
      offerId = await saveOfferToDatabase(supabaseAdmin, {
        ...requestData,
        domainId: finalDomainId, sellerId: finalSellerId,
        currency: normalizedCurrency, idempotencyKey,
      });
      await recordAuditLog(supabaseAdmin, {
        offerId, domainId: finalDomainId, buyerId: buyerId || null, sellerId: finalSellerId,
        eventType: 'submitted', idempotencyKey,
        duplicateOf: duplicateOfId,
        amount: numericAmount, currency: normalizedCurrency, contactEmail: email,
        ipAddress, userAgent,
        metadata: { merge_strategy: mergePolicy.strategy, shadow: !!duplicateOfId },
      });
    } catch (dbError: any) {
      await recordAuditLog(supabaseAdmin, {
        domainId: finalDomainId, buyerId: buyerId || null, sellerId: finalSellerId,
        eventType: 'db_error', idempotencyKey, emailError: dbError.message,
        amount: numericAmount, currency: normalizedCurrency, contactEmail: email,
        ipAddress, userAgent, metadata: { stack: dbError.stack },
      });
      return new Response(
        JSON.stringify({ error: `报价保存失败: ${dbError.message}`, success: false, errorType: 'db_error' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 站内通知（失败不阻塞）
    if (finalSellerId && offerId) {
      try {
        await createOfferNotification(
          supabaseAdmin, finalSellerId, domain, numericAmount,
          offerId, email, buyerId || null, normalizedCurrency
        );
      } catch (e) { console.warn("站内通知失败（已忽略）:", e); }
    }

    // 发送邮件
    try {
      await sendOfferEmails({
        domain, offer, email, message: message || "",
        buyerId: buyerId || null,
        dashboardUrl: "/user-center?tab=transactions",
        domainOwnerEmail: ownerEmail || undefined,
        currency: normalizedCurrency, currencySymbol, formattedOffer,
      });
      await recordAuditLog(supabaseAdmin, {
        offerId, domainId: finalDomainId, buyerId: buyerId || null, sellerId: finalSellerId,
        eventType: 'email_sent', idempotencyKey, emailStatus: 'sent',
        amount: numericAmount, currency: normalizedCurrency, contactEmail: email,
        ipAddress, userAgent,
        metadata: { owner_emailed: !!ownerEmail },
      });
    } catch (emailError: any) {
      console.error("邮件发送失败，回滚报价:", emailError);
      if (offerId && !wasDuplicate) await deleteOffer(supabaseAdmin, offerId);
      await recordAuditLog(supabaseAdmin, {
        offerId, domainId: finalDomainId, buyerId: buyerId || null, sellerId: finalSellerId,
        eventType: 'email_failed_rollback', idempotencyKey,
        emailStatus: 'failed', emailError: emailError.message,
        rollbackReason: '邮件发送失败，已自动回滚 DB 记录',
        amount: numericAmount, currency: normalizedCurrency, contactEmail: email,
        ipAddress, userAgent,
      });
      return new Response(
        JSON.stringify({
          error: `邮件发送失败，已回滚报价记录，请稍后重试。原因：${emailError.message}`,
          success: false, rolledBack: true, errorType: 'email_failed',
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, offerId, message: "报价提交成功，买家和卖家都将收到邮件通知" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
