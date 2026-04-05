import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Domain } from '@/types/domain';

const fetchAvailableDomains = async (): Promise<Domain[]> => {
  // Fetch domain listings with analytics via a join
  const { data: listings, error } = await supabase
    .from('domain_listings')
    .select('*')
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  const rows = listings ?? [];

  // Fetch analytics for these domains
  const ids = rows.map((d: any) => d.id);
  let analyticsMap: Record<string, any> = {};
  if (ids.length > 0) {
    const { data: analytics } = await supabase
      .from('domain_analytics')
      .select('domain_id, views, favorites, offers')
      .in('domain_id', ids);
    for (const a of (analytics ?? [])) {
      analyticsMap[a.domain_id as string] = a;
    }
  }

  return rows.map((d: any): Domain => ({
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
