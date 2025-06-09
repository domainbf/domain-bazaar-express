
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Domain, SearchFilters, SearchSuggestion } from '@/types/domain';
import { useDebounce } from '@/hooks/useDebounce';

export const useEnhancedSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [domains, setDomains] = useState<Domain[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // 生成搜索建议
  const generateSuggestions = (term: string): SearchSuggestion[] => {
    if (!term || term.length < 2) return [];
    
    const suggestions: SearchSuggestion[] = [];
    
    // 精确匹配建议
    suggestions.push({
      domain: term,
      type: 'exact',
      score: 1.0
    });
    
    // 相似域名建议
    const extensions = ['.com', '.net', '.org', '.io', '.ai', '.co'];
    extensions.forEach(ext => {
      if (!term.includes('.')) {
        suggestions.push({
          domain: term + ext,
          type: 'similar',
          score: 0.8
        });
      }
    });
    
    // 趋势建议
    const trendingKeywords = ['ai', 'crypto', 'nft', 'web3', 'meta', 'cloud'];
    trendingKeywords.forEach(keyword => {
      if (term.toLowerCase().includes(keyword)) {
        suggestions.push({
          domain: `${term}-${keyword}.com`,
          type: 'trending',
          score: 0.6
        });
      }
    });
    
    return suggestions.slice(0, 8);
  };

  // 构建搜索查询
  const buildSearchQuery = () => {
    let query = supabase
      .from('domain_listings')
      .select(`
        *,
        domain_analytics(views, favorites, offers)
      `, { count: 'exact' })
      .eq('status', 'available');

    // 搜索词过滤
    if (debouncedSearchTerm) {
      query = query.ilike('name', `%${debouncedSearchTerm}%`);
    }

    // 分类过滤
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    // 价格范围过滤
    if (filters.priceRange) {
      if (filters.priceRange.min > 0) {
        query = query.gte('price', filters.priceRange.min);
      }
      if (filters.priceRange.max > 0) {
        query = query.lte('price', filters.priceRange.max);
      }
    }

    // 排序
    if (filters.sortBy) {
      const order = filters.sortOrder || 'asc';
      switch (filters.sortBy) {
        case 'price':
          query = query.order('price', { ascending: order === 'asc' });
          break;
        case 'name':
          query = query.order('name', { ascending: order === 'asc' });
          break;
        case 'length':
          // 按域名长度排序需要在客户端处理
          break;
        case 'popularity':
          // 需要联合查询 domain_analytics
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }
    } else {
      query = query.order('created_at', { ascending: false });
    }

    return query;
  };

  // 执行搜索
  const performSearch = async () => {
    setIsLoading(true);
    try {
      const query = buildSearchQuery();
      const { data, error, count } = await query;

      if (error) {
        console.error('Search error:', error);
        return;
      }

      let processedDomains = (data || []).map(domain => {
        const analyticsArray = domain.domain_analytics;
        const analyticsData = Array.isArray(analyticsArray) && analyticsArray.length > 0 ? analyticsArray[0] : null;
        
        let viewsValue = 0;
        if (analyticsData && typeof analyticsData === 'object' && analyticsData !== null) {
          const analytics = analyticsData as { views?: number };
          viewsValue = analytics.views || 0;
        }
        
        const { domain_analytics, ...domainWithoutAnalytics } = domain;
        return {
          ...domainWithoutAnalytics,
          views: viewsValue,
        };
      });

      // 客户端排序处理
      if (filters.sortBy === 'length') {
        const order = filters.sortOrder || 'asc';
        processedDomains.sort((a, b) => {
          const lengthA = a.name.length;
          const lengthB = b.name.length;
          return order === 'asc' ? lengthA - lengthB : lengthB - lengthA;
        });
      } else if (filters.sortBy === 'popularity') {
        const order = filters.sortOrder || 'desc';
        processedDomains.sort((a, b) => {
          const viewsA = a.views || 0;
          const viewsB = b.views || 0;
          return order === 'desc' ? viewsB - viewsA : viewsA - viewsB;
        });
      }

      // 长度过滤
      if (filters.length) {
        processedDomains = processedDomains.filter(domain => {
          const length = domain.name.length;
          const min = filters.length?.min || 0;
          const max = filters.length?.max || Infinity;
          return length >= min && length <= max;
        });
      }

      setDomains(processedDomains);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 记录搜索活动
  const logSearchActivity = async () => {
    if (!debouncedSearchTerm) return;
    
    try {
      // 将搜索参数转换为符合 JSONB 格式的对象
      const metadata = {
        search_term: debouncedSearchTerm,
        filters: JSON.parse(JSON.stringify(filters)), // 确保是纯JSON对象
        results_count: totalCount
      };

      await supabase.from('user_activities').insert({
        activity_type: 'search',
        metadata: metadata
      });
    } catch (error) {
      console.error('Failed to log search activity:', error);
    }
  };

  // 更新搜索建议
  useEffect(() => {
    setSuggestions(generateSuggestions(searchTerm));
  }, [searchTerm]);

  // 执行搜索
  useEffect(() => {
    performSearch();
  }, [debouncedSearchTerm, filters]);

  // 记录搜索活动
  useEffect(() => {
    if (debouncedSearchTerm) {
      logSearchActivity();
    }
  }, [debouncedSearchTerm, totalCount]);

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    domains,
    suggestions,
    isLoading,
    totalCount,
    performSearch
  };
};
