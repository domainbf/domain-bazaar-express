import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteConfig {
  site_name: string;
  contact_phone: string;
  contact_email: string;
  footer_text: string;
  logo_url: string;
  support_hours: string;
}

const defaultConfig: SiteConfig = {
  site_name: '域见•你',
  contact_phone: '400-123-4567',
  contact_email: 'support@example.com',
  footer_text: '域见•你 域名交易平台。保留所有权利。',
  logo_url: '/lovable-uploads/nic.png',
  support_hours: '7x24小时在线服务',
};

let cachedConfig: SiteConfig | null = null;
let listeners: Array<(c: SiteConfig) => void> = [];

const notifyListeners = (config: SiteConfig) => {
  listeners.forEach(fn => fn(config));
};

export const fetchSiteConfig = async (): Promise<SiteConfig> => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['site_name', 'contact_phone', 'contact_email', 'footer_text', 'logo_url', 'support_hours']);
    
    if (error) throw error;
    
    const config = { ...defaultConfig };
    data?.forEach(item => {
      if (item.key in config && item.value) {
        (config as any)[item.key] = item.value;
      }
    });
    
    cachedConfig = config;
    return config;
  } catch {
    return cachedConfig || defaultConfig;
  }
};

export const useSiteSettings = () => {
  const [config, setConfig] = useState<SiteConfig>(cachedConfig || defaultConfig);
  const [isLoading, setIsLoading] = useState(!cachedConfig);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const c = await fetchSiteConfig();
      if (mounted) {
        setConfig(c);
        setIsLoading(false);
      }
    };

    load();

    // Listen for realtime changes
    const channel = supabase
      .channel('site_settings_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => {
        load();
      })
      .subscribe();

    const listener = (c: SiteConfig) => { if (mounted) setConfig(c); };
    listeners.push(listener);

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  return { config, isLoading };
};
