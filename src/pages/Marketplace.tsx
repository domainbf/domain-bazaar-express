
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navbar } from '@/components/Navbar';
import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader';
import { FilterSection } from '@/components/marketplace/FilterSection';
import { DomainListings } from '@/components/marketplace/DomainListings';
import { Domain } from '@/types/domain';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';

export const Marketplace = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<{min: string, max: string}>({min: '', max: ''});
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  // Optimized load function with useCallback
  const loadDomains = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Loading domains from marketplace...');
      
      // 1. Get domain listings with better error handling
      const { data: listingsData, error: listingsError } = await supabase
        .from('domain_listings')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });
      
      if (listingsError) {
        console.error('Error loading domain listings:', listingsError);
        throw listingsError;
      }
      
      console.log('Loaded domain listings:', listingsData?.length || 0);
      
      if (!listingsData || listingsData.length === 0) {
        console.log('No domains found in database');
        setDomains([]);
        setIsLoading(false);
        return;
      }
      
      // 2. Get analytics data for all domains
      const domainIds = listingsData.map(domain => domain.id);
      
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('domain_analytics')
        .select('*')
        .in('domain_id', domainIds);
      
      if (analyticsError) {
        console.error('Error fetching analytics:', analyticsError);
        // Continue processing even if analytics fetch fails
      }
      
      console.log('Loaded analytics data:', analyticsData?.length || 0);
      
      // 3. Process and merge analytics data with domains
      const domainsWithAnalytics = listingsData.map(domain => {
        // Find analytics for this domain
        const analyticEntry = analyticsData?.find(a => a.domain_id === domain.id);
        
        //  Handle views with proper type checking
        let viewsValue = 0;
        if (analyticEntry?.views) {
          if (typeof analyticEntry.views === 'number') {
            viewsValue = analyticEntry.views;
          } else {
            try {
              viewsValue = parseInt(String(analyticEntry.views), 10) || 0;
            } catch {
              viewsValue = 0;
            }
          }
        }
        
        // Convert to Domain type with proper structure
        const processedDomain: Domain = {
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
        
        return processedDomain;
      });
      
      // Sort by views (high to low), then by creation date
      domainsWithAnalytics.sort((a, b) => {
        const viewsDiff = (b.views || 0) - (a.views || 0);
        if (viewsDiff !== 0) return viewsDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      console.log('Processed domains:', domainsWithAnalytics.length);
      setDomains(domainsWithAnalytics);
      
    } catch (error: any) {
      console.error('Error loading domains:', error);
      toast.error('加载域名列表失败，请刷新页面重试');
      setDomains([]);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // Get search param from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }

    loadDomains();
  }, [loadDomains]);

  // Use memoized filtering for better performance
  const filteredDomains = useMemo(() => {
    let result = [...domains];
    
    // Apply category filter
    if (filter !== 'all') {
      result = result.filter(domain => domain.category === filter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(domain => 
        (domain.name && domain.name.toLowerCase().includes(query)) || 
        (domain.description && domain.description.toLowerCase().includes(query))
      );
    }
    
    // Apply price range filters
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
    
    // Apply verification filter
    if (verifiedOnly) {
      result = result.filter(domain => domain.is_verified);
    }
    
    return result;
  }, [domains, filter, searchQuery, priceRange, verifiedOnly]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
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
            domains={filteredDomains}
            isMobile={isMobile}
          />
          
          {!isLoading && filteredDomains.length === 0 && domains.length === 0 && (
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
          
          {!isLoading && filteredDomains.length === 0 && domains.length > 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">没有找到匹配的域名</h3>
              <p className="text-muted-foreground">
                请尝试调整搜索条件或筛选器
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
