
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DomainCard } from '@/components/DomainCard';
import { availableDomains } from '@/data/availableDomains';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';

const Index = () => {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDomains = availableDomains
    .filter(domain => filter === 'all' || domain.category === filter)
    .filter(domain => 
      searchQuery ? domain.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
    );

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      {/* Hero Section - Improved spacing and mobile responsiveness */}
      <header className="pt-16 pb-20 md:py-24 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 md:mb-8 leading-tight">
            Find Your Ideal Domain
          </h1>
          <p className="text-base md:text-xl text-gray-300 mb-8 md:mb-12 max-w-3xl mx-auto px-2">
            Premium domains available for purchase or make your offer
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-2">
            <Link to="/marketplace" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 px-6 py-2 md:px-8 md:py-6 text-base md:text-lg">
                Browse Marketplace
              </Button>
            </Link>
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto border-gray-500 text-white hover:bg-gray-800 px-6 py-2 md:px-8 md:py-6 text-base md:text-lg">
                Sell Your Domains
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Filter Section - Better responsive layout */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8 md:mb-10">Featured Domains</h2>
          
          {/* Filter buttons with scroll on mobile */}
          <div className="overflow-x-auto pb-4 mb-8">
            <div className="flex gap-2 md:gap-3 md:flex-wrap md:justify-center min-w-max px-4">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-700 border-gray-300'}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filter === 'premium' ? 'default' : 'outline'}
                onClick={() => setFilter('premium')}
                className={filter === 'premium' ? 'bg-gray-900 text-white' : 'text-gray-700 border-gray-300'}
                size="sm"
              >
                Premium
              </Button>
              <Button
                variant={filter === 'short' ? 'default' : 'outline'}
                onClick={() => setFilter('short')}
                className={filter === 'short' ? 'bg-gray-900 text-white' : 'text-gray-700 border-gray-300'}
                size="sm"
              >
                Short
              </Button>
              <Button
                variant={filter === 'dev' ? 'default' : 'outline'}
                onClick={() => setFilter('dev')}
                className={filter === 'dev' ? 'bg-gray-900 text-white' : 'text-gray-700 border-gray-300'}
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
                className="w-full h-10 md:h-12 pl-12 pr-4 bg-white border-gray-300 focus:border-gray-900"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {/* Domain Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mb-12 md:mb-20 px-2 md:px-0">
            {filteredDomains.map((domain) => (
              <DomainCard 
                key={domain.name} 
                domain={domain.name} 
                price={domain.price}
                highlight={domain.highlight}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Darker background for more emphasis */}
      <section className="py-16 md:py-20 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 md:mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            <div className="bg-gray-800 rounded-xl p-6 md:p-8 text-center">
              <div className="bg-white text-gray-900 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 text-xl md:text-2xl font-bold">1</div>
              <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Create an Account</h3>
              <p className="text-gray-300 text-sm md:text-base">Sign up for free to buy or sell domains</p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 md:p-8 text-center">
              <div className="bg-white text-gray-900 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 text-xl md:text-2xl font-bold">2</div>
              <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">List or Browse</h3>
              <p className="text-gray-300 text-sm md:text-base">List your domains or browse marketplace</p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 md:p-8 text-center">
              <div className="bg-white text-gray-900 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 text-xl md:text-2xl font-bold">3</div>
              <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Make Deals</h3>
              <p className="text-gray-300 text-sm md:text-base">Complete transactions securely</p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10 md:mb-16">Platform Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="text-center p-4 md:p-6 bg-gray-50 rounded-lg">
              <div className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-3">50,000+</div>
              <div className="text-gray-600 text-sm md:text-base">Active Users</div>
            </div>
            <div className="text-center p-4 md:p-6 bg-gray-50 rounded-lg">
              <div className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-3">100+</div>
              <div className="text-gray-600 text-sm md:text-base">Countries</div>
            </div>
            <div className="text-center p-4 md:p-6 bg-gray-50 rounded-lg">
              <div className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-3">$100M+</div>
              <div className="text-gray-600 text-sm md:text-base">Transaction Volume</div>
            </div>
            <div className="text-center p-4 md:p-6 bg-gray-50 rounded-lg">
              <div className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-3">24/7</div>
              <div className="text-gray-600 text-sm md:text-base">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action - Darker background for emphasis */}
      <section className="py-16 md:py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Ready to Buy or Sell Domains?</h2>
          <p className="text-base md:text-xl text-gray-300 mb-8 md:mb-10">
            Join our platform today and start trading domains with ease
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/marketplace" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 px-6 py-2 md:px-6 md:py-3 text-base">
                Browse Domains
              </Button>
            </Link>
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto border-gray-500 text-white hover:bg-gray-800 px-6 py-2 md:px-6 md:py-3 text-base">
                Sell Domains
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-12 bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
          <p className="text-sm md:text-base">© 2024 DomainX Trading Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
