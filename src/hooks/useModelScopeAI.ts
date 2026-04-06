import { supabase } from '@/integrations/supabase/client';

export interface DomainLogoType {}

// ─── Generate and save a single domain logo via edge function ─────────

export async function generateAndSaveDomainLogo(
  domainId: string,
  domainName: string,
  onProgress?: (msg: string) => void,
  _type?: string,
  category?: string
): Promise<string | null> {
  try {
    onProgress?.(`正在生成 ${domainName} 的域名 Logo…`);

    const { data, error } = await supabase.functions.invoke('generate-domain-logo', {
      body: { domainId, domainName, category },
    });

    if (error) throw new Error(error.message || 'Edge function failed');
    if (data?.error) throw new Error(data.error);

    const logoUrl = data?.logoUrl;
    if (!logoUrl) throw new Error('No logo URL returned');

    onProgress?.(`✓ ${domainName} Logo 生成成功`);
    return logoUrl;
  } catch (err: any) {
    onProgress?.(`✗ ${domainName} Logo 生成失败: ${err.message}`);
    return null;
  }
}

// ─── Batch generate logos ─────────────────────────────────────────────

export async function batchGenerateLogos(
  domains: Array<{ id: string; name: string; category?: string }>,
  onProgress?: (msg: string, total: number, done: number) => void
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (let i = 0; i < domains.length; i++) {
    const d = domains[i];
    onProgress?.(`生成 ${d.name} 的 Logo…`, domains.length, i);

    try {
      const { data, error } = await supabase.functions.invoke('generate-domain-logo', {
        body: { domainId: d.id, domainName: d.name, category: d.category },
      });

      if (error || data?.error) throw new Error(error?.message || data?.error);
      success++;
    } catch {
      failed++;
    }

    // Rate limit spacing
    if (i < domains.length - 1) await new Promise(r => setTimeout(r, 1500));
  }

  onProgress?.(`完成！成功 ${success} 个，失败 ${failed} 个`, domains.length, domains.length);
  return { success, failed };
}

// ─── Read domain logo URL from site_settings ─────────────────────────

export async function getDomainLogoUrl(domainId: string): Promise<string | null> {
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', `domain_logo_${domainId}`)
    .single();
  return data?.value || null;
}

// ─── Build logo prompt (exported for reuse) ──────────────────────────

export function buildLogoPrompt(domainName: string, _type?: string, category?: string): string {
  const parts = domainName.split('.');
  const base = parts[0].toUpperCase();
  return `Professional logo for domain "${domainName}" featuring "${base}", pure black and white, square format`;
}
