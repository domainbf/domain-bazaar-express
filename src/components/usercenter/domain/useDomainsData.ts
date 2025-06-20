
import { useCallback, useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { Domain } from '@/types/domain';
import { useTranslation } from 'react-i18next';

export const useDomainsData = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

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

  const loadDomains = useCallback(async (showLoadingState = true) => {
    if (!user) {
      setIsLoading(false);
      setDomains([]);
      setHasLoaded(true);
      return;
    }
    
    try {
      if (showLoadingState) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      console.log('Loading domains for user:', user.id);
      
      const { data: domainsData, error: domainsError } = await supabase
        .from('domain_listings')
        .select('*')
        .eq('owner_id', user.id);
      
      if (domainsError) throw domainsError;
      
      if (!domainsData || domainsData.length === 0) {
        console.log('No domains found for user');
        setDomains([]);
        return;
      }

      console.log('Found domains:', domainsData.length);

      // 使用单独的查询获取 analytics 数据，避免关系查询问题
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
      
      setDomains(processedDomains as Domain[]);

      // 为缺失 analytics 的域名创建记录
      const missingAnalytics = domainsData.filter(domain => !analyticsMap.has(domain.id));
      for (const domain of missingAnalytics) {
        await createAnalyticsRecord(domain.id);
      }

      console.log('Domains loaded successfully');
    } catch (error: any) {
      console.error('Error loading domains:', error);
      toast.error(error.message || t('domains.loadError', '加载域名失败'));
      setDomains([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setHasLoaded(true);
    }
  }, [user, t]);

  // Initial load only once when user is available
  useEffect(() => {
    if (user && !hasLoaded) {
      console.log('Initializing domain load for user:', user.id);
      loadDomains();
    } else if (!user) {
      // 如果没有用户，直接设置为已加载状态，避免无限等待
      setIsLoading(false);
      setHasLoaded(true);
      setDomains([]);
    }
  }, [user, hasLoaded, loadDomains]);

  // Refresh function without showing full loading state
  const refreshDomains = useCallback(() => {
    setHasLoaded(false);
    return loadDomains(false);
  }, [loadDomains]);

  return {
    domains,
    isLoading,
    isRefreshing,
    loadDomains,
    refreshDomains
  };
};
