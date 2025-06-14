
import { Resend } from "https://esm.sh/resend@4.1.2";

export async function sendEmail(
  resend: Resend,
  recipient: string,
  subject: string,
  body: string
) {
  const fromEmail = "noreply@sale.nic.bn";

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: [recipient],
    subject: subject,
    html: body,
  });

  if (error) {
    console.error(`Failed to send email to ${recipient}:`, error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  console.log(`Successfully sent email to ${recipient}`);
}
