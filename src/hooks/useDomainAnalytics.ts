
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DomainAnalytics } from '@/types/domain';
import { toast } from 'sonner';

export const useDomainAnalytics = (domainId?: string) => {
  const [analytics, setAnalytics] = useState<DomainAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [trends, setTrends] = useState<{ date: string; views: number }[]>([]);

  const loadAnalytics = useCallback(async () => {
    if (!domainId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // Fetch analytics for the domain
      const { data, error } = await supabase
        .from('domain_analytics')
        .select('*')
        .eq('domain_id', domainId)
        .single();
      
      if (error) throw error;
      setAnalytics(data as DomainAnalytics);
      
      // Generate some sample trends data (this would come from a real table in production)
      const today = new Date();
      const trendData = [];
      for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        // Generate some random views with a slight upward trend
        const baseViews = data.views || 0;
        const dailyViews = Math.max(0, Math.floor(Math.random() * (baseViews / 10)) + 
          ((30 - i) * (baseViews > 20 ? 2 : 1)));
        
        trendData.push({
          date: date.toISOString().split('T')[0],
          views: dailyViews
        });
      }
      
      setTrends(trendData);
    } catch (error: any) {
      console.error('Error loading domain analytics:', error);
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  }, [domainId]);
  
  // Record a view for this domain
  const recordView = useCallback(async () => {
    if (!domainId) return;
    
    try {
      const { data, error } = await supabase
        .from('domain_analytics')
        .select('id, views')
        .eq('domain_id', domainId)
        .single();
      
      if (error) {
        console.error('Error getting analytics record:', error);
        // Create a new analytics record if one doesn't exist
        const newRecord = await supabase
          .from('domain_analytics')
          .insert({
            domain_id: domainId,
            views: 1
          })
          .select();
          
        if (newRecord.error) throw newRecord.error;
        return;
      }
      
      // Update existing record with incremented view count
      const { error: updateError } = await supabase
        .from('domain_analytics')
        .update({ 
          views: (data.views || 0) + 1,
          last_updated: new Date().toISOString()
        })
        .eq('id', data.id);
      
      if (updateError) throw updateError;
      
      // Update local state
      if (analytics) {
        setAnalytics({
          ...analytics,
          views: (analytics.views || 0) + 1
        });
      }
    } catch (error: any) {
      console.error('Error recording view:', error);
    }
  }, [domainId, analytics]);
  
  // Favorite a domain
  const toggleFavorite = useCallback(async () => {
    if (!domainId) return;
    
    try {
      // Check if user already favorited this domain
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('请先登录');
        return false;
      }
      
      const { data: existingFavorite, error: favoriteError } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('domain_id', domainId)
        .eq('user_id', userData.user.id)
        .single();
      
      if (favoriteError && favoriteError.code !== 'PGRST116') { // PGRST116 = not found
        throw favoriteError;
      }
      
      if (existingFavorite) {
        // Remove from favorites
        const { error: removeError } = await supabase
          .from('user_favorites')
          .delete()
          .eq('id', existingFavorite.id);
        
        if (removeError) throw removeError;
        
        // Update analytics
        await updateFavoriteCount(domainId, -1);
        toast.success('已从收藏夹移除');
        return false;
      } else {
        // Add to favorites
        const { error: addError } = await supabase
          .from('user_favorites')
          .insert({
            domain_id: domainId,
            user_id: userData.user.id,
            created_at: new Date().toISOString()
          });
        
        if (addError) throw addError;
        
        // Update analytics
        await updateFavoriteCount(domainId, 1);
        toast.success('已添加到收藏夹');
        return true;
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast.error(error.message || '收藏操作失败');
      return null;
    }
  }, [domainId]);
  
  // Helper function to update favorite count
  const updateFavoriteCount = async (domainId: string, change: number) => {
    try {
      const { data, error } = await supabase
        .from('domain_analytics')
        .select('id, favorites')
        .eq('domain_id', domainId)
        .single();
      
      if (error) throw error;
      
      const newCount = Math.max(0, (data.favorites || 0) + change);
      
      const { error: updateError } = await supabase
        .from('domain_analytics')
        .update({ 
          favorites: newCount,
          last_updated: new Date().toISOString()
        })
        .eq('id', data.id);
      
      if (updateError) throw updateError;
      
      // Update local state
      if (analytics) {
        setAnalytics({
          ...analytics,
          favorites: newCount
        });
      }
    } catch (error) {
      console.error('Error updating favorite count:', error);
    }
  };
  
  // Check if user has favorited this domain
  const [isFavorited, setIsFavorited] = useState<boolean | null>(null);
  const checkIfFavorited = useCallback(async () => {
    if (!domainId) return;
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setIsFavorited(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('domain_id', domainId)
        .eq('user_id', userData.user.id)
        .maybeSingle();
      
      if (error) throw error;
      setIsFavorited(!!data);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      setIsFavorited(false);
    }
  }, [domainId]);
  
  useEffect(() => {
    loadAnalytics();
    checkIfFavorited();
  }, [loadAnalytics, checkIfFavorited]);
  
  return {
    analytics,
    isLoading,
    trends,
    recordView,
    toggleFavorite,
    isFavorited,
    checkIfFavorited,
    refresh: loadAnalytics
  };
};
