
import { useCallback, useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";

interface Domain {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  status?: string;
  is_verified?: boolean;
  created_at?: string;
  views?: number;
  domain_analytics?: {views?: number, id?: string}[];
}

export const useDomainsData = () => {
  const { user } = useAuth();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const loadDomains = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // 优化查询，分别获取domains和analytics
      const { data: domainsData, error: domainsError } = await supabase
        .from('domain_listings')
        .select('*')
        .eq('owner_id', user.id);
      
      if (domainsError) throw domainsError;
      
      if (!domainsData || domainsData.length === 0) {
        setDomains([]);
        setIsLoading(false);
        return;
      }
      
      // 获取这些域名的analytics数据
      const domainIds = domainsData.map(domain => domain.id);
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('domain_analytics')
        .select('*')
        .in('domain_id', domainIds);
      
      if (analyticsError) {
        console.error('Error fetching analytics:', analyticsError);
      }
      
      // 合并数据
      const domainsWithAnalytics = domainsData.map(domain => {
        const analytics = analyticsData?.filter(a => a.domain_id === domain.id) || [];
        const viewsValue = analytics.length > 0 ? Number(analytics[0].views || 0) : 0;
        
        return {
          ...domain,
          views: viewsValue,
          domain_analytics: analytics.map(a => ({
            views: Number(a.views || 0),
            id: a.id
          }))
        };
      });
      
      setDomains(domainsWithAnalytics);

      // 为没有analytics记录的域名创建记录
      for (const domain of domainsData) {
        if (!analyticsData || !analyticsData.some(a => a.domain_id === domain.id)) {
          await createAnalyticsRecord(domain.id);
        }
      }
    } catch (error: any) {
      console.error('Error loading domains:', error);
      toast.error(error.message || '加载域名失败');
      setDomains([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadDomains();
    }
  }, [user, loadDomains]);

  return {
    domains,
    isLoading,
    loadDomains
  };
};
