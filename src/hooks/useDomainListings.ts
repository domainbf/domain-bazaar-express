import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Domain } from '@/types/domain';

/* ── Fetcher ──────────────────────────────────────────────────── */
// Parallel fetch: listings + ALL analytics in one round-trip
// No domain-ID waterfall — both queries launch simultaneously.
const fetchAvailableDomains = async (): Promise<Domain[]> => {
  const [listingsRes, analyticsRes] = await Promise.all([
    supabase
      .from('domain_listings')
      .select('id,name,price,category,description,status,highlight,is_verified,created_at,owner_id,verification_status')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('domain_analytics')
      .select('domain_id,views,favorites,offers'),
  ]);

  if (listingsRes.error) throw new Error(listingsRes.error.message);
  const listings = listingsRes.data ?? [];
  if (!listings.length) return [];

  const analyticsMap = new Map<string, { views: number; favorites: number; offers: number }>();
  (analyticsRes.data ?? []).forEach((a) => {
    if (a.domain_id) {
      analyticsMap.set(a.domain_id, {
        views:     typeof a.views     === 'number' ? a.views     : Number(a.views)     || 0,
        favorites: typeof a.favorites === 'number' ? a.favorites : Number(a.favorites) || 0,
        offers:    typeof a.offers    === 'number' ? a.offers    : Number(a.offers)    || 0,
      });
    }
  });

  return listings.map((d): Domain => ({
    id: d.id,
    name: d.name ?? '',
    price: Number(d.price) || 0,
    category: d.category ?? 'standard',
    description: d.description ?? '',
    status: d.status ?? 'available',
    highlight: Boolean(d.highlight),
    owner_id: d.owner_id ?? '',
    created_at: d.created_at ?? new Date().toISOString(),
    is_verified: Boolean(d.is_verified),
    verification_status: d.verification_status ?? 'pending',
    views:     analyticsMap.get(d.id)?.views     ?? 0,
    favorites: analyticsMap.get(d.id)?.favorites ?? 0,
    offers:    analyticsMap.get(d.id)?.offers    ?? 0,
  }));
};

/* ── Query key ────────────────────────────────────────────────── */
export const DOMAIN_LISTINGS_KEY = ['domains', 'available'] as const;

/* ── Hook ─────────────────────────────────────────────────────── */
export const useDomainListings = () => {
  return useQuery({
    queryKey: DOMAIN_LISTINGS_KEY,
    queryFn: fetchAvailableDomains,
    staleTime: 3 * 60 * 1000,      // 3 min — fresh enough, no unnecessary refetch
    gcTime:    15 * 60 * 1000,     // keep in memory 15 min
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
  });
};

/* ── Prefetch helper (call on nav-link hover) ─────────────────── */
export const prefetchDomainListings = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.prefetchQuery({
    queryKey: DOMAIN_LISTINGS_KEY,
    queryFn: fetchAvailableDomains,
    staleTime: 3 * 60 * 1000,
  });
};
