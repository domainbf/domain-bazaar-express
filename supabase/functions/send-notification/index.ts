
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { Resend } from "https://esm.sh/resend@4.1.2";

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
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const baseUrl = Deno.env.get("SITE_URL") || "https://sale.nic.bn";
    const { subject, body } = generateEmailContent(type, data, baseUrl);

    if (recipient.includes('@')) {
      await sendEmail(resend, recipient, subject, body);
    }

    if (recipient.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      await createInAppNotification(supabaseAdmin, notificationRequest, subject);
    }
    
    console.log(`Successfully processed ${type} notification for ${recipient}`);

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
    console.error("Error sending notification:", error);
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
