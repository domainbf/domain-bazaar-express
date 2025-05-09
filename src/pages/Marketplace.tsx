
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
      // 1. Get domain listings
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
      
      // 3. Merge analytics data with domains
      const domainsWithAnalytics = listingsData.map(domain => {
        // Find analytics for this domain
        const analyticEntry = analyticsData?.find(a => a.domain_id === domain.id);
        
        // Safely handle views with proper type checking
        let viewsValue = 0;
        if (analyticEntry) {
          const rawViews = analyticEntry.views;
          
          if (typeof rawViews === 'number') {
            viewsValue = rawViews;
          } else if (rawViews !== null && rawViews !== undefined) {
            try {
              viewsValue = parseInt(String(rawViews), 10) || 0;
            } catch {
              viewsValue = 0;
            }
          }
        }
        
        return {
          ...domain,
          views: viewsValue,
        };
      });
      
      // Sort by views (high to low)
      domainsWithAnalytics.sort((a, b) => (b.views || 0) - (a.views || 0));
      
      setDomains(domainsWithAnalytics);
    } catch (error: any) {
      console.error('Error loading domains:', error);
      toast.error(t('marketplace.loadError', 'Failed to load domains'));
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
      const query = searchQuery.toLowerCase();
      result = result.filter(domain => 
        (domain.name && domain.name.toLowerCase().includes(query)) || 
        (domain.description && domain.description.toLowerCase().includes(query))
      );
    }
    
    // Apply price range filters
    if (priceRange.min) {
      const minPrice = parseFloat(priceRange.min);
      result = result.filter(domain => domain.price && domain.price >= minPrice);
    }
    
    if (priceRange.max) {
      const maxPrice = parseFloat(priceRange.max);
      result = result.filter(domain => domain.price && domain.price <= maxPrice);
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
        </div>
      </section>
    </div>
  );
};
