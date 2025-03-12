
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
  message?: string;
  buyerId?: string | null;
  domainOwnerId?: string;
  dashboardUrl?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      domain, 
      offer, 
      email, 
      message = "", 
      buyerId = null,
      domainOwnerId,
      dashboardUrl = "https://domainx.com/dashboard"
    }: OfferRequest = await req.json();

    // Email template for the user (buyer)
    const userEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Domain Offer has been received</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #000; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; border: 1px solid #eaeaea; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Offer Has Been Submitted</h1>
            </div>
            <div class="content">
              <p>Dear Domain Buyer,</p>
              <p>Thank you for your interest in <strong>${domain}</strong>. We have received your offer of <strong>$${offer}</strong> and have forwarded it to the domain owner.</p>
              
              <div class="details">
                <h3>Offer Details:</h3>
                <p><strong>Domain:</strong> ${domain}</p>
                <p><strong>Offer Amount:</strong> $${offer}</p>
                ${message ? `<p><strong>Your Message:</strong> ${message}</p>` : ''}
              </div>
              
              <p>The domain owner will review your offer and respond as soon as possible. You will receive a notification when they respond.</p>
              <p>If you have any questions, please reply to this email.</p>
              <p>Best regards,<br>The DomainX Team</p>
            </div>
            <div class="footer">
              <p>© 2024 DomainX. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Email template for the admin/seller
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Domain Offer Received</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #000; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; border: 1px solid #eaeaea; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 4px; }
            .cta { background-color: #000; color: white; display: inline-block; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Domain Offer</h1>
            </div>
            <div class="content">
              <p>Hello Domain Owner,</p>
              <p>You have received a new offer for your domain <strong>${domain}</strong>.</p>
              
              <div class="details">
                <h3>Offer Details:</h3>
                <p><strong>Domain:</strong> ${domain}</p>
                <p><strong>Offer Amount:</strong> $${offer}</p>
                <p><strong>Buyer Email:</strong> ${email}</p>
                ${message ? `<p><strong>Buyer Message:</strong> ${message}</p>` : ''}
                ${buyerId ? `<p><strong>Buyer Account:</strong> Registered User</p>` : `<p><strong>Buyer Account:</strong> Guest</p>`}
              </div>
              
              <p>You can respond to this offer by logging into your dashboard. If you choose to accept this offer, please contact the buyer using the provided email address to arrange the domain transfer and payment.</p>
              <a href="${dashboardUrl}" class="cta" style="color: white;">View in Dashboard</a>
              <p>Best regards,<br>The DomainX Team</p>
            </div>
            <div class="footer">
              <p>© 2024 DomainX. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send confirmation email to the user/buyer
    const userEmailResponse = await resend.emails.send({
      from: "DomainX <no-reply@domain.bf>",
      to: [email],
      subject: `Your offer for ${domain} has been received`,
      html: userEmailHtml,
    });

    console.log("User email sent:", userEmailResponse);

    // Determine admin email based on domainOwnerId or fallback to default
    let adminEmail = "admin@example.com";
    
    if (domainOwnerId) {
      try {
        // Fetch the domain owner's email from the profiles table
        const profileResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/profiles?id=eq.${domainOwnerId}&select=email`, {
          headers: {
            "Content-Type": "application/json",
            "apikey": Deno.env.get("SUPABASE_ANON_KEY") || "",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
          }
        });
        
        const profileData = await profileResponse.json();
        if (profileData && profileData.length > 0 && profileData[0].email) {
          adminEmail = profileData[0].email;
        }
      } catch (error) {
        console.error("Error fetching domain owner email:", error);
        // Continue with default admin email
      }
    }

    // Send notification email to the domain owner or admin
    const adminEmailResponse = await resend.emails.send({
      from: "DomainX <no-reply@domain.bf>",
      to: [adminEmail],
      subject: `New offer for ${domain}: $${offer}`,
      html: adminEmailHtml,
    });

    console.log("Admin email sent:", adminEmailResponse);

    return new Response(
      JSON.stringify({ 
        message: "Offer submitted successfully",
        userEmail: userEmailResponse,
        adminEmail: adminEmailResponse
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-offer function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
