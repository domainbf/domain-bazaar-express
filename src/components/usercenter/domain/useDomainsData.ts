import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { Domain } from '@/types/domain';
import { useTranslation } from 'react-i18next';

export const useDomainsData = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDomains = useCallback(async () => {
    if (!user) {
      setDomains([]);
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('domain_listings')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDomains((data ?? []) as Domain[]);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error loading domains:', err);
      toast.error(err.message || t('domains.loadError', '加载域名失败'));
    } finally {
      setIsLoading(false);
    }
  }, [user, t]);

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
    setIsRefreshing(false);
  }, [fetchDomains]);

  const refreshDomains = useCallback(async () => {
    setIsRefreshing(true);
    await fetchDomains();
    setIsRefreshing(false);
    toast.success('数据已刷新', { duration: 2000 });
  }, [fetchDomains]);

  return {
    domains,
    isLoading,
    isRefreshing,
    lastUpdated,
    loadDomains,
    refreshDomains
  };
};
