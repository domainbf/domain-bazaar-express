import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navbar } from '@/components/Navbar';
import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader';
import { FilterSection } from '@/components/marketplace/FilterSection';
import { DomainListings } from '@/components/marketplace/DomainListings';
import { Domain } from '@/types/domain';
import { availableDomains } from '@/data/availableDomains'; // Import sample data as fallback

export const Marketplace = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<{min: string, max: string}>({min: '', max: ''});
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    // Extract search param from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }

    loadDomains();
  }, []);

  const loadDomains = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('domain_listings')
        .select('*')
        .eq('status', 'available');
      
      // Commented out the verification filter to show all domains
      // query = query.eq('verification_status', 'verified');
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log('Fetched domains:', data);
      
      if (data && data.length > 0) {
        setDomains(data);
      } else {
        // If no domains found in Supabase, use sample data as fallback
        setDomains(availableDomains.map(domain => ({
          id: domain.name,
          name: domain.name,
          price: typeof domain.price === 'string' ? parseFloat(domain.price.replace(/,/g, '')) : domain.price,
          category: domain.category,
          highlight: domain.highlight,
          description: domain.description || 'Premium domain name for your business.',
          status: 'available',
          is_verified: true,
          verification_status: 'verified'
        })));
        console.log('Using sample domains as fallback');
      }
    } catch (error: any) {
      console.error('Error loading domains:', error);
      toast.error(error.message || 'Failed to load domains');
      
      // Fallback to sample data if there's an error
      setDomains(availableDomains.map(domain => ({
        id: domain.name,
        name: domain.name,
        price: typeof domain.price === 'string' ? parseFloat(domain.price.replace(/,/g, '')) : domain.price,
        category: domain.category,
        highlight: domain.highlight,
        description: domain.description || 'Premium domain name for your business.',
        status: 'available',
        is_verified: true,
        verification_status: 'verified'
      })));
    } finally {
      setIsLoading(false);
    }
  };

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
      />

      <FilterSection 
        filter={filter} 
        setFilter={setFilter} 
        priceRange={priceRange} 
        setPriceRange={setPriceRange}
        verifiedOnly={verifiedOnly}
        setVerifiedOnly={setVerifiedOnly}
      />

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <DomainListings 
            isLoading={isLoading} 
            domains={filteredDomains} 
          />
        </div>
      </section>
    </div>
  );
};
