import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet } from '@/lib/apiClient';
import { Domain } from '@/types/domain';

/* ── Fetcher — uses API server (Redis-cached for 60s) ─────────── */
const fetchAvailableDomains = async (): Promise<Domain[]> => {
  const rows = await apiGet<Record<string, unknown>[]>(
    '/data/domain-listings?status=available&limit=200&analytics=1'
  );
  return (rows ?? []).map((d): Domain => ({
    id: String(d.id ?? ''),
    name: String(d.name ?? ''),
    price: Number(d.price) || 0,
    category: String(d.category ?? 'standard'),
    description: String(d.description ?? ''),
    status: String(d.status ?? 'available'),
    highlight: Boolean(d.highlight),
    owner_id: String(d.owner_id ?? ''),
    created_at: String(d.created_at ?? new Date().toISOString()),
    is_verified: Boolean(d.is_verified),
    verification_status: String(d.verification_status ?? 'pending'),
    views:     Number(d.views)     || 0,
    favorites: Number(d.favorites) || 0,
    offers:    Number(d.offers)    || 0,
  }));
};

/* ── Query key ────────────────────────────────────────────────── */
export const DOMAIN_LISTINGS_KEY = ['domains', 'available'] as const;

/* ── Hook ─────────────────────────────────────────────────────── */
export const useDomainListings = () => {
  return useQuery({
    queryKey: DOMAIN_LISTINGS_KEY,
    queryFn: fetchAvailableDomains,
    staleTime: 2 * 60 * 1000,
    gcTime:    20 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });
};

/* ── Prefetch helper (call on nav-link hover) ─────────────────── */
export const prefetchDomainListings = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.prefetchQuery({
    queryKey: DOMAIN_LISTINGS_KEY,
    queryFn: fetchAvailableDomains,
    staleTime: 2 * 60 * 1000,
  });
};
