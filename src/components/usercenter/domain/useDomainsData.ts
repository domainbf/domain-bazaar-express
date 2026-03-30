import { useCallback, useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { Domain } from '@/types/domain';
import { useTranslation } from 'react-i18next';
import { useAppCache } from '@/hooks/useAppCache';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

export const useDomainsData = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const channelRef = useRef<null>(null);

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

    const { data: domainsData, error: domainsError } = await supabase
      .from('domain_listings')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    
    if (domainsError) throw domainsError;
    
    if (!domainsData || domainsData.length === 0) {
      return [];
    }

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

    setLastUpdated(new Date());
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
      toast.success('数据已刷新', { duration: 2000 });
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshCache, clearCache]);

  // 设置实时订阅 (SSE)
  useRealtimeSubscription(
    ['domain_listings'],
    (event) => {
      if (!user || event.type !== 'db-change') return;
      const row = event.new as Record<string, unknown> | undefined;
      if (row?.owner_id === user.id) {
        refreshCache();
      }
    },
    !!user
  );

  return {
    domains,
    isLoading,
    isRefreshing,
    lastUpdated,
    loadDomains,
    refreshDomains
  };
};
