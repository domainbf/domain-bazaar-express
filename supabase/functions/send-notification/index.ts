
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
    const notificationRequest: NotificationRequest = await req.json();
    const { type, recipient, data } = notificationRequest;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const baseUrl = "https://nic.bn";
    const { subject, body } = generateEmailContent(type, data, baseUrl);

    // 发送邮件（如果收件人是邮箱地址）
    if (recipient.includes('@')) {
      await sendEmail(null, recipient, subject, body);
    }

    // 创建站内通知（如果收件人是用户ID）
    if (recipient.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      await createInAppNotification(supabaseAdmin, notificationRequest, subject);
    }
    
    console.log(`通知处理成功: ${type} -> ${recipient}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("通知发送失败:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
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
