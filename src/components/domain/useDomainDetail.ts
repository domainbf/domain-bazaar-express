
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Domain } from "@/types/domain";

const fetchDomainDetails = async (domainId: string | undefined) => {
  if (!domainId) {
    return null;
  }

  // 根据域名或ID查询
  let domainQuery;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(domainId);
  const selectQuery = '*, domain_analytics(views, favorites, offers), profiles(username, full_name, avatar_url)';

  if (isUUID) {
    domainQuery = supabase.from('domain_listings').select(selectQuery).eq('id', domainId).single();
  } else {
    domainQuery = supabase.from('domain_listings').select(selectQuery).eq('name', domainId).single();
  }

  const { data: domainData, error: domainError } = await domainQuery;

  if (domainError) {
    throw new Error('域名不存在或已被删除');
  }

  const analytics = Array.isArray(domainData.domain_analytics) && domainData.domain_analytics.length > 0
    ? domainData.domain_analytics[0]
    : { views: 0, favorites: 0, offers: 0 };

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

  // 并行执行：更新浏览量、获取价格历史、获取相似域名
  const updateViewsPromise = supabase
    .from('domain_analytics')
    .upsert({ domain_id: processedDomain.id, views: (processedDomain.views || 0) + 1 }, { onConflict: 'domain_id' });

  const priceHistoryPromise = supabase
    .from('domain_price_history')
    .select('*')
    .eq('domain_id', processedDomain.id)
    .order('created_at', { ascending: true })
    .limit(50);
  
  let similarDomainsQuery = supabase
    .from('domain_listings')
    .select('*')
    .eq('status', 'available')
    .neq('name', processedDomain.name)
    .limit(6);

  if (processedDomain.category && processedDomain.category !== 'standard') {
    similarDomainsQuery = similarDomainsQuery.eq('category', processedDomain.category);
  }

  const [priceHistoryResult, similarDomainsResult] = await Promise.all([
    priceHistoryPromise,
    similarDomainsQuery,
    updateViewsPromise,
  ]);

  return {
    domain: processedDomain,
    priceHistory: priceHistoryResult.data || [],
    similarDomains: similarDomainsResult.data || []
  };
};

export function useDomainDetail() {
  const { domainId } = useParams<{ domainId: string }>();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['domainDetail', domainId],
    queryFn: () => fetchDomainDetails(domainId),
    enabled: !!domainId,
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
