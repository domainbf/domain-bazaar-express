
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isUuidLike, safeDecodeDomainIdentifier } from "@/lib/domainRouting";
import { Domain } from "@/types/domain";

interface DomainDetailResponse {
  domain: Domain & {
    views?: number;
    favorites?: number;
    offers?: number;
    owner?: {
      id: string;
      username?: string;
      full_name?: string;
      avatar_url?: string;
      bio?: string;
      seller_rating?: number;
      seller_verified?: boolean;
    };
  };
  priceHistory: Array<{
    id: string;
    domain_id: string;
    price: number;
    previous_price?: number;
    created_at: string;
  }>;
  similarDomains: Domain[];
}

const toDomain = (
  domain: Partial<DomainDetailResponse['domain']> | null | undefined,
  analytics?: { views?: number | null; favorites?: number | null; offers?: number | null } | null,
  owner?: DomainDetailResponse['domain']['owner'] | null,
): Domain => ({
  id: String(domain?.id ?? ''),
  name: String(domain?.name ?? ''),
  price: Number(domain?.price) || 0,
  category: String(domain?.category ?? 'standard'),
  description: String(domain?.description ?? ''),
  status: String(domain?.status ?? 'available'),
  highlight: Boolean(domain?.highlight),
  owner_id: String(domain?.owner_id ?? ''),
  created_at: String(domain?.created_at ?? new Date().toISOString()),
  is_verified: Boolean(domain?.is_verified),
  verification_status: String(domain?.verification_status ?? 'pending'),
  currency: String(domain?.currency ?? 'CNY'),
  views: Number(analytics?.views ?? domain?.views) || 0,
  favorites: Number(analytics?.favorites ?? domain?.favorites) || 0,
  offers: Number(analytics?.offers ?? domain?.offers) || 0,
  owner: owner ?? domain?.owner ?? undefined,
});

const fetchDomainDetails = async (identifier: string | undefined) => {
  const normalized = safeDecodeDomainIdentifier(identifier);
  if (!normalized) return null;

  const domainQuery = isUuidLike(normalized)
    ? supabase
        .from('domain_listings')
        .select('*')
        .eq('id', normalized)
        .maybeSingle()
    : supabase
        .from('domain_listings')
        .select('*')
        .ilike('name', normalized)
        .limit(1)
        .maybeSingle();

  const { data: domainRow, error: domainError } = await domainQuery;

  if (domainError) {
    throw new Error(domainError.message);
  }

  if (!domainRow) {
    return null;
  }

  const [analyticsResult, priceHistoryResult, similarDomainsResult, ownerResult] = await Promise.allSettled([
    supabase
      .from('domain_analytics')
      .select('views, favorites, offers')
      .eq('domain_id', domainRow.id)
      .maybeSingle(),
    supabase
      .from('domain_price_history')
      .select('id, domain_id, price, previous_price, created_at')
      .eq('domain_id', domainRow.id)
      .order('created_at', { ascending: true })
      .limit(50),
    supabase
      .from('domain_listings')
      .select('id, name, price, category, description, status, highlight, owner_id, created_at, is_verified, verification_status, currency')
      .eq('status', 'available')
      .neq('id', domainRow.id)
      .order('created_at', { ascending: false })
      .limit(6),
    domainRow.owner_id
      ? supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio, seller_rating, seller_verified')
          .eq('id', domainRow.owner_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const analytics = analyticsResult.status === 'fulfilled' && !analyticsResult.value.error
    ? analyticsResult.value.data
    : null;

  const priceHistory = priceHistoryResult.status === 'fulfilled' && !priceHistoryResult.value.error
    ? priceHistoryResult.value.data ?? []
    : [];

  const similarDomains = similarDomainsResult.status === 'fulfilled' && !similarDomainsResult.value.error
    ? (similarDomainsResult.value.data ?? []).map((domain) => toDomain(domain))
    : [];

  const owner = ownerResult.status === 'fulfilled' && !ownerResult.value.error
    ? ownerResult.value.data ?? null
    : null;

  return {
    domain: toDomain(domainRow, analytics, owner),
    priceHistory,
    similarDomains,
  };
};

export function useDomainDetail() {
  const { domainId, domainName } = useParams<{ domainId?: string; domainName?: string }>();

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
