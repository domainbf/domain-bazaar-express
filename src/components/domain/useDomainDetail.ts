
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { apiGet } from "@/lib/apiClient";
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

const fetchDomainDetails = async (identifier: string | undefined) => {
  if (!identifier) return null;

  const normalized = decodeURIComponent(identifier).trim();
  const data = await apiGet<DomainDetailResponse>(`/data/domain-listings/${encodeURIComponent(normalized)}/detail`);

  const d = data.domain;
  const processedDomain: Domain = {
    id: d.id,
    name: d.name || '',
    price: Number(d.price) || 0,
    category: d.category || 'standard',
    description: d.description || '',
    status: d.status || 'available',
    highlight: Boolean(d.highlight),
    owner_id: d.owner_id || '',
    created_at: d.created_at || new Date().toISOString(),
    is_verified: Boolean(d.is_verified),
    verification_status: d.verification_status || 'pending',
    currency: d.currency || 'CNY',
    views: Number(d.views) || 0,
    favorites: Number(d.favorites) || 0,
    offers: Number(d.offers) || 0,
    owner: d.owner ?? undefined,
  };

  return {
    domain: processedDomain,
    priceHistory: data.priceHistory || [],
    similarDomains: (data.similarDomains || []).map((s: any) => ({
      ...s,
      price: Number(s.price) || 0,
    })),
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
