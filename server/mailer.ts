/**
 * Unified email sender — supports real SMTP (any provider) with Resend API fallback.
 *
 * Priority:
 *   1. Real SMTP  — if smtp_host + smtp_username + smtp_password are configured
 *   2. Resend API — if resend_api_key (or smtp_password alone) is configured
 *   3. No-op      — logs a warning; never throws so callers aren't broken
 */
import nodemailer from 'nodemailer';
import { db } from './db.js';

interface EmailSettings {
  smtp_host?: string;
  smtp_port?: string;
  smtp_username?: string;
  smtp_password?: string;
  smtp_from_email?: string;
  smtp_from_name?: string;
  resend_api_key?: string;
}

async function getEmailSettings(): Promise<EmailSettings> {
  const r = await db.execute(
    "SELECT key, value FROM site_settings WHERE key IN " +
    "('smtp_host','smtp_port','smtp_username','smtp_password','smtp_from_email','smtp_from_name','resend_api_key')"
  );
  const s: EmailSettings = {};
  for (const row of r.rows) {
    (s as Record<string, string>)[row.key as string] = row.value as string;
  }
  return s;
}

/**
 * Send an email.  Throws only on hard SMTP / API errors so callers can decide
 * whether to surface the error or swallow it.
 */
export async function sendMail(
  to: string | string[],
  subject: string,
  html: string
): Promise<void> {
  const s = await getEmailSettings();
  const fromEmail = s.smtp_from_email || 'noreply@nic.rw';
  const fromName  = s.smtp_from_name  || '域见·你';
  const from      = `"${fromName}" <${fromEmail}>`;
  const toArr     = Array.isArray(to) ? to : [to];

  // ── 1. Real SMTP ─────────────────────────────────────────────────────────
  if (s.smtp_host && s.smtp_username && s.smtp_password) {
    const port   = parseInt(s.smtp_port || '465', 10);
    // port 465 → implicit TLS (secure); 587/25 → STARTTLS
    const secure = port === 465;

    const transporter = nodemailer.createTransport({
      host: s.smtp_host,
      port,
      secure,
      auth: {
        user: s.smtp_username,
        pass: s.smtp_password,
      },
      // Generous timeout for slow mail servers
      connectionTimeout: 10_000,
      greetingTimeout:   8_000,
      socketTimeout:     15_000,
    });

    await transporter.sendMail({
      from,
      to:      toArr.join(', '),
      subject,
      html,
    });

    console.log(`[SMTP] ✓ Sent to ${toArr.join(', ')} via ${s.smtp_host} — ${subject}`);
    return;
  }

  // ── 2. Resend API fallback ────────────────────────────────────────────────
  const resendKey = s.resend_api_key || s.smtp_password || '';
  if (resendKey) {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: toArr, subject, html }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend API error ${res.status}: ${err}`);
    }

    console.log(`[Resend] ✓ Sent to ${toArr.join(', ')} — ${subject}`);
    return;
  }

  // ── 3. No provider configured ─────────────────────────────────────────────
  console.warn('[EMAIL] No email provider configured — email not sent.');
}

/**
 * Test the current email configuration by sending a test message.
 * Returns { ok, provider, error? }.
 */
export async function testMailConfig(
  toAddr: string,
  overrideSmtp?: Partial<EmailSettings>
): Promise<{ ok: boolean; provider: string; error?: string }> {
  const s = { ...(await getEmailSettings()), ...overrideSmtp };
  const fromEmail = s.smtp_from_email || 'noreply@nic.rw';
  const fromName  = s.smtp_from_name  || '域见·你';
  const from      = `"${fromName}" <${fromEmail}>`;

  const html = `<p>这是一封来自 <strong>域见·你 · NIC.RW</strong> 的测试邮件。</p>
<p>如果您收到这封邮件，说明 SMTP 配置正确。</p>
<hr><small>发送时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</small>`;

  // Try SMTP first
  if (s.smtp_host && s.smtp_username && s.smtp_password) {
    try {
      const port   = parseInt(s.smtp_port || '465', 10);
      const secure = port === 465;
      const transporter = nodemailer.createTransport({
        host: s.smtp_host, port, secure,
        auth: { user: s.smtp_username, pass: s.smtp_password },
        connectionTimeout: 10_000,
        greetingTimeout:   8_000,
        socketTimeout:     15_000,
      });
      await transporter.sendMail({ from, to: toAddr, subject: '✉ 域见·你 邮件配置测试', html });
      return { ok: true, provider: `SMTP (${s.smtp_host}:${s.smtp_port || 465})` };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, provider: `SMTP (${s.smtp_host})`, error: msg };
    }
  }

  // Resend fallback
  const resendKey = s.resend_api_key || s.smtp_password || '';
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [toAddr], subject: '✉ 域见·你 邮件配置测试', html }),
      });
      if (!res.ok) {
        const err = await res.text();
        return { ok: false, provider: 'Resend API', error: `${res.status}: ${err}` };
      }
      return { ok: true, provider: 'Resend API' };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, provider: 'Resend API', error: msg };
    }
  }

  return { ok: false, provider: '未配置', error: '未配置任何邮件服务' };
}
