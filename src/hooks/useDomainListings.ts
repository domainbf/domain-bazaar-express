import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Domain } from '@/types/domain';

const LISTING_COLUMNS =
  'id, name, price, currency, category, description, status, highlight, owner_id, created_at, is_verified, verification_status';

const fetchAvailableDomains = async (): Promise<Domain[]> => {
  // Only select the columns the marketplace renders — much lighter payload than `*`
  const { data: listings, error } = await (supabase as any)
    .from('domain_listings')
    .select(LISTING_COLUMNS)
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) throw new Error(error.message);

  const rows = listings ?? [];

  // Fetch analytics for these domains (chunked to stay within URL limits)
  const ids = rows.map((d: any) => d.id);
  let analyticsMap: Record<string, any> = {};
  if (ids.length > 0) {
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 200) chunks.push(ids.slice(i, i + 200));
    const results = await Promise.all(
      chunks.map((chunk) =>
        (supabase as any)
          .from('domain_analytics')
          .select('domain_id, views, favorites, offers')
          .in('domain_id', chunk)
      )
    );
    for (const r of results) {
      for (const a of (r.data ?? [])) analyticsMap[a.domain_id as string] = a;
    }
  }


  return rows.map((d: any): Domain => ({
    id: String(d.id ?? ''),
    name: String(d.name ?? ''),
    price: Number(d.price) || 0,
    currency: String(d.currency ?? 'CNY'),
    category: String(d.category ?? 'standard'),
    description: String(d.description ?? ''),
    status: String(d.status ?? 'available'),
    highlight: Boolean(d.highlight),
    owner_id: String(d.owner_id ?? ''),
    created_at: String(d.created_at ?? new Date().toISOString()),
    is_verified: Boolean(d.is_verified),
    verification_status: String(d.verification_status ?? 'pending'),
    views: Number(analyticsMap[d.id]?.views) || 0,
    favorites: Number(analyticsMap[d.id]?.favorites) || 0,
    offers: Number(analyticsMap[d.id]?.offers) || 0,
  }));

};

export const DOMAIN_LISTINGS_KEY = ['domains', 'available'] as const;

export const useDomainListings = () => {
  return useQuery({
    queryKey: DOMAIN_LISTINGS_KEY,
    queryFn: fetchAvailableDomains,
    staleTime: 2 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });
};

export const prefetchDomainListings = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.prefetchQuery({
    queryKey: DOMAIN_LISTINGS_KEY,
    queryFn: fetchAvailableDomains,
    staleTime: 2 * 60 * 1000,
  });
};

// ─── Sold domains ────────────────────────────────────────────────────────────
const fetchSoldDomains = async (): Promise<Domain[]> => {
  const { data, error } = await (supabase as any)
    .from('domain_listings')
    .select(LISTING_COLUMNS)
    .eq('status', 'sold')
    .order('created_at', { ascending: false })
    .limit(60);

  if (error) throw new Error(error.message);

  return (data ?? []).map((d: any): Domain => ({
    id: String(d.id ?? ''),
    name: String(d.name ?? ''),
    price: Number(d.price) || 0,
    currency: String(d.currency ?? 'CNY'),
    category: String(d.category ?? 'standard'),
    description: String(d.description ?? ''),
    status: 'sold',
    highlight: Boolean(d.highlight),
    owner_id: String(d.owner_id ?? ''),
    created_at: String(d.created_at ?? new Date().toISOString()),
    is_verified: Boolean(d.is_verified),
    verification_status: String(d.verification_status ?? 'pending'),
  }));
};

export const SOLD_LISTINGS_KEY = ['domains', 'sold'] as const;

export const useSoldListings = () =>
  useQuery({
    queryKey: SOLD_LISTINGS_KEY,
    queryFn: fetchSoldDomains,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
