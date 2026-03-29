import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  enabled: boolean;
}

// Send email via SMTP using Deno's built-in TLS support
async function sendViaSmtp(config: SmtpConfig, to: string[], subject: string, html: string, from?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const fromAddr = from || `${config.from_name} <${config.from_email}>`;
    
    // Use a lightweight SMTP approach via fetch to a relay or direct socket
    // For edge functions, we use the denonomail approach
    const conn = await Deno.connect({ hostname: config.host, port: config.port });
    
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    async function readLine(): Promise<string> {
      const buf = new Uint8Array(4096);
      const n = await conn.read(buf);
      return n ? decoder.decode(buf.subarray(0, n)) : '';
    }

    async function sendCmd(cmd: string): Promise<string> {
      await conn.write(encoder.encode(cmd + '\r\n'));
      return await readLine();
    }

    // Read greeting
    await readLine();
    
    // EHLO
    let ehloResp = await sendCmd(`EHLO localhost`);
    
    // Check if STARTTLS is available
    if (ehloResp.includes('STARTTLS') || config.port === 587) {
      await sendCmd('STARTTLS');
      // Upgrade to TLS
      const tlsConn = await Deno.startTls(conn, { hostname: config.host });
      
      // Re-assign connection methods
      const tlsReadLine = async (): Promise<string> => {
        const buf = new Uint8Array(4096);
        const n = await tlsConn.read(buf);
        return n ? decoder.decode(buf.subarray(0, n)) : '';
      };
      const tlsSendCmd = async (cmd: string): Promise<string> => {
        await tlsConn.write(encoder.encode(cmd + '\r\n'));
        return await tlsReadLine();
      };

      await tlsSendCmd(`EHLO localhost`);
      
      // AUTH LOGIN
      await tlsSendCmd('AUTH LOGIN');
      await tlsSendCmd(btoa(config.username));
      const authResp = await tlsSendCmd(btoa(config.password));
      if (!authResp.startsWith('235')) {
        tlsConn.close();
        throw new Error('SMTP authentication failed: ' + authResp);
      }
      
      // MAIL FROM
      await tlsSendCmd(`MAIL FROM:<${config.from_email}>`);
      
      // RCPT TO
      for (const recipient of to) {
        await tlsSendCmd(`RCPT TO:<${recipient}>`);
      }
      
      // DATA
      await tlsSendCmd('DATA');
      
      const boundary = `boundary_${Date.now()}`;
      const message = [
        `From: ${fromAddr}`,
        `To: ${to.join(', ')}`,
        `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        `Date: ${new Date().toUTCString()}`,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        btoa(unescape(encodeURIComponent(html))),
        '',
        `--${boundary}--`,
        '.',
      ].join('\r\n');
      
      const dataResp = await tlsSendCmd(message);
      await tlsSendCmd('QUIT');
      tlsConn.close();
      
      if (!dataResp.startsWith('250')) {
        return { success: false, error: 'SMTP send failed: ' + dataResp };
      }
      
      return { success: true };
    } else if (config.port === 465) {
      // Port 465 uses implicit TLS - close plain conn and use startTls directly
      conn.close();
      
      const tlsConn = await Deno.connectTls({ hostname: config.host, port: config.port });
      
      const tlsReadLine = async (): Promise<string> => {
        const buf = new Uint8Array(4096);
        const n = await tlsConn.read(buf);
        return n ? decoder.decode(buf.subarray(0, n)) : '';
      };
      const tlsSendCmd = async (cmd: string): Promise<string> => {
        await tlsConn.write(encoder.encode(cmd + '\r\n'));
        return await tlsReadLine();
      };

      await tlsReadLine(); // greeting
      await tlsSendCmd(`EHLO localhost`);
      
      await tlsSendCmd('AUTH LOGIN');
      await tlsSendCmd(btoa(config.username));
      const authResp = await tlsSendCmd(btoa(config.password));
      if (!authResp.startsWith('235')) {
        tlsConn.close();
        throw new Error('SMTP authentication failed: ' + authResp);
      }
      
      await tlsSendCmd(`MAIL FROM:<${config.from_email}>`);
      for (const recipient of to) {
        await tlsSendCmd(`RCPT TO:<${recipient}>`);
      }
      await tlsSendCmd('DATA');
      
      const boundary = `boundary_${Date.now()}`;
      const message = [
        `From: ${fromAddr}`,
        `To: ${to.join(', ')}`,
        `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        `Date: ${new Date().toUTCString()}`,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        btoa(unescape(encodeURIComponent(html))),
        '',
        `--${boundary}--`,
        '.',
      ].join('\r\n');
      
      const dataResp = await tlsSendCmd(message);
      await tlsSendCmd('QUIT');
      tlsConn.close();
      
      if (!dataResp.startsWith('250')) {
        return { success: false, error: 'SMTP send failed: ' + dataResp };
      }
      return { success: true };
    } else {
      // Plain SMTP (port 25) - unlikely but handle it
      conn.close();
      return { success: false, error: 'Unsupported SMTP port configuration. Use port 465 or 587.' };
    }
  } catch (error: any) {
    console.error('SMTP send error:', error);
    return { success: false, error: error.message };
  }
}

// Fallback: send via Resend if SMTP is not configured
async function sendViaResend(to: string[], subject: string, html: string, from?: string): Promise<{ success: boolean; error?: string; id?: string }> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { success: false, error: 'Neither SMTP nor RESEND_API_KEY is configured' };
  }

  try {
    const { Resend } = await import("https://esm.sh/resend@4.1.2");
    const resend = new Resend(resendApiKey);
    const fromEmail = from || "域见•你 <noreply@nic.bn>";
    
    const response = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (response.error) {
      return { success: false, error: response.error.message };
    }
    return { success: true, id: response.data?.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, from }: EmailRequest = await req.json();
    
    const recipients = Array.isArray(to) ? to : [to];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of recipients) {
      if (!emailRegex.test(email)) {
        throw new Error(`无效的邮箱地址: ${email}`);
      }
    }

    console.log(`准备发送邮件到: ${recipients.join(', ')}, 主题: ${subject}`);

    // Try SMTP first from database settings
    let smtpConfig: SmtpConfig | null = null;
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      
      const { data: smtp } = await supabase
        .from('smtp_settings')
        .select('*')
        .eq('enabled', true)
        .limit(1)
        .single();

      if (smtp) {
        smtpConfig = {
          host: smtp.host,
          port: smtp.port,
          username: smtp.username,
          password: smtp.password,
          from_email: smtp.from_email,
          from_name: smtp.from_name,
          enabled: true,
        };
      }
    } catch (e) {
      console.log('No SMTP settings found, will try Resend fallback');
    }

    let result: { success: boolean; error?: string; id?: string };

    if (smtpConfig) {
      console.log(`Using SMTP: ${smtpConfig.host}:${smtpConfig.port}`);
      const smtpFrom = from || `${smtpConfig.from_name} <${smtpConfig.from_email}>`;
      result = await sendViaSmtp(smtpConfig, recipients, subject, html, smtpFrom);
      
      if (!result.success) {
        console.warn('SMTP failed, falling back to Resend:', result.error);
        result = await sendViaResend(recipients, subject, html, smtpFrom);
      }
    } else {
      console.log('No SMTP configured, using Resend');
      result = await sendViaResend(recipients, subject, html, from);
    }

    if (!result.success) {
      throw new Error(result.error || '邮件发送失败');
    }

    console.log('邮件发送成功');
    
    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully', id: result.id }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('邮件发送失败:', error);
    return new Response(
      JSON.stringify({ error: error.message || '邮件发送失败', success: false }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
