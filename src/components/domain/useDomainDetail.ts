
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Domain } from "@/types/domain";

const fetchDomainDetails = async (identifier: string | undefined) => {
  if (!identifier) return null;

  const normalized = decodeURIComponent(identifier).trim();
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized);

  // 并行查询域名和分析数据
  const domainQuery = isUUID
    ? supabase.from('domain_listings').select('*').eq('id', normalized).maybeSingle()
    : supabase.from('domain_listings').select('*').ilike('name', normalized).maybeSingle();

  const [{ data: domainData, error: domainError }] = await Promise.all([domainQuery]);

  if (domainError || !domainData) {
    throw new Error('域名不存在或已被删除');
  }

  // 并行获取所有相关数据
  const [profileResult, analyticsResult, priceHistoryResult, similarDomainsResult] = await Promise.all([
    domainData.owner_id
      ? supabase.from('profiles').select('id, username, full_name, avatar_url, bio, contact_email, seller_rating, seller_verified').eq('id', domainData.owner_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.from('domain_analytics').select('views, favorites, offers').eq('domain_id', domainData.id).maybeSingle(),
    supabase.from('domain_price_history').select('*').eq('domain_id', domainData.id).order('created_at', { ascending: true }).limit(50),
    supabase.from('domain_listings').select('*').eq('status', 'available').neq('name', domainData.name).limit(6),
  ]);

  const analytics = analyticsResult.data || { views: 0, favorites: 0, offers: 0 };

  // 异步更新浏览量（不阻塞返回）
  supabase.from('domain_analytics').upsert(
    {
      domain_id: domainData.id,
      views: (analytics.views || 0) + 1,
      favorites: analytics.favorites || 0,
      offers: analytics.offers || 0,
      last_updated: new Date().toISOString(),
    },
    { onConflict: 'domain_id' }
  ).then();

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
    views: Number(analytics.views) || 0,
    favorites: Number(analytics.favorites) || 0,
    offers: Number(analytics.offers) || 0,
    owner: profileResult.data ? {
      id: profileResult.data.id,
      username: profileResult.data.username,
      full_name: profileResult.data.full_name,
      avatar_url: profileResult.data.avatar_url,
      bio: profileResult.data.bio,
      contact_email: profileResult.data.contact_email,
      seller_rating: profileResult.data.seller_rating,
      seller_verified: profileResult.data.seller_verified,
    } : undefined,
  };

  return {
    domain: processedDomain,
    priceHistory: priceHistoryResult.data || [],
    similarDomains: similarDomainsResult.data || [],
  };
};

export function useDomainDetail() {
  const { domainId, domainName } = useParams<{ domainId?: string; domainName?: string }>();

  // 使用domainName优先，fallback到domainId
  const identifier = domainName || domainId;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['domainDetail', identifier],
    queryFn: () => fetchDomainDetails(identifier),
    enabled: !!identifier,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
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
