
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Domain } from "@/types/domain";
import { handleSupabaseError, retrySupabaseOperation } from '@/utils/supabaseHelpers';

const fetchDomainDetails = async (domainId: string | undefined) => {
  if (!domainId) {
    return null;
  }

  console.log('Fetching domain details for:', domainId);

  try {
    // 根据域名或ID查询
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(domainId);
    const selectQuery = '*, profiles(username, full_name, avatar_url)';

    const domainData = await retrySupabaseOperation(async () => {
      let query;
      if (isUUID) {
        query = supabase.from('domain_listings').select(selectQuery).eq('id', domainId).maybeSingle();
      } else {
        query = supabase.from('domain_listings').select(selectQuery).eq('name', domainId).maybeSingle();
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    });

    if (!domainData) {
      throw new Error('域名不存在或已被删除');
    }
    
    // 使用单独的查询获取 analytics 数据，避免关系查询问题
    const analyticsData = await retrySupabaseOperation(async () => {
      const { data, error } = await supabase
        .from('domain_analytics')
        .select('views, favorites, offers')
        .eq('domain_id', domainData.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching domain analytics", error);
        return { views: 0, favorites: 0, offers: 0 };
      }
      return data;
    });

    const analytics = analyticsData || { views: 0, favorites: 0, offers: 0 };

    const processedDomain: Domain = {
      id: domainData.id,
      name: domainData.name || '',
      price: Number(domainData.price) || 0,
      category: domainData.category || 'standard',
      description: domainData.description || '',
      status: domainData.status || 'available',
      highlight: Boolean(domainData.highlight),
      owner_id: domainData.owner_id || '',
      created_at: domainData.created_at || new Date().toISOString(),
      is_verified: Boolean(domainData.is_verified),
      verification_status: domainData.verification_status || 'pending',
      views: Number(analytics?.views) || 0,
      favorites: Number(analytics?.favorites) || 0,
      offers: Number(analytics?.offers) || 0,
    };

    // 并行执行：获取价格历史、获取相似域名
    const [priceHistoryResult, similarDomainsResult] = await Promise.allSettled([
      retrySupabaseOperation(async () => {
        const { data, error } = await supabase
          .from('domain_price_history')
          .select('*')
          .eq('domain_id', processedDomain.id)
          .order('created_at', { ascending: true })
          .limit(50);
        
        if (error) throw error;
        return data;
      }),
      retrySupabaseOperation(async () => {
        let similarDomainsQuery = supabase
          .from('domain_listings')
          .select('*')
          .eq('status', 'available')
          .neq('name', processedDomain.name)
          .limit(6);

        if (processedDomain.category && processedDomain.category !== 'standard') {
          similarDomainsQuery = similarDomainsQuery.eq('category', processedDomain.category);
        }

        const { data, error } = await similarDomainsQuery;
        if (error) throw error;
        return data;
      })
    ]);

    // Update views count (fire and forget)
    supabase
      .from('domain_analytics')
      .upsert({ domain_id: processedDomain.id, views: (processedDomain.views || 0) + 1 }, { onConflict: 'domain_id' })
      .then(() => console.log('Views updated'))
      .catch(err => console.error('Failed to update views:', err));

    console.log('Domain details fetched successfully');

    return {
      domain: processedDomain,
      priceHistory: priceHistoryResult.status === 'fulfilled' ? (priceHistoryResult.value || []) : [],
      similarDomains: similarDomainsResult.status === 'fulfilled' ? (similarDomainsResult.value || []) : []
    };
  } catch (error) {
    console.error('Error in fetchDomainDetails:', error);
    throw new Error(handleSupabaseError(error as Error));
  }
};

export function useDomainDetail() {
  const { domainId } = useParams<{ domainId: string }>();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['domainDetail', domainId],
    queryFn: () => fetchDomainDetails(domainId),
    enabled: !!domainId,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    gcTime: 10 * 60 * 1000, // 10分钟垃圾回收
    retry: (failureCount, error) => {
      // 只在网络错误时重试，不在域名不存在时重试
      if (error instanceof Error && error.message.includes('域名不存在')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  return {
    domain: data?.domain || null,
    priceHistory: data?.priceHistory || [],
    similarDomains: data?.similarDomains || [],
    isLoading,
    error: error instanceof Error ? error.message : null,
    reload: refetch,
  };
}
