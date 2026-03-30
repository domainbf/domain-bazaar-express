import { useCallback, useState, useEffect, useRef } from 'react';
import { apiGet } from "@/lib/apiClient";
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

  // 缓存域名数据获取函数
  const fetchDomainsData = useCallback(async (): Promise<Domain[]> => {
    if (!user) return [];
    const data = await apiGet('/data/my-domains');
    const domains = Array.isArray(data) ? data : [];
    setLastUpdated(new Date());
    return domains as Domain[];
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
