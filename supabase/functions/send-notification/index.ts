
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

import { corsHeaders } from "./utils/cors.ts";
import { NotificationRequest } from "./utils/types.ts";
import { generateEmailContent } from "./services/templateGenerator.ts";
import { sendEmail } from "./services/email.ts";
import { createInAppNotification } from "./services/db.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Send Notification Function Started ===");
    
    const notificationRequest: NotificationRequest = await req.json();
    const { type, recipient, data } = notificationRequest;

    console.log("收到通知请求:", { type, recipient, data });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const baseUrl = "https://nic.bn";
    
    try {
      const { subject, body } = generateEmailContent(type, data, baseUrl);
      console.log("邮件内容生成成功:", { subject });

      // 发送邮件（如果收件人是邮箱地址）
      if (recipient.includes('@')) {
        console.log("开始发送邮件到:", recipient);
        try {
          await sendEmail(supabaseAdmin, recipient, subject, body);
          console.log("邮件发送成功");
        } catch (emailError: any) {
          console.warn("邮件发送失败，但不影响主流程:", emailError.message);
          // 邮件发送失败不应该导致整个请求失败
        }
      }

      // 创建站内通知（如果收件人是用户ID）
      if (recipient.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.log("创建站内通知给用户ID:", recipient);
        try {
          await createInAppNotification(supabaseAdmin, notificationRequest, subject);
          console.log("站内通知创建成功");
        } catch (notificationError: any) {
          console.warn("站内通知创建失败:", notificationError.message);
        }
      }
      
      console.log(`通知处理成功: ${type} -> ${recipient}`);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: "通知发送成功"
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (contentError: any) {
      console.error("生成邮件内容失败:", contentError);
      throw new Error(`生成邮件内容失败: ${contentError.message}`);
    }

  } catch (error: any) {
    console.error("=== Send Notification Function Error ===");
    console.error("错误类型:", error.constructor.name);
    console.error("错误消息:", error.message);
    console.error("错误堆栈:", error.stack);
    console.error("=======================================");
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "通知发送失败",
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
