
import { useCallback, useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { Domain } from '@/types/domain';

export const useDomainsData = () => {
  const { user } = useAuth();
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

  const loadDomains = useCallback(async (showLoadingState = true) => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    if (showLoadingState) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    try {
      // 优化: 一次性获取所需的所有数据，减少API请求次数
      const { data: domainsData, error: domainsError } = await supabase
        .from('domain_listings')
        .select(`
          *,
          domain_analytics(views, favorites, offers)
        `)
        .eq('owner_id', user.id);
      
      if (domainsError) throw domainsError;
      
      if (!domainsData || domainsData.length === 0) {
        setDomains([]);
        return;
      }
      
      // 处理域名数据和分析数据
      const processedDomains = domainsData.map(domain => {
        // 从嵌套对象中提取分析数据
        const analyticsData = domain.domain_analytics?.[0];
        
        // 确保我们正确处理数据类型，首先检查analyticsData是否存在
        let viewsValue = 0;
        if (analyticsData) {
          // 确保views是数字类型
          viewsValue = typeof analyticsData.views === 'number' 
            ? analyticsData.views 
            : analyticsData.views 
              ? parseInt(String(analyticsData.views), 10) 
              : 0;
        }
        
        // 移除嵌套对象，保持数据结构扁平化
        const { domain_analytics, ...domainWithoutAnalytics } = domain;
        
        return {
          ...domainWithoutAnalytics,
          views: viewsValue,
        };
      });
      
      setDomains(processedDomains);

      // 创建缺失的分析记录
      const missingAnalytics = domainsData.filter(domain => !domain.domain_analytics || domain.domain_analytics.length === 0);
      for (const domain of missingAnalytics) {
        await createAnalyticsRecord(domain.id);
      }
    } catch (error: any) {
      console.error('Error loading domains:', error);
      toast.error(error.message || '加载域名失败');
      setDomains([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  // 首次加载
  useEffect(() => {
    if (user) {
      loadDomains();
    }
  }, [user, loadDomains]);

  // 提供刷新功能但不显示全屏加载状态
  const refreshDomains = useCallback(() => {
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
