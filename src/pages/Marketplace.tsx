
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navbar } from '@/components/Navbar';
import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader';
import { FilterSection } from '@/components/marketplace/FilterSection';
import { DomainListings } from '@/components/marketplace/DomainListings';
import { Domain } from '@/types/domain';
import { useIsMobile } from '@/hooks/use-mobile';

export const Marketplace = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<{min: string, max: string}>({min: '', max: ''});
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const isMobile = useIsMobile();

  // 使用useCallback优化加载函数避免多次重新创建
  const loadDomains = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. 获取域名列表
      const { data: listingsData, error: listingsError } = await supabase
        .from('domain_listings')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });
      
      if (listingsError) throw listingsError;
      
      if (!listingsData || listingsData.length === 0) {
        setDomains([]);
        setIsLoading(false);
        return;
      }
      
      // 2. 单独获取所有域名分析数据
      const domainIds = listingsData.map(domain => domain.id);
      
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('domain_analytics')
        .select('*')
        .in('domain_id', domainIds);
      
      if (analyticsError) {
        console.error('Error fetching analytics:', analyticsError);
        // 即使分析数据获取失败，仍然处理域名列表
      }
      
      // 3. 手动将analytics数据合并到domains
      const domainsWithAnalytics = listingsData.map(domain => {
        // 查找这个域名的所有分析数据
        const domainAnalytics = analyticsData?.filter(a => a.domain_id === domain.id) || [];
        const analyticEntry = domainAnalytics.length > 0 ? domainAnalytics[0] : null;
        
        return {
          ...domain,
          views: analyticEntry ? Number(analyticEntry.views || 0) : 0,
          domain_analytics: domainAnalytics.map(a => ({
            views: Number(a.views || 0),
            id: a.id
          }))
        };
      });
      
      // 按查看次数排序（高到低）
      domainsWithAnalytics.sort((a, b) => (b.views || 0) - (a.views || 0));
      
      setDomains(domainsWithAnalytics);
    } catch (error: any) {
      console.error('Error loading domains:', error);
      toast.error(error.message || '加载域名失败');
      setDomains([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Extract search param from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }

    loadDomains();
  }, [loadDomains]);

  const applyFilters = () => {
    let filteredDomains = domains;
    
    if (filter !== 'all') {
      filteredDomains = filteredDomains.filter(domain => domain.category === filter);
    }
    
    if (searchQuery) {
      filteredDomains = filteredDomains.filter(domain => 
        domain.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (domain.description && domain.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (priceRange.min) {
      filteredDomains = filteredDomains.filter(domain => 
        domain.price && domain.price >= parseFloat(priceRange.min)
      );
    }
    
    if (priceRange.max) {
      filteredDomains = filteredDomains.filter(domain => 
        domain.price && domain.price <= parseFloat(priceRange.max)
      );
    }
    
    if (verifiedOnly) {
      filteredDomains = filteredDomains.filter(domain => domain.is_verified);
    }
    
    return filteredDomains;
  };

  const filteredDomains = applyFilters();

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

      <section className={`py-6 ${isMobile ? 'px-2' : 'py-12'}`}>
        <div className={`${isMobile ? 'px-2' : 'max-w-6xl mx-auto px-4'}`}>
          <DomainListings 
            isLoading={isLoading} 
            domains={filteredDomains}
            isMobile={isMobile}
          />
        </div>
      </section>
    </div>
  );
};
