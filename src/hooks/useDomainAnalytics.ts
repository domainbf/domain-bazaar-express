import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DomainAnalytics } from '@/types/domain';

interface TrendData {
  date: string;
  views: number;
}

interface InitialData {
  analytics?: DomainAnalytics | null;
}

export const useDomainAnalytics = (domainId: string, initialData?: InitialData) => {
  const [analytics, setAnalytics] = useState<DomainAnalytics | null>(initialData?.analytics ?? null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [isLoading, setIsLoading] = useState(!initialData?.analytics);
  const [isFavorited, setIsFavorited] = useState(false);

  const loadAnalytics = useCallback(async () => {
    if (!domainId) return;
    try {
      const { data } = await supabase
        .from('domain_analytics')
        .select('*')
        .eq('domain_id', domainId)
        .maybeSingle();

      if (data) {
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  }, [domainId]);

  const generateTrendData = useCallback((): TrendData[] => {
    const result: TrendData[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      result.push({
        date: date.toISOString().split('T')[0],
        views: Math.max(0, Math.floor(Math.random() * 10 + (29 - i) * 0.2)),
      });
    }
    return result;
  }, []);

  const recordView = useCallback(async () => {
    if (!domainId) return;
    const sessionKey = `domain_viewed_${domainId}`;
    if (sessionStorage.getItem(sessionKey)) return;

    try {
      const { error } = await supabase.rpc('increment_domain_views', { p_domain_id: domainId });
      if (!error) {
        sessionStorage.setItem(sessionKey, 'true');
        setAnalytics(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null);
      }
    } catch (err) {
      console.error('Error recording view:', err);
    }
  }, [domainId]);

  const toggleFavorite = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return;
    }

    try {
      if (isFavorited) {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('domain_id', domainId);
        setIsFavorited(false);
        setAnalytics(prev => prev ? { ...prev, favorites: Math.max(0, (prev.favorites || 0) - 1) } : null);
        await supabase
          .from('domain_analytics')
          .update({ favorites: Math.max(0, (analytics?.favorites || 1) - 1), last_updated: new Date().toISOString() })
          .eq('domain_id', domainId);
      } else {
        const { error: insertError } = await supabase
          .from('user_favorites')
          .insert({ user_id: user.id, domain_id: domainId });
        if (!insertError) {
          setIsFavorited(true);
          setAnalytics(prev => prev ? { ...prev, favorites: (prev.favorites || 0) + 1 } : null);
          await supabase
            .from('domain_analytics')
            .update({ favorites: (analytics?.favorites || 0) + 1, last_updated: new Date().toISOString() })
            .eq('domain_id', domainId);
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  }, [domainId, isFavorited, analytics]);

  const checkFavoriteStatus = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('domain_id', domainId)
        .maybeSingle();

      setIsFavorited(!!data);
    } catch (err) {
      console.error('Error checking favorite status:', err);
    }
  }, [domainId]);

  useEffect(() => {
    if (!domainId) return;

    const init = async () => {
      setIsLoading(true);
      await Promise.all([
        initialData?.analytics ? Promise.resolve() : loadAnalytics(),
        checkFavoriteStatus(),
      ]);
      setTrends(generateTrendData());
      setIsLoading(false);
    };

    init();
  }, [domainId]);

  return {
    analytics,
    trends,
    isLoading,
    isFavorited,
    recordView,
    toggleFavorite,
    loadAnalytics,
  };
};
