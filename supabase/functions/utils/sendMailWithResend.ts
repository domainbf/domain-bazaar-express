interface EmailOptions {
  from?: string;
}

export async function sendMailWithResend(
  to: string,
  subject: string,
  html: string,
  options: EmailOptions = {}
): Promise<{ data?: { id: string }, error?: any }> {
  try {
    console.log(`Sending email to ${to} with subject: ${subject}`);
    
    const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        from: options.from || "NIC.BN 域名交易平台 <noreply@sale.nic.bn>"
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Email service error: ${errorText}`);
    }

    const result = await emailResponse.json();
    console.log(`Email sent successfully to ${to}`);
    
    return { data: { id: result.id || 'sent' } };
  } catch (error: any) {
    console.error(`Failed to send email to ${to}:`, error);
    return { error: error.message };
  }
}