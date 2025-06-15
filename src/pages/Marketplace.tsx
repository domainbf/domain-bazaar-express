
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navbar } from '@/components/Navbar';
import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader';
import { FilterSection } from '@/components/marketplace/FilterSection';
import { DomainListings } from '@/components/marketplace/DomainListings';
import { Pagination } from '@/components/common/Pagination';
import { Domain } from '@/types/domain';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { handleSupabaseError, retrySupabaseOperation } from '@/utils/supabaseHelpers';
import { SafeComponent } from '@/components/common/SafeComponent';

const ITEMS_PER_PAGE = 12;

export const Marketplace = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<{min: string, max: string}>({min: '', max: ''});
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const { handleError } = useErrorHandler();

  // 构建查询条件
  const buildQuery = useCallback(() => {
    let query = supabase
      .from('domain_listings')
      .select('*', { count: 'exact' })
      .eq('status', 'available');

    // 应用分类过滤
    if (filter !== 'all') {
      query = query.eq('category', filter);
    }

    // 应用搜索过滤
    if (searchQuery.trim()) {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    // 应用价格范围过滤
    if (priceRange.min) {
      const minPrice = parseFloat(priceRange.min);
      if (!isNaN(minPrice)) {
        query = query.gte('price', minPrice);
      }
    }

    if (priceRange.max) {
      const maxPrice = parseFloat(priceRange.max);
      if (!isNaN(maxPrice)) {
        query = query.lte('price', maxPrice);
      }
    }

    // 应用验证过滤
    if (verifiedOnly) {
      query = query.eq('is_verified', true);
    }

    return query;
  }, [filter, searchQuery, priceRange, verifiedOnly]);

  // 优化的加载函数
  const loadDomains = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading domains from marketplace, page:', page);
      
      const query = buildQuery()
        .order('created_at', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);
      
      const listingsResult = await retrySupabaseOperation(async () => {
        const { data, error, count } = await query;
        if (error) throw error;
        return { data, count };
      });
      
      console.log('Loaded domain listings:', listingsResult.data?.length || 0);
      setTotalCount(listingsResult.count || 0);
      
      if (!listingsResult.data || listingsResult.data.length === 0) {
        setDomains([]);
        return;
      }
      
      // 获取所有域名的分析数据（批量查询）
      const domainIds = listingsResult.data.map(domain => domain.id);
      
      const analyticsData = await retrySupabaseOperation(async () => {
        const { data, error } = await supabase
          .from('domain_analytics')
          .select('domain_id, views, favorites, offers')
          .in('domain_id', domainIds);
        
        if (error) {
          console.error('Error fetching analytics:', error);
          return [];
        }
        return data;
      });
      
      // 创建分析数据映射
      const analyticsMap = new Map();
      if (analyticsData) {
        analyticsData.forEach(item => {
          analyticsMap.set(item.domain_id, item);
        });
      }
      
      // 处理并合并数据
      const processedDomains: Domain[] = listingsResult.data.map(domain => {
        const analytics = analyticsMap.get(domain.id);
        
        return {
          id: domain.id,
          name: domain.name || '',
          price: Number(domain.price) || 0,
          category: domain.category || 'standard',
          description: domain.description || '',
          status: domain.status || 'available',
          highlight: Boolean(domain.highlight),
          owner_id: domain.owner_id || '',
          created_at: domain.created_at || new Date().toISOString(),
          is_verified: Boolean(domain.is_verified),
          verification_status: domain.verification_status || 'pending',
          views: Number(analytics?.views) || 0,
          favorites: Number(analytics?.favorites) || 0,
          offers: Number(analytics?.offers) || 0,
        };
      });
      
      console.log('Processed domains successfully:', processedDomains.length);
      setDomains(processedDomains);
      
    } catch (error: any) {
      console.error('Error loading domains:', error);
      const errorMessage = handleSupabaseError(error);
      setError(errorMessage);
      handleError(new Error(errorMessage));
      setDomains([]);
    } finally {
      setIsLoading(false);
    }
  }, [buildQuery, handleError]);

  // 处理页面变化
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    loadDomains(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [loadDomains]);

  // 处理筛选变化
  useEffect(() => {
    setCurrentPage(1);
    loadDomains(1);
  }, [filter, searchQuery, priceRange, verifiedOnly, loadDomains]);

  useEffect(() => {
    // 从 URL 获取搜索参数
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }

    // 延迟加载以确保组件完全挂载
    const timer = setTimeout(() => {
      loadDomains(1);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    setError(null);
    loadDomains(currentPage);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-white">
      <SafeComponent 
        loading={isLoading && domains.length === 0} 
        error={error}
        fallback={
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            重新加载
          </button>
        }
      >
        <MarketplaceHeader 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          isMobile={isMobile}
        />

        <FilterSection 
          filter={filter} 
          setFilter={setFilter} 
          priceRange={priceRange} 
          setPriceRange={setPriceRange}
          verifiedOnly={verifiedOnly}
          setVerifiedOnly={setVerifiedOnly}
          isMobile={isMobile}
        />

        <section className={`${isMobile ? 'py-6 px-2' : 'py-12'}`}>
          <div className={`${isMobile ? 'px-2' : 'max-w-6xl mx-auto px-4'}`}>
            <DomainListings 
              isLoading={isLoading} 
              domains={domains}
              isMobile={isMobile}
            />
            
            {!isLoading && domains.length === 0 && totalCount === 0 && !error && (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">没有找到匹配的域名</h3>
                <p className="text-muted-foreground">
                  请尝试调整搜索条件或筛选器
                </p>
              </div>
            )}

            {/* 分页组件 */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}

            {/* 统计信息 */}
            {!isLoading && totalCount > 0 && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                共找到 {totalCount} 个域名，当前显示第 {currentPage} 页，共 {totalPages} 页
              </div>
            )}
          </div>
        </section>
      </SafeComponent>
    </div>
  );
};
