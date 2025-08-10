
import { useCallback, useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { Domain } from '@/types/domain';
import { useTranslation } from 'react-i18next';
import { useAppCache } from '@/hooks/useAppCache';

export const useDomainsData = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const createAnalyticsRecord = async (domainId: string) => {
    try {
      const { error } = await supabase.from('domain_analytics').insert({
        domain_id: domainId,
        views: 0,
        favorites: 0,
        offers: 0
      });
      
      if (error) {
        console.error('Error creating analytics record:', error);
      }
    } catch (error) {
      console.error('Error creating analytics record:', error);
    }
  };

  // 缓存域名数据获取函数
  const fetchDomainsData = useCallback(async (): Promise<Domain[]> => {
    if (!user) return [];

    console.log('Loading domains for user:', user.id);
    
    const { data: domainsData, error: domainsError } = await supabase
      .from('domain_listings')
      .select('*')
      .eq('owner_id', user.id);
    
    if (domainsError) throw domainsError;
    
    if (!domainsData || domainsData.length === 0) {
      console.log('No domains found for user');
      return [];
    }

    console.log('Found domains:', domainsData.length);

    // 获取分析数据
    const domainIds = domainsData.map(d => d.id);
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('domain_analytics')
      .select('*')
      .in('domain_id', domainIds);
    
    if (analyticsError) {
      console.error("Error fetching analytics data", analyticsError);
    }

    const analyticsMap = new Map();
    if (analyticsData) {
      analyticsData.forEach(item => {
        analyticsMap.set(item.domain_id, item);
      });
    }
    
    const processedDomains = domainsData.map(domain => {
      const analytics = analyticsMap.get(domain.id);
      return {
        ...domain,
        views: analytics?.views || 0,
        favorites: analytics?.favorites || 0,
        offers: analytics?.offers || 0,
      };
    });

    // 为缺失 analytics 的域名创建记录
    const missingAnalytics = domainsData.filter(domain => !analyticsMap.has(domain.id));
    for (const domain of missingAnalytics) {
      await createAnalyticsRecord(domain.id);
    }

    console.log('Domains loaded successfully');
    return processedDomains as Domain[];
  }, [user]);

  // 使用缓存钩子
  const {
    data: cachedDomains,
    loading: cacheLoading,
    error: cacheError,
    refresh: refreshCache,
    clearCache
  } = useAppCache(
    `domains_${user?.id || 'anonymous'}`,
    fetchDomainsData,
    { ttl: 2 * 60 * 1000 } // 2分钟缓存
  );

  // 同步缓存数据到本地状态
  useEffect(() => {
    if (cachedDomains) {
      setDomains(cachedDomains);
    }
    setIsLoading(cacheLoading);
  }, [cachedDomains, cacheLoading]);

  // 处理错误
  useEffect(() => {
    if (cacheError) {
      console.error('Error loading domains:', cacheError);
      toast.error(cacheError.message || t('domains.loadError', '加载域名失败'));
    }
  }, [cacheError, t]);

  const loadDomains = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      await refreshCache();
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [refreshCache]);

  const refreshDomains = useCallback(async () => {
    setIsRefreshing(true);
    try {
      clearCache(); // 清除缓存强制刷新
      await refreshCache();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshCache, clearCache]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`domain_listings_owner_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'domain_listings',
          filter: `owner_id=eq.${user.id}`,
        },
        () => {
          // 实时刷新缓存数据
          refreshCache();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshCache]);

  return {
    domains,
    isLoading,
    isRefreshing,
    loadDomains,
    refreshDomains
  };
};
