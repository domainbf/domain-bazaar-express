import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navbar } from '@/components/Navbar';
import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader';
import { FilterSection } from '@/components/marketplace/FilterSection';
import { DomainListings } from '@/components/marketplace/DomainListings';
import { AdvancedFilters, AdvancedFiltersState } from '@/components/marketplace/AdvancedFilters';
import { Domain } from '@/types/domain';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { SkeletonCardGrid } from '@/components/common/SkeletonCard';
import { SoldDomains } from '@/components/sections/SoldDomains';
import { useNotifications } from '@/hooks/useNotifications';

// 获取域名不含后缀的名称
const getDomainNameWithoutExtension = (domain: string): string => {
  const lastDot = domain.lastIndexOf('.');
  if (lastDot === -1) return domain;
  return domain.substring(0, lastDot);
};

// 获取域名后缀
const getDomainExtension = (domain: string): string => {
  const match = domain.match(/(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?$/);
  return match ? match[0].toLowerCase() : '';
};

export const Marketplace = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<{min: string, max: string}>({min: '', max: ''});
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({
    priceMin: '',
    priceMax: '',
    lengthMin: '',
    lengthMax: '',
    extensions: [],
    verifiedOnly: false,
    category: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const { unreadCount } = useNotifications();

  // 计算活跃的高级筛选数量
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.priceMin) count++;
    if (advancedFilters.priceMax) count++;
    if (advancedFilters.lengthMin) count++;
    if (advancedFilters.lengthMax) count++;
    if (advancedFilters.extensions.length > 0) count++;
    if (advancedFilters.verifiedOnly) count++;
    if (advancedFilters.category !== 'all') count++;
    return count;
  }, [advancedFilters]);

  // 优化的加载函数
  const loadDomains = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading domains from marketplace...');
      
      // 首先获取域名列表
      const { data: listingsData, error: listingsError } = await supabase
        .from('domain_listings')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(100); // 限制数量以提高性能
      
      if (listingsError) {
        console.error('Error loading domain listings:', listingsError);
        throw new Error(`加载域名列表失败: ${listingsError.message}`);
      }
      
      console.log('Loaded domain listings:', listingsData?.length || 0);
      
      if (!listingsData || listingsData.length === 0) {
        console.log('No domains found in database');
        setDomains([]);
        return;
      }
      
      // 获取所有域名的分析数据（批量查询）
      const domainIds = listingsData.map(domain => domain.id);
      
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('domain_analytics')
        .select('domain_id, views, favorites, offers')
        .in('domain_id', domainIds);
      
      if (analyticsError) {
        console.error('Error fetching analytics:', analyticsError);
        // 继续处理，即使分析数据获取失败
      }
      
      console.log('Loaded analytics data:', analyticsData?.length || 0);
      
      // 创建分析数据映射
      const analyticsMap = new Map();
      if (analyticsData) {
        analyticsData.forEach(item => {
          analyticsMap.set(item.domain_id, item);
        });
      }
      
      // 处理并合并数据
      const processedDomains: Domain[] = listingsData.map(domain => {
        const analytics = analyticsMap.get(domain.id);
        
        // 安全地解析浏览量
        let viewsValue = 0;
        if (analytics?.views) {
          if (typeof analytics.views === 'number') {
            viewsValue = analytics.views;
          } else {
            try {
              viewsValue = parseInt(String(analytics.views), 10) || 0;
            } catch {
              viewsValue = 0;
            }
          }
        }
        
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
          views: viewsValue
        };
      });
      
      // 排序：优先显示已验证的域名，然后按浏览量，最后按创建时间
      processedDomains.sort((a, b) => {
        // 首先按验证状态排序
        if (a.is_verified !== b.is_verified) {
          return b.is_verified ? 1 : -1;
        }
        
        // 然后按浏览量排序
        const viewsDiff = (b.views || 0) - (a.views || 0);
        if (viewsDiff !== 0) return viewsDiff;
        
        // 最后按创建时间排序
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      console.log('Processed domains successfully:', processedDomains.length);
      setDomains(processedDomains);
      
    } catch (error: any) {
      console.error('Error loading domains:', error);
      const errorMessage = error.message || '加载域名列表失败，请刷新页面重试';
      setError(errorMessage);
      toast.error(errorMessage);
      setDomains([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 从 URL 获取搜索参数
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }

    // 延迟加载以确保组件完全挂载
    const timer = setTimeout(() => {
      loadDomains();
    }, 100);

    return () => clearTimeout(timer);
  }, [loadDomains]);

  // 订阅公开可用域名的实时变化（新增/更新/删除）
  useEffect(() => {
    const channel = supabase
      .channel('domain_listings_public')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'domain_listings'
        },
        () => {
          loadDomains();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadDomains]);

  // 使用 memoized 过滤以提高性能
  const filteredDomains = useMemo(() => {
    let result = [...domains];
    
    // 应用分类过滤（基础筛选）
    if (filter !== 'all') {
      result = result.filter(domain => domain.category === filter);
    }
    
    // 应用搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(domain => 
        (domain.name && domain.name.toLowerCase().includes(query)) || 
        (domain.description && domain.description.toLowerCase().includes(query))
      );
    }
    
    // 应用基础价格范围过滤
    if (priceRange.min) {
      const minPrice = parseFloat(priceRange.min);
      if (!isNaN(minPrice)) {
        result = result.filter(domain => domain.price >= minPrice);
      }
    }
    
    if (priceRange.max) {
      const maxPrice = parseFloat(priceRange.max);
      if (!isNaN(maxPrice)) {
        result = result.filter(domain => domain.price <= maxPrice);
      }
    }
    
    // 应用基础验证过滤
    if (verifiedOnly) {
      result = result.filter(domain => domain.is_verified);
    }

    // ========== 高级筛选 ==========
    
    // 高级价格范围
    if (advancedFilters.priceMin) {
      const minPrice = parseFloat(advancedFilters.priceMin);
      if (!isNaN(minPrice)) {
        result = result.filter(domain => domain.price >= minPrice);
      }
    }
    if (advancedFilters.priceMax) {
      const maxPrice = parseFloat(advancedFilters.priceMax);
      if (!isNaN(maxPrice)) {
        result = result.filter(domain => domain.price <= maxPrice);
      }
    }

    // 域名长度筛选
    if (advancedFilters.lengthMin) {
      const minLen = parseInt(advancedFilters.lengthMin);
      if (!isNaN(minLen)) {
        result = result.filter(domain => {
          const nameWithoutExt = getDomainNameWithoutExtension(domain.name);
          return nameWithoutExt.length >= minLen;
        });
      }
    }
    if (advancedFilters.lengthMax) {
      const maxLen = parseInt(advancedFilters.lengthMax);
      if (!isNaN(maxLen)) {
        result = result.filter(domain => {
          const nameWithoutExt = getDomainNameWithoutExtension(domain.name);
          return nameWithoutExt.length <= maxLen;
        });
      }
    }

    // 后缀筛选
    if (advancedFilters.extensions.length > 0) {
      result = result.filter(domain => {
        const ext = getDomainExtension(domain.name);
        return advancedFilters.extensions.some(e => ext.endsWith(e.toLowerCase()));
      });
    }

    // 高级分类筛选
    if (advancedFilters.category !== 'all') {
      result = result.filter(domain => domain.category === advancedFilters.category);
    }

    // 高级验证筛选
    if (advancedFilters.verifiedOnly) {
      result = result.filter(domain => domain.is_verified);
    }

    // 排序
    result.sort((a, b) => {
      const order = advancedFilters.sortOrder === 'asc' ? 1 : -1;
      
      switch (advancedFilters.sortBy) {
        case 'price':
          return (a.price - b.price) * order;
        case 'name':
          return a.name.localeCompare(b.name) * order;
        case 'views':
          return ((a.views || 0) - (b.views || 0)) * order;
        case 'created_at':
        default:
          return (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) * order;
      }
    });
    
    return result;
  }, [domains, filter, searchQuery, priceRange, verifiedOnly, advancedFilters]);

  const handleRetry = () => {
    setError(null);
    loadDomains();
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar unreadCount={unreadCount} />
      
      <div className={isMobile ? 'pb-20' : ''}>
        <MarketplaceHeader 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          isMobile={isMobile}
        />

        <div className="flex items-center justify-between mb-4">
          <FilterSection 
            filter={filter} 
            setFilter={setFilter} 
            priceRange={priceRange} 
            setPriceRange={setPriceRange}
            verifiedOnly={verifiedOnly}
            setVerifiedOnly={setVerifiedOnly}
            isMobile={isMobile}
          />
          <div className={`${isMobile ? 'px-2' : 'max-w-6xl mx-auto px-4'}`}>
            <AdvancedFilters
              filters={advancedFilters}
              onFiltersChange={setAdvancedFilters}
              activeFiltersCount={activeFiltersCount}
              isMobile={isMobile}
            />
          </div>
        </div>

        <section className={`${isMobile ? 'py-6 px-2' : 'py-12'}`}>
          <div className={`${isMobile ? 'px-2' : 'max-w-6xl mx-auto px-4'}`}>
            {error ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">
                  <h3 className="text-lg font-semibold mb-2">加载失败</h3>
                  <p>{error}</p>
                </div>
                <button 
                  onClick={handleRetry}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                  重新加载
                </button>
              </div>
            ) : isLoading ? (
              <SkeletonCardGrid count={isMobile ? 6 : 9} />
            ) : (
              <>
                <DomainListings 
                  isLoading={isLoading} 
                  domains={filteredDomains}
                  isMobile={isMobile}
                />
                
                {!isLoading && filteredDomains.length === 0 && domains.length === 0 && !error && (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-semibold mb-2">暂无域名列表</h3>
                    <p className="text-muted-foreground mb-4">
                      看起来还没有域名添加到市场中
                    </p>
                    <button 
                      onClick={loadDomains}
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                    >
                      重新加载
                    </button>
                  </div>
                )}
                
                {!isLoading && filteredDomains.length === 0 && domains.length > 0 && !error && (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-semibold mb-2">没有找到匹配的域名</h3>
                    <p className="text-muted-foreground">
                      请尝试调整搜索条件或筛选器
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <SoldDomains />
      </div>

      {isMobile && <BottomNavigation unreadCount={unreadCount} />}
    </div>
  );
};
