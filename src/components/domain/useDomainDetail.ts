
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Domain } from "@/types/domain";

const fetchDomainDetails = async (identifier: string | undefined) => {
  if (!identifier) return null;

  const normalized = decodeURIComponent(identifier).trim();
  console.log('Fetching domain details for:', normalized);

  // 判断是否为 UUID；否则按名称不区分大小写精确匹配
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized);

  let domainData: any = null;
  let domainError: any = null;

  if (isUUID) {
    ({ data: domainData, error: domainError } = await supabase
      .from('domain_listings')
      .select('*')
      .eq('id', normalized)
      .maybeSingle());
  } else {
    ({ data: domainData, error: domainError } = await supabase
      .from('domain_listings')
      .select('*')
      .ilike('name', normalized)
      .maybeSingle());
  }

  if (domainError) {
    console.error('Error fetching domain:', domainError);
    throw new Error('域名加载失败');
  }

  if (!domainData) {
    throw new Error('域名不存在或已被删除');
  }

  // 单独查询拥有者资料（无外键时避免联表错误）
  let profileData: any = null;
  if (domainData.owner_id) {
    const { data: pData, error: pErr } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, contact_email, seller_rating, seller_verified')
      .eq('id', domainData.owner_id)
      .maybeSingle();
    if (pErr) console.warn('Fetching profile failed:', pErr.message);
    profileData = pData || null;
  }

  // 查询 analytics
  const { data: analyticsData, error: analyticsError } = await supabase
    .from('domain_analytics')
    .select('views, favorites, offers')
    .eq('domain_id', domainData.id)
    .maybeSingle();
  if (analyticsError) console.warn('Error fetching domain analytics', analyticsError);
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
    owner: profileData
      ? {
          id: profileData.id,
          username: profileData.username,
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url,
          bio: profileData.bio,
          contact_email: profileData.contact_email,
          seller_rating: profileData.seller_rating,
          seller_verified: profileData.seller_verified,
        }
      : undefined,
  };

  // 增加浏览量
  const { data: currentAnalytics } = await supabase
    .from('domain_analytics')
    .select('views, favorites, offers')
    .eq('domain_id', processedDomain.id)
    .maybeSingle();

  const currentViews = currentAnalytics?.views || 0;
  const updateViewsPromise = supabase
    .from('domain_analytics')
    .upsert(
      {
        domain_id: processedDomain.id,
        views: currentViews + 1,
        favorites: currentAnalytics?.favorites || 0,
        offers: currentAnalytics?.offers || 0,
        last_updated: new Date().toISOString(),
      },
      { onConflict: 'domain_id' }
    );

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

  console.log('Domain details fetched successfully');
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
