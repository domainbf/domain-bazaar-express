import { useCallback, useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { Domain } from '@/types/domain';
import { useTranslation } from 'react-i18next';

export interface DomainQueryParams {
  search?: string;
  status?: string;      // all | available | pending | sold
  category?: string;    // all | <category>
  priceRange?: string;  // all | 0-1000 | 1000-5000 | 5000-10000 | 10000+
  sortBy?: string;      // newest | oldest | price-low | price-high | name
  page?: number;        // 1-based
  pageSize?: number;
}

const PRICE_BOUNDS: Record<string, [number, number | null]> = {
  '0-1000': [0, 1000],
  '1000-5000': [1000, 5000],
  '5000-10000': [5000, 10000],
  '10000+': [10000, null],
};

export const useDomainsData = (params: DomainQueryParams = {}) => {
  const {
    search = '',
    status = 'all',
    category = 'all',
    priceRange = 'all',
    sortBy = 'newest',
    page = 1,
    pageSize = 20,
  } = params;

  const { user } = useAuth();
  const { t } = useTranslation();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const reqIdRef = useRef(0);

  const fetchDomains = useCallback(async () => {
    if (!user) {
      setDomains([]);
      setTotalCount(0);
      setIsLoading(false);
      return;
    }
    const reqId = ++reqIdRef.current;
    try {
      const from = Math.max(0, (page - 1) * pageSize);
      const to = from + pageSize - 1;

      let query = (supabase as any)
        .from('domain_listings')
        .select('*', { count: 'exact' })
        .eq('owner_id', user.id);

      const term = search.trim();
      if (term) {
        const safe = term.replace(/[%,()]/g, '');
        if (safe) query = query.or(`name.ilike.%${safe}%,description.ilike.%${safe}%`);
      }
      if (status && status !== 'all') query = query.eq('status', status);
      if (category && category !== 'all') query = query.eq('category', category);
      if (priceRange && priceRange !== 'all' && PRICE_BOUNDS[priceRange]) {
        const [min, max] = PRICE_BOUNDS[priceRange];
        query = query.gte('price', min);
        if (max !== null) query = query.lte('price', max);
      }

      switch (sortBy) {
        case 'oldest': query = query.order('created_at', { ascending: true }); break;
        case 'price-low': query = query.order('price', { ascending: true }); break;
        case 'price-high': query = query.order('price', { ascending: false }); break;
        case 'name': query = query.order('name', { ascending: true }); break;
        default: query = query.order('created_at', { ascending: false });
      }

      const { data, error, count } = await query.range(from, to);
      if (error) throw error;
      if (reqId !== reqIdRef.current) return; // stale response

      setDomains((data ?? []) as Domain[]);
      setTotalCount(count ?? 0);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error loading domains:', err);
      toast.error(err.message || t('domains.loadError', '加载域名失败'));
    } finally {
      if (reqId === reqIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [user, t, search, status, category, priceRange, sortBy, page, pageSize]);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  // Realtime subscription for domain changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('my-domains-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'domain_listings',
        filter: `owner_id=eq.${user.id}`,
      }, () => {
        fetchDomains();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchDomains]);

  const loadDomains = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) setIsLoading(true);
    else setIsRefreshing(true);
    await fetchDomains();
  }, [fetchDomains]);

  const refreshDomains = useCallback(async () => {
    setIsRefreshing(true);
    await fetchDomains();
    toast.success('数据已刷新', { duration: 2000 });
  }, [fetchDomains]);

  return {
    domains,
    totalCount,
    isLoading,
    isRefreshing,
    lastUpdated,
    loadDomains,
    refreshDomains
  };
};
