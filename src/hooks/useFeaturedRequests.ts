import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DOMAIN_LISTINGS_KEY } from '@/hooks/useDomainListings';
import { HOME_DATA_KEY } from '@/hooks/useHomeData';

export type FeaturedRequestStatus = 'pending' | 'approved' | 'rejected';

export interface FeaturedRequest {
  id: string;
  domain_id: string;
  domain_name: string;
  requester_id: string;
  reason: string | null;
  status: FeaturedRequestStatus;
  reviewer_id: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export const FEATURED_REQUESTS_KEY = ['featured-requests'] as const;

const table = () => (supabase as any).from('featured_requests');

/** Current user's own featured-slot applications. */
export const useMyFeaturedRequests = (userId?: string) =>
  useQuery({
    queryKey: [...FEATURED_REQUESTS_KEY, 'mine', userId ?? 'anon'],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async (): Promise<FeaturedRequest[]> => {
      const { data, error } = await table()
        .select('*')
        .eq('requester_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as FeaturedRequest[];
    },
  });

/** Admin review queue. */
export const useFeaturedRequestQueue = (status: FeaturedRequestStatus | 'all') =>
  useQuery({
    queryKey: [...FEATURED_REQUESTS_KEY, 'queue', status],
    staleTime: 15_000,
    queryFn: async (): Promise<FeaturedRequest[]> => {
      let q = table().select('*').order('created_at', { ascending: false }).limit(300);
      if (status !== 'all') q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []) as FeaturedRequest[];
    },
  });

/**
 * Keep the featured lists in sync in real time: a review decision flips
 * `domain_listings.highlight`, so both the marketplace and homepage refetch.
 */
export const useFeaturedRealtimeSync = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: DOMAIN_LISTINGS_KEY });
      queryClient.invalidateQueries({ queryKey: HOME_DATA_KEY });
      queryClient.invalidateQueries({ queryKey: FEATURED_REQUESTS_KEY });
    };

    const channel = supabase
      .channel('featured-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_requests' }, invalidate)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'domain_listings' }, invalidate)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
