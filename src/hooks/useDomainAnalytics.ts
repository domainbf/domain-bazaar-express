
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DomainAnalytics } from '@/types/domain';

interface TrendData {
  date: string;
  views: number;
}

export const useDomainAnalytics = (domainId: string) => {
  const [analytics, setAnalytics] = useState<DomainAnalytics | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  // Load domain analytics
  const loadAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('domain_analytics')
        .select('*')
        .eq('domain_id', domainId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading analytics:', error);
        return;
      }

      if (data) {
        setAnalytics(data);
      } else {
        // Create analytics record if it doesn't exist
        const { data: newAnalytics } = await supabase
          .from('domain_analytics')
          .insert({ domain_id: domainId, views: 0, favorites: 0, offers: 0 })
          .select()
          .single();
        
        if (newAnalytics) {
          setAnalytics(newAnalytics);
        }
      }
    } catch (error) {
      console.error('Error in loadAnalytics:', error);
    }
  };

  // Generate mock trend data for the last 30 days
  const generateTrendData = () => {
    const trends: TrendData[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate some mock data with a trend
      const baseViews = Math.max(0, Math.floor(Math.random() * 10) + i * 0.1);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        views: baseViews
      });
    }
    
    return trends;
  };

  // Record a view
  const recordView = async () => {
    try {
      const { error } = await supabase.rpc('increment_domain_views', {
        domain_id: domainId
      });

      if (error) {
        // Fallback to manual update if function doesn't exist
        await supabase
          .from('domain_analytics')
          .upsert({ 
            domain_id: domainId, 
            views: (analytics?.views || 0) + 1,
            favorites: analytics?.favorites || 0,
            offers: analytics?.offers || 0
          });
      }

      // Reload analytics
      await loadAnalytics();
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  // Toggle favorite
  const toggleFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      if (isFavorited) {
        // Remove favorite
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('domain_id', domainId);
        
        setIsFavorited(false);
      } else {
        // Add favorite
        await supabase
          .from('user_favorites')
          .insert({ user_id: user.id, domain_id: domainId });
        
        setIsFavorited(true);
      }

      // Update analytics
      const newFavoriteCount = (analytics?.favorites || 0) + (isFavorited ? -1 : 1);
      await supabase
        .from('domain_analytics')
        .upsert({ 
          domain_id: domainId, 
          views: analytics?.views || 0,
          favorites: newFavoriteCount,
          offers: analytics?.offers || 0
        });

      await loadAnalytics();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Check if domain is favorited by current user
  const checkFavoriteStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('domain_id', domainId)
        .single();

      setIsFavorited(!!data);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  useEffect(() => {
    const initializeAnalytics = async () => {
      setIsLoading(true);
      await loadAnalytics();
      await checkFavoriteStatus();
      
      // Generate mock trend data
      setTrends(generateTrendData());
      
      setIsLoading(false);
    };

    if (domainId) {
      initializeAnalytics();
    }
  }, [domainId]);

  return {
    analytics,
    trends,
    isLoading,
    isFavorited,
    recordView,
    toggleFavorite
  };
};
