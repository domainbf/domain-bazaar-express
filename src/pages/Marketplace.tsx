
import { useState, useEffect } from 'react';
import { DomainCard } from '@/components/DomainCard';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navbar } from '@/components/Navbar';

interface Domain {
  id: string;
  name: string;
  price: number;  // Changed from string to number to match Supabase
  category: string;
  highlight: boolean;
  status: string;
  description?: string;
  owner_id: string;
}

export const Marketplace = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<{min: string, max: string}>({min: '', max: ''});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('domain_listings')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDomains(data as Domain[] || []);
    } catch (error: any) {
      console.error('Error loading domains:', error);
      toast.error(error.message || 'Failed to load domains');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filteredDomains = domains;
    
    // Apply category filter
    if (filter !== 'all') {
      filteredDomains = filteredDomains.filter(domain => domain.category === filter);
    }
    
    // Apply search query
    if (searchQuery) {
      filteredDomains = filteredDomains.filter(domain => 
        domain.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (domain.description && domain.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply price range
    if (priceRange.min) {
      filteredDomains = filteredDomains.filter(domain => 
        domain.price >= parseFloat(priceRange.min)
      );
    }
    
    if (priceRange.max) {
      filteredDomains = filteredDomains.filter(domain => 
        domain.price <= parseFloat(priceRange.max)
      );
    }
    
    return filteredDomains;
  };

  const filteredDomains = applyFilters();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <header className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-6">
            Discover Your Perfect Domain
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Browse our marketplace of premium domains owned by our community
          </p>
          
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search domains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white border-gray-300 focus:border-black"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>
        </div>
      </header>

      {/* Filter Section */}
      <section className="py-8 border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-black text-white' : 'text-gray-700 border-gray-300'}
              >
                All
              </Button>
              <Button
                variant={filter === 'premium' ? 'default' : 'outline'}
                onClick={() => setFilter('premium')}
                className={filter === 'premium' ? 'bg-black text-white' : 'text-gray-700 border-gray-300'}
              >
                Premium
              </Button>
              <Button
                variant={filter === 'short' ? 'default' : 'outline'}
                onClick={() => setFilter('short')}
                className={filter === 'short' ? 'bg-black text-white' : 'text-gray-700 border-gray-300'}
              >
                Short
              </Button>
              <Button
                variant={filter === 'dev' ? 'default' : 'outline'}
                onClick={() => setFilter('dev')}
                className={filter === 'dev' ? 'bg-black text-white' : 'text-gray-700 border-gray-300'}
              >
                Development
              </Button>
              <Button
                variant={filter === 'brandable' ? 'default' : 'outline'}
                onClick={() => setFilter('brandable')}
                className={filter === 'brandable' ? 'bg-black text-white' : 'text-gray-700 border-gray-300'}
              >
                Brandable
              </Button>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="text-gray-700 border-gray-300"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
          
          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Min Price ($)</label>
                  <Input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                    className="w-32 bg-white border-gray-300"
                    placeholder="Min"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Max Price ($)</label>
                  <Input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                    className="w-32 bg-white border-gray-300"
                    placeholder="Max"
                    min="0"
                  />
                </div>
                <Button
                  onClick={() => setPriceRange({min: '', max: ''})}
                  variant="outline"
                  className="text-gray-700 border-gray-300"
                >
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Domain Listings */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredDomains.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-2xl font-medium text-gray-600 mb-4">No domains found</h3>
              <p className="text-gray-500">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDomains.map((domain) => (
                <DomainCard
                  key={domain.id}
                  domain={domain.name}
                  price={domain.price}
                  highlight={domain.highlight}
                  domainId={domain.id}
                  sellerId={domain.owner_id}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
