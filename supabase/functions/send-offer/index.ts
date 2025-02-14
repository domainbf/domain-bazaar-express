
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OfferRequest {
  domain: string;
  offer: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, offer, email }: OfferRequest = await req.json();

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Domain Sales <noreply@domain.bf>",
      to: ["sales@domain.bf"],
      subject: `新域名报价: ${domain}`,
      html: `
        <h2>新域名报价详情</h2>
        <p><strong>域名:</strong> ${domain}</p>
        <p><strong>报价:</strong> $${offer}</p>
        <p><strong>联系邮箱:</strong> ${email}</p>
      `,
    });

    // Also store the offer in the database
    const { data: offerData, error: offerError } = await fetch(
      'https://trqxaizkwuizuhlfmdup.supabase.co/rest/v1/domain_offers',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': Deno.env.get("SUPABASE_ANON_KEY") || '',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
        },
        body: JSON.stringify({
          domain_name: domain,
          offer_amount: offer,
          contact_email: email,
          status: 'pending'
        })
      }
    ).then(res => res.json());

    if (offerError) {
      throw new Error('Failed to store offer in database');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in send-offer function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);
