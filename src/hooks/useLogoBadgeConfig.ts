import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LogoBadgeConfig {
  enabled: boolean;
  grayscale: number; // 0-100
  opacity: number;   // 0-100
  overlay: number;   // 0-100 底部遮罩强度
  version: number;   // 缓存失效时间戳
}

export const defaultBadgeConfig: LogoBadgeConfig = {
  enabled: false,
  grayscale: 100,
  opacity: 55,
  overlay: 80,
  version: 0,
};

const KEYS = [
  'logo_badge_enabled',
  'logo_badge_grayscale',
  'logo_badge_opacity',
  'logo_badge_overlay',
  'logo_badge_version',
];

let cached: LogoBadgeConfig | null = null;
let listeners: Array<(c: LogoBadgeConfig) => void> = [];
let inflight: Promise<LogoBadgeConfig> | null = null;

function parse(raw: Record<string, string>): LogoBadgeConfig {
  const num = (k: string, d: number) => {
    const n = Number(raw[k]);
    return Number.isFinite(n) ? n : d;
  };
  return {
    enabled: raw.logo_badge_enabled === 'true',
    grayscale: Math.max(0, Math.min(100, num('logo_badge_grayscale', defaultBadgeConfig.grayscale))),
    opacity: Math.max(0, Math.min(100, num('logo_badge_opacity', defaultBadgeConfig.opacity))),
    overlay: Math.max(0, Math.min(100, num('logo_badge_overlay', defaultBadgeConfig.overlay))),
    version: num('logo_badge_version', 0),
  };
}

export async function fetchLogoBadgeConfig(): Promise<LogoBadgeConfig> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data } = await supabase.from('site_settings').select('key,value').in('key', KEYS);
      const raw: Record<string, string> = {};
      (data ?? []).forEach((r: any) => { if (r?.value != null) raw[r.key] = String(r.value); });
      const cfg = parse(raw);
      cached = cfg;
      listeners.forEach(fn => fn(cfg));
      return cfg;
    } catch {
      return cached ?? defaultBadgeConfig;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function useLogoBadgeConfig() {
  const [config, setConfig] = useState<LogoBadgeConfig>(cached ?? defaultBadgeConfig);

  useEffect(() => {
    let mounted = true;
    const l = (c: LogoBadgeConfig) => { if (mounted) setConfig(c); };
    listeners.push(l);
    if (!cached) void fetchLogoBadgeConfig();
    else setConfig(cached);

    const channel = supabase
      .channel(`logo-badge-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings', filter: `key=in.(${KEYS.join(',')})` },
        () => { cached = null; void fetchLogoBadgeConfig(); })
      .subscribe();

    return () => {
      mounted = false;
      listeners = listeners.filter(x => x !== l);
      void supabase.removeChannel(channel);
    };
  }, []);

  return config;
}
