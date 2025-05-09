
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
      // Get all data needed in one request to reduce API calls
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
      
      // Process domain data and analytics
      const processedDomains = domainsData.map(domain => {
        // Get analytics data from the nested object
        const analyticsData = domain.domain_analytics?.[0] || null;
        
        // Safely handle views data with proper type checking
        let viewsValue = 0;
        if (analyticsData) {
          const rawViews = analyticsData.views;
          
          // Ensure value is treated as a number
          if (typeof rawViews === 'number') {
            viewsValue = rawViews;
          } else if (rawViews !== null && rawViews !== undefined) {
            // Convert string or other type to number
            try {
              viewsValue = parseInt(String(rawViews), 10) || 0;
            } catch {
              viewsValue = 0;
            }
          }
        }
        
        // Remove nested objects for a cleaner structure
        const { domain_analytics, ...domainWithoutAnalytics } = domain;
        
        return {
          ...domainWithoutAnalytics,
          views: viewsValue,
        };
      });
      
      setDomains(processedDomains);

      // Create missing analytics records
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

  // Initial load
  useEffect(() => {
    if (user) {
      loadDomains();
    }
  }, [user, loadDomains]);

  // Refresh function without showing full loading state
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
