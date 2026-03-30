import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { realtimeClient } from '@/lib/realtime';

export interface SiteConfig {
  site_name: string;
  site_domain: string;
  logo_url: string;
  favicon_url: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  emergency_phone: string;
  hours_online: string;
  hours_phone: string;
  hours_weekday: string;
  support_hours: string;
  hero_title: string;
  hero_subtitle: string;
  hero_search_placeholder: string;
  hero_cta_primary: string;
  hero_cta_secondary: string;
  how_it_works_title: string;
  step1_title: string;
  step1_desc: string;
  step2_title: string;
  step2_desc: string;
  step3_title: string;
  step3_desc: string;
  stats_title: string;
  stat_users: string;
  stat_countries: string;
  stat_volume: string;
  stat_support: string;
  cta_title: string;
  cta_description: string;
  cta_btn_primary: string;
  cta_btn_secondary: string;
  legal_terms_content: string;
  legal_privacy_content: string;
  legal_disclaimer_content: string;
  footer_text: string;
  custom_head_script: string;
  custom_body_script: string;
}

const defaultConfig: SiteConfig = {
  site_name: '域见•你',
  site_domain: '',
  logo_url: '/lovable-uploads/nic.png',
  favicon_url: '/favicon.ico',
  contact_phone: '',
  contact_email: '',
  contact_address: '',
  emergency_phone: '',
  hours_online: '9:00 - 18:00',
  hours_phone: '9:00 - 18:00',
  hours_weekday: '周一至周五（节假日除外）',
  support_hours: '7x24小时在线服务',
  hero_title: '找到您理想的域名',
  hero_subtitle: '探索、发现并获取适合您的下一个大创意的理想域名',
  hero_search_placeholder: '搜索您想要的域名...',
  hero_cta_primary: '浏览域名市场',
  hero_cta_secondary: '开始出售域名',
  how_it_works_title: '如何运作',
  step1_title: '搜索域名',
  step1_desc: '在我们的平台搜索您想要的域名',
  step2_title: '安全交易',
  step2_desc: '通过我们安全的交易系统完成购买',
  step3_title: '域名转移',
  step3_desc: '快速完成域名过户到您的名下',
  stats_title: '平台数据',
  stat_users: '50,000+',
  stat_countries: '100+',
  stat_volume: '$100M+',
  stat_support: '24/7',
  cta_title: '准备好开始了吗？',
  cta_description: '加入我们的域名交易平台，发现无限可能',
  cta_btn_primary: '浏览域名',
  cta_btn_secondary: '用户中心',
  legal_terms_content: '',
  legal_privacy_content: '',
  legal_disclaimer_content: '',
  footer_text: '域见•你 域名交易平台。保留所有权利。',
  custom_head_script: '',
  custom_body_script: '',
};

const ALL_KEYS = Object.keys(defaultConfig);

/* ── Module-level singletons ──────────────────────────────────────
   One fetch, one realtime channel — shared across all consumers.
────────────────────────────────────────────────────────────────── */
let cachedConfig: SiteConfig | null = null;
let fetchPromise: Promise<SiteConfig> | null = null;
let listeners: Array<(c: SiteConfig) => void> = [];
let realtimeChannelId: string | null = null;

export const fetchSiteConfig = async (): Promise<SiteConfig> => {
  // If a fetch is already in flight, reuse it
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ALL_KEYS);

      if (error) throw error;

      const config = { ...defaultConfig };
      data?.forEach(item => {
        if (item.key in config && item.value) {
          (config as any)[item.key] = item.value;
        }
      });

      cachedConfig = config;
      listeners.forEach(l => l(config));
      return config;
    } catch {
      return cachedConfig ?? defaultConfig;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
};

/* Set up ONE realtime channel for the entire app lifetime */
const ensureRealtimeChannel = () => {
  if (realtimeChannelId) return;
  realtimeChannelId = 'site-settings-singleton';
  realtimeClient.subscribe(realtimeChannelId, ['site_settings'], (event) => {
    if (event.type === 'db-change') fetchSiteConfig();
  });
};

export const useSiteSettings = () => {
  const [config, setConfig] = useState<SiteConfig>(cachedConfig ?? defaultConfig);
  const [isLoading, setIsLoading] = useState(!cachedConfig);

  useEffect(() => {
    let mounted = true;

    // Start realtime channel singleton (idempotent)
    ensureRealtimeChannel();

    // Register as a listener for future updates
    const listener = (c: SiteConfig) => {
      if (mounted) { setConfig(c); setIsLoading(false); }
    };
    listeners.push(listener);

    // If we already have cached data, use it immediately
    if (cachedConfig) {
      setConfig(cachedConfig);
      setIsLoading(false);
    } else {
      // Trigger fetch — deduped at module level
      fetchSiteConfig().then(c => {
        if (mounted) { setConfig(c); setIsLoading(false); }
      });
    }

    return () => {
      mounted = false;
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  return { config, isLoading, defaultConfig };
};
