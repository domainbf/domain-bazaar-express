
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DomainCard } from '@/components/DomainCard';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { supabase } from '@/integrations/supabase/client';
import { Domain } from '@/types/domain';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const Index = () => {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Load real domains from the database instead of using static data
    loadDomains();
  }, []);

  const loadDomains = async () => {
    setIsLoading(true);
    try {
      // Join domain_listings with domain_analytics to get view counts
      const { data, error } = await supabase
        .from('domain_listings')
        .select(`
          *,
          domain_analytics(views)
        `)
        .eq('status', 'available')
        .limit(9); // Limit to 9 domains for the homepage
      
      if (error) throw error;
      
      // Transform the data to include view count for sorting
      const domainsWithAnalytics = data?.map(domain => {
        const viewsValue = domain.domain_analytics?.length > 0 
          ? domain.domain_analytics[0]?.views || 0
          : 0;
        
        return {
          ...domain,
          views: Number(viewsValue), // Cast to number to fix type error
          domain_analytics: undefined
        };
      }) || [];
      
      // Sort by view count (high to low)
      domainsWithAnalytics.sort((a, b) => (b.views || 0) - (a.views || 0));
      
      console.log('Fetched domains for homepage:', domainsWithAnalytics);
      setDomains(domainsWithAnalytics);
    } catch (error: any) {
      console.error('Error loading domains:', error);
      toast.error(error.message || 'Failed to load domains');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDomains = domains
    .filter(domain => filter === 'all' || domain.category === filter)
    .filter(domain => 
      searchQuery ? domain.name?.toLowerCase().includes(searchQuery.toLowerCase()) : true
    );

  const handleSellDomains = () => {
    if (user) {
      navigate('/user-center?tab=domains');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      {/* Hero Section - Improved mobile readability & fixed contrast issues */}
      <header className="pt-16 pb-20 md:py-24 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 md:mb-8 leading-tight text-white-enhanced">
            Find Your Ideal Domain
          </h1>
          <p className="text-base md:text-xl text-white mb-8 md:mb-12 max-w-3xl mx-auto px-2 font-semibold">
            Premium domains available for purchase or make your offer
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-2">
            <Link to="/marketplace" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 px-6 py-2 md:px-8 md:py-6 text-base md:text-lg font-bold">
                Browse Marketplace
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto border-gray-400 border-2 bg-transparent text-white hover:bg-gray-700 px-6 py-2 md:px-8 md:py-6 text-base md:text-lg font-bold"
              onClick={handleSellDomains}
            >
              Sell Your Domains
            </Button>
          </div>
        </div>
      </header>

      {/* Filter Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-dark-enhanced mb-8 md:mb-10">Featured Domains</h2>
          
          {/* Filter buttons */}
          <div className="overflow-x-auto pb-4 mb-8">
            <div className="flex gap-2 md:gap-3 md:flex-wrap md:justify-center min-w-max px-4">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-gray-900 text-white font-bold' : 'text-gray-900 border-gray-700 border-2 font-bold'}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filter === 'premium' ? 'default' : 'outline'}
                onClick={() => setFilter('premium')}
                className={filter === 'premium' ? 'bg-gray-900 text-white font-bold' : 'text-gray-900 border-gray-700 border-2 font-bold'}
                size="sm"
              >
                Premium
              </Button>
              <Button
                variant={filter === 'short' ? 'default' : 'outline'}
                onClick={() => setFilter('short')}
                className={filter === 'short' ? 'bg-gray-900 text-white font-bold' : 'text-gray-900 border-gray-700 border-2 font-bold'}
                size="sm"
              >
                Short
              </Button>
              <Button
                variant={filter === 'dev' ? 'default' : 'outline'}
                onClick={() => setFilter('dev')}
                className={filter === 'dev' ? 'bg-gray-900 text-white font-bold' : 'text-gray-900 border-gray-700 border-2 font-bold'}
                size="sm"
              >
                Development
              </Button>
            </div>
          </div>

          <div className="max-w-md mx-auto mb-10">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search domains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 md:h-12 pl-12 pr-4 bg-white border-gray-500 focus:border-gray-900 text-gray-900 font-medium"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-700 w-5 h-5" />
            </div>
          </div>

          {/* Domain Cards Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredDomains.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mb-12 md:mb-20 px-2 md:px-0">
              {filteredDomains.map((domain) => (
                <DomainCard 
                  key={domain.id} 
                  domain={domain.name || ''} 
                  price={domain.price || 0}
                  highlight={domain.highlight || false}
                  description={domain.description || ''}
                  category={domain.category || ''}
                  domainId={domain.id || ''}
                  sellerId={domain.owner_id || ''}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200 mb-12">
              <h3 className="text-2xl font-medium text-gray-600 mb-4">No domains found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or add your own domains</p>
              <Button onClick={handleSellDomains} className="bg-gray-900">
                Add Your Domain
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 md:mb-16 text-white-enhanced">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            <div className="bg-gray-800 rounded-xl p-6 md:p-8 text-center">
              <div className="bg-white text-gray-900 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 text-xl md:text-2xl font-bold">1</div>
              <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-white-enhanced">Create an Account</h3>
              <p className="text-white text-sm md:text-base font-semibold">Sign up for free to buy or sell domains</p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 md:p-8 text-center">
              <div className="bg-white text-gray-900 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 text-xl md:text-2xl font-bold">2</div>
              <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-white-enhanced">List or Browse</h3>
              <p className="text-white text-sm md:text-base font-semibold">List your domains or browse marketplace</p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 md:p-8 text-center">
              <div className="bg-white text-gray-900 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 text-xl md:text-2xl font-bold">3</div>
              <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-white-enhanced">Make Deals</h3>
              <p className="text-white text-sm md:text-base font-semibold">Complete transactions securely</p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-dark-enhanced mb-10 md:mb-16">Platform Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="text-center p-4 md:p-6 bg-gray-100 rounded-lg shadow-sm">
              <div className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-3">50,000+</div>
              <div className="text-gray-800 text-sm md:text-base font-semibold">Active Users</div>
            </div>
            <div className="text-center p-4 md:p-6 bg-gray-100 rounded-lg shadow-sm">
              <div className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-3">100+</div>
              <div className="text-gray-800 text-sm md:text-base font-semibold">Countries</div>
            </div>
            <div className="text-center p-4 md:p-6 bg-gray-100 rounded-lg shadow-sm">
              <div className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-3">$100M+</div>
              <div className="text-gray-800 text-sm md:text-base font-semibold">Transaction Volume</div>
            </div>
            <div className="text-center p-4 md:p-6 bg-gray-100 rounded-lg shadow-sm">
              <div className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-3">24/7</div>
              <div className="text-gray-800 text-sm md:text-base font-semibold">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action - Fixed the button contrast issue */}
      <section className="py-16 md:py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-white-enhanced">Ready to Buy or Sell Domains?</h2>
          <p className="text-base md:text-xl text-white mb-8 md:mb-10 font-semibold">
            Join our platform today and start trading domains with ease
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/marketplace" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 px-6 py-2 md:px-6 md:py-3 text-base font-bold">
                Browse Domains
              </Button>
            </Link>
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto border-white border-2 bg-transparent text-white hover:bg-gray-700 px-6 py-2 md:px-6 md:py-3 text-base font-bold"
              >
                Sell Your Domains
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-12 bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
          <p className="text-sm md:text-base font-semibold">© 2024 DomainX Trading Platform. All rights reserved.</p>
        </div>
      </footer>

      <AuthModal open={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

export default Index;
