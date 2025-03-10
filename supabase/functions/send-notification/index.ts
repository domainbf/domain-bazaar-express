
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: string;
  recipient: string;
  data: any;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, recipient, data }: NotificationRequest = await req.json();
    let subject = '';
    let html = '';

    switch (type) {
      case 'verification_approved':
        subject = `Your domain ${data.domain} has been verified`;
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Domain Verification Approved</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #000; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; border: 1px solid #eaeaea; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                .details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 4px; }
                .success { color: #10b981; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Domain Verification Approved</h1>
                </div>
                <div class="content">
                  <p>Congratulations!</p>
                  <p>Your domain <strong>${data.domain}</strong> has been successfully verified.</p>
                  
                  <div class="details">
                    <p>Your domain is now:</p>
                    <p><span class="success">✓ Verified</span> and will be highlighted in search results</p>
                    <p><span class="success">✓ Trusted</span> by potential buyers</p>
                    <p><span class="success">✓ Prioritized</span> in marketplace listings</p>
                  </div>
                  
                  <p>Thank you for completing the verification process.</p>
                  <p>Best regards,<br>The DomainX Team</p>
                </div>
                <div class="footer">
                  <p>© 2024 DomainX. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;
        
      case 'verification_rejected':
        subject = `Domain verification for ${data.domain} was not approved`;
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Domain Verification Not Approved</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #000; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; border: 1px solid #eaeaea; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                .details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 4px; }
                .btn { background-color: #000; color: white; display: inline-block; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Domain Verification Not Approved</h1>
                </div>
                <div class="content">
                  <p>Hello,</p>
                  <p>We were unable to verify your domain <strong>${data.domain}</strong>.</p>
                  
                  <div class="details">
                    <p>Possible reasons for verification failure:</p>
                    <ul>
                      <li>The verification records were not found</li>
                      <li>The verification file was not accessible</li>
                      <li>The verification data was incorrect or expired</li>
                    </ul>
                    <p>You can try the verification process again from your dashboard.</p>
                  </div>
                  
                  <p>If you need assistance, please reply to this email.</p>
                  <p>Best regards,<br>The DomainX Team</p>
                </div>
                <div class="footer">
                  <p>© 2024 DomainX. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;
        
      case 'new_offer':
        subject = `New offer for your domain ${data.domain}: $${data.amount}`;
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>New Domain Offer</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #000; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; border: 1px solid #eaeaea; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                .details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 4px; }
                .btn { background-color: #000; color: white; display: inline-block; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>New Domain Offer</h1>
                </div>
                <div class="content">
                  <p>Hello,</p>
                  <p>You have received a new offer for your domain <strong>${data.domain}</strong>.</p>
                  
                  <div class="details">
                    <h3>Offer Details:</h3>
                    <p><strong>Domain:</strong> ${data.domain}</p>
                    <p><strong>Offer Amount:</strong> $${data.amount}</p>
                    <p><strong>Buyer Email:</strong> ${data.buyerEmail}</p>
                    ${data.message ? `<p><strong>Message:</strong> ${data.message}</p>` : ''}
                  </div>
                  
                  <p>You can respond to this offer by logging into your dashboard. If you choose to accept this offer, please contact the buyer using the provided email address to arrange the domain transfer and payment.</p>
                  <a href="${data.dashboardUrl}" class="btn" style="color: white;">View in Dashboard</a>
                  <p>Best regards,<br>The DomainX Team</p>
                </div>
                <div class="footer">
                  <p>© 2024 DomainX. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;
        
      case 'offer_response':
        const status = data.status.toLowerCase();
        subject = `Your offer for ${data.domain} has been ${status}`;
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Domain Offer ${status.charAt(0).toUpperCase() + status.slice(1)}</title>
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
                  <h1>Domain Offer ${status.charAt(0).toUpperCase() + status.slice(1)}</h1>
                </div>
                <div class="content">
                  <p>Hello,</p>
                  <p>Your offer for the domain <strong>${data.domain}</strong> has been <strong>${status}</strong>.</p>
                  
                  <div class="details">
                    <h3>Offer Details:</h3>
                    <p><strong>Domain:</strong> ${data.domain}</p>
                    <p><strong>Your Offer:</strong> $${data.amount}</p>
                    ${data.message ? `<p><strong>Seller Message:</strong> ${data.message}</p>` : ''}
                  </div>
                  
                  ${status === 'accepted' ? 
                    `<p>The domain owner has accepted your offer and will contact you shortly to arrange the domain transfer and payment.</p>
                    <p>If you don't hear from the seller within 48 hours, please contact our support team.</p>` 
                    : 
                    `<p>Thank you for your interest. You can continue browsing other domains in our marketplace.</p>`
                  }
                  <p>Best regards,<br>The DomainX Team</p>
                </div>
                <div class="footer">
                  <p>© 2024 DomainX. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `;
        break;
        
      default:
        throw new Error('Invalid notification type');
    }

    const emailResponse = await resend.emails.send({
      from: "DomainX <no-reply@domain.bf>",
      to: [recipient],
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        message: "Notification sent successfully",
        emailResponse 
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
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
