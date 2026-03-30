import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserStats {
  totalDomains: number;
  activeListings: number;
  totalValue: number;
  totalViews: number;
  totalOffers: number;
  totalFavorites: number;
  completedTransactions: number;
  avgRating: number;
}

const EMPTY_STATS: UserStats = {
  totalDomains: 0, activeListings: 0, totalValue: 0, totalViews: 0,
  totalOffers: 0, totalFavorites: 0, completedTransactions: 0, avgRating: 0,
};

const fetchUserStats = async (userId: string): Promise<UserStats> => {
  // All three queries launch in parallel
  const [domainsRes, txRes, reviewsRes] = await Promise.all([
    supabase
      .from('domain_listings')
      .select('id,price,status')
      .eq('owner_id', userId),
    supabase
      .from('transactions')
      .select('status')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`),
    supabase
      .from('user_reviews')
      .select('rating')
      .eq('reviewed_user_id', userId),
  ]);

  const domains = domainsRes.data ?? [];
  const domainIds = domains.map(d => d.id);

  // Analytics needs domain IDs, fetch after domains resolve
  const analyticsRes = domainIds.length
    ? await supabase
        .from('domain_analytics')
        .select('views,offers,favorites')
        .in('domain_id', domainIds)
    : { data: [] };

  const analytics = analyticsRes.data ?? [];
  const totalViews     = analytics.reduce((s, a) => s + (Number(a.views)     || 0), 0);
  const totalOffers    = analytics.reduce((s, a) => s + (Number(a.offers)    || 0), 0);
  const totalFavorites = analytics.reduce((s, a) => s + (Number(a.favorites) || 0), 0);

  const reviews = reviewsRes.data ?? [];
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
    : 0;

  return {
    totalDomains: domains.length,
    activeListings: domains.filter(d => d.status === 'available').length,
    totalValue: domains.reduce((s, d) => s + (Number(d.price) || 0), 0),
    totalViews,
    totalOffers,
    totalFavorites,
    completedTransactions: (txRes.data ?? []).filter(t => t.status === 'completed').length,
    avgRating,
  };
};

export const useUserStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: () => fetchUserStats(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
