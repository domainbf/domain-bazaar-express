import { supabase } from '@/integrations/supabase/client';

/** Generate a random verification token. */
export const generateVerificationToken = (): string =>
  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

/** Human-readable verification error. */
export const formatVerificationError = (error: any): string => {
  console.error('Verification error:', error);
  return error?.message || '验证过程中发生错误';
};

/** Format a domain (strip protocol / trailing slash / lowercase). */
export const formatDomainName = (domain: string): string =>
  domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

/**
 * Real DNS TXT propagation check — proxies to the `check-domain-verification`
 * edge function which queries native DNS + Google DoH + Cloudflare DoH.
 */
export const checkDNSPropagation = async (
  domain: string,
  recordName: string,
  expectedValue: string,
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('check-domain-verification', {
      body: { checkOnly: true, recordName, expectedValue, domain },
    });
    if (error) throw error;
    return !!(data as any)?.verified;
  } catch (error) {
    console.error('DNS propagation check error:', error);
    return false;
  }
};

/**
 * Check whether an HTML verification file at the given URL contains the token.
 */
export const checkFileAccessibility = async (url: string, expectedToken?: string): Promise<boolean> => {
  try {
    const resp = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (!resp.ok) return false;
    if (!expectedToken) return true;
    const text = await resp.text();
    return text.includes(expectedToken);
  } catch (error) {
    console.error('File accessibility check error:', error);
    return false;
  }
};

/** Fetch a page and check that a given <meta name=... content=...> exists. */
export const checkMetaTag = async (
  url: string,
  metaName: string,
  metaContent: string,
): Promise<boolean> => {
  try {
    const resp = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (!resp.ok) return false;
    const html = await resp.text();
    const re = new RegExp(
      `<meta[^>]+name=["']${metaName}["'][^>]+content=["']${metaContent}["']`,
      'i',
    );
    return re.test(html);
  } catch (error) {
    console.error('Meta tag check error:', error);
    return false;
  }
};

/**
 * Query WHOIS via edge function and look for the token anywhere in the record.
 */
export const checkWhoisInfo = async (domain: string, token: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('whois-query', {
      body: { domain },
    });
    if (error) throw error;
    const raw = JSON.stringify((data as any)?.whois_data ?? data ?? '');
    return raw.toLowerCase().includes(token.toLowerCase());
  } catch (error) {
    console.error('WHOIS check error:', error);
    return false;
  }
};

/**
 * Trigger a verification email via the `send-email` edge function.
 */
export const sendVerificationEmail = async (
  email: string,
  domainName: string,
  token: string,
): Promise<boolean> => {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: email,
        subject: `${domainName} 域名所有权验证`,
        html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2>域名验证</h2>
          <p>您正在验证域名 <b>${domainName}</b> 的所有权。您的验证码为：</p>
          <div style="font-size:22px;font-weight:700;letter-spacing:2px;background:#f5f5f7;padding:16px;border-radius:8px;text-align:center;margin:16px 0">${token}</div>
          <p style="color:#666;font-size:12px">如非本人操作，请忽略此邮件。</p>
        </div>`,
      },
    });
    return !error;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};
