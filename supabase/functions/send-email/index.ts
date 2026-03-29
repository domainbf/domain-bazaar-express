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
}

// Send email via SMTP using Deno's built-in TLS support
async function sendViaSmtp(
  config: SmtpConfig,
  to: string[],
  subject: string,
  html: string,
  fromOverride?: string,
): Promise<{ success: boolean; error?: string }> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const fromAddr = fromOverride || `${config.from_name} <${config.from_email}>`;

  const readLines = async (conn: Deno.Conn | Deno.TlsConn): Promise<string> => {
    let result = '';
    const buf = new Uint8Array(8192);
    while (true) {
      const n = await conn.read(buf);
      if (!n) break;
      const chunk = decoder.decode(buf.subarray(0, n));
      result += chunk;
      // SMTP responses end with \r\n; multi-line end with "NNN " (space after code)
      if (/^\d{3} /m.test(result) || result.endsWith('\r\n')) break;
    }
    return result;
  };

  const send = async (conn: Deno.Conn | Deno.TlsConn, cmd: string): Promise<string> => {
    await conn.write(encoder.encode(cmd + '\r\n'));
    return await readLines(conn);
  };

  const buildMessage = (): string => {
    const boundary = `boundary_${Date.now()}`;
    const b64html = btoa(unescape(encodeURIComponent(html)));
    const b64subject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    return [
      `From: ${fromAddr}`,
      `To: ${to.join(', ')}`,
      `Subject: ${b64subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      `Date: ${new Date().toUTCString()}`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      b64html,
      '',
      `--${boundary}--`,
      '.',
    ].join('\r\n');
  };

  try {
    if (config.port === 465) {
      // Implicit TLS (SMTPS)
      const conn = await Deno.connectTls({ hostname: config.host, port: 465 });
      try {
        await readLines(conn);                       // greeting
        await send(conn, 'EHLO localhost');
        await send(conn, 'AUTH LOGIN');
        await send(conn, btoa(config.username));
        const authResp = await send(conn, btoa(config.password));
        if (!authResp.startsWith('235')) throw new Error('SMTP 认证失败: ' + authResp.trim());
        await send(conn, `MAIL FROM:<${config.from_email}>`);
        for (const r of to) await send(conn, `RCPT TO:<${r}>`);
        await send(conn, 'DATA');
        const dataResp = await send(conn, buildMessage());
        await send(conn, 'QUIT');
        if (!dataResp.startsWith('250')) throw new Error('SMTP 发送失败: ' + dataResp.trim());
        return { success: true };
      } finally {
        try { conn.close(); } catch (_) { /* ignore */ }
      }
    } else {
      // STARTTLS (port 587 or 25)
      const conn = await Deno.connect({ hostname: config.host, port: config.port });
      try {
        await readLines(conn);                       // greeting
        const ehloResp = await send(conn, 'EHLO localhost');
        if (!ehloResp.includes('STARTTLS') && config.port !== 587) {
          throw new Error('服务器不支持 STARTTLS，请改用端口 465');
        }
        await send(conn, 'STARTTLS');
        const tlsConn = await Deno.startTls(conn, { hostname: config.host });
        try {
          await send(tlsConn, 'EHLO localhost');
          await send(tlsConn, 'AUTH LOGIN');
          await send(tlsConn, btoa(config.username));
          const authResp = await send(tlsConn, btoa(config.password));
          if (!authResp.startsWith('235')) throw new Error('SMTP 认证失败: ' + authResp.trim());
          await send(tlsConn, `MAIL FROM:<${config.from_email}>`);
          for (const r of to) await send(tlsConn, `RCPT TO:<${r}>`);
          await send(tlsConn, 'DATA');
          const dataResp = await send(tlsConn, buildMessage());
          await send(tlsConn, 'QUIT');
          if (!dataResp.startsWith('250')) throw new Error('SMTP 发送失败: ' + dataResp.trim());
          return { success: true };
        } finally {
          try { tlsConn.close(); } catch (_) { /* ignore */ }
        }
      } catch (e) {
        try { conn.close(); } catch (_) { /* ignore */ }
        throw e;
      }
    }
  } catch (err: any) {
    console.error('SMTP error:', err);
    return { success: false, error: err.message };
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

    console.log(`发送邮件到: ${recipients.join(', ')}, 主题: ${subject}`);

    // Read SMTP config from site_settings
    let smtpConfig: SmtpConfig | null = null;

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      const { data: settings } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_from_email', 'smtp_from_name']);

      if (settings && settings.length > 0) {
        const map = Object.fromEntries(settings.map((s: any) => [s.key, s.value]));
        if (map['smtp_host'] && map['smtp_username'] && map['smtp_password']) {
          smtpConfig = {
            host: map['smtp_host'],
            port: parseInt(map['smtp_port'] || '465', 10),
            username: map['smtp_username'],
            password: map['smtp_password'],
            from_email: map['smtp_from_email'] || map['smtp_username'],
            from_name: map['smtp_from_name'] || '域见·你',
          };
        }
      }
    } catch (e) {
      console.warn('读取 site_settings 失败，将尝试环境变量:', e);
    }

    // Fallback: read SMTP from environment variables
    if (!smtpConfig) {
      const envHost = Deno.env.get('SMTP_HOST');
      const envUser = Deno.env.get('SMTP_USERNAME');
      const envPass = Deno.env.get('SMTP_PASSWORD');
      if (envHost && envUser && envPass) {
        smtpConfig = {
          host: envHost,
          port: parseInt(Deno.env.get('SMTP_PORT') || '465', 10),
          username: envUser,
          password: envPass,
          from_email: Deno.env.get('SMTP_FROM_EMAIL') || envUser,
          from_name: Deno.env.get('SMTP_FROM_NAME') || '域见·你',
        };
      }
    }

    if (!smtpConfig) {
      throw new Error('未配置 SMTP。请在管理后台 → 网站设置 → 邮件设置中填写 SMTP 配置。');
    }

    console.log(`使用 SMTP: ${smtpConfig.host}:${smtpConfig.port}`);
    const result = await sendViaSmtp(smtpConfig, recipients, subject, html, from);

    if (!result.success) {
      throw new Error(result.error || 'SMTP 发送失败');
    }

    console.log('邮件发送成功');
    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  } catch (error: any) {
    console.error('邮件发送失败:', error);
    return new Response(
      JSON.stringify({ error: error.message || '邮件发送失败', success: false }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }
});
