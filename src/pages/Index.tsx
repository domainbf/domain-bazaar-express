
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section - Made more spacious and darker */}
      <header className="py-24 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-6 md:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
            Find Your Ideal Domain
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Premium domains available for purchase or make your offer
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/marketplace" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 px-8 py-6 text-lg">
                Browse Marketplace
              </Button>
            </Link>
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto border-gray-500 text-white hover:bg-gray-800 px-8 py-6 text-lg">
                Sell Your Domains
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Filter Section - More space and improved responsiveness */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">Featured Domains</h2>
          
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-700 border-gray-300'}
            >
              All
            </Button>
            <Button
              variant={filter === 'premium' ? 'default' : 'outline'}
              onClick={() => setFilter('premium')}
              className={filter === 'premium' ? 'bg-gray-900 text-white' : 'text-gray-700 border-gray-300'}
            >
              Premium Domains
            </Button>
            <Button
              variant={filter === 'short' ? 'default' : 'outline'}
              onClick={() => setFilter('short')}
              className={filter === 'short' ? 'bg-gray-900 text-white' : 'text-gray-700 border-gray-300'}
            >
              Short Domains
            </Button>
            <Button
              variant={filter === 'dev' ? 'default' : 'outline'}
              onClick={() => setFilter('dev')}
              className={filter === 'dev' ? 'bg-gray-900 text-white' : 'text-gray-700 border-gray-300'}
            >
              Development Domains
            </Button>
          </div>

          <div className="max-w-md mx-auto mb-12">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search domains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white border-gray-300 focus:border-gray-900"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {/* Domain Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
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
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-gray-800 rounded-xl p-8 text-center">
              <div className="bg-white text-gray-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-4">Create an Account</h3>
              <p className="text-gray-300">Sign up for free to buy or sell domains on our platform</p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-8 text-center">
              <div className="bg-white text-gray-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-4">List or Browse</h3>
              <p className="text-gray-300">List your domains for sale or browse our marketplace</p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-8 text-center">
              <div className="bg-white text-gray-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-4">Make Deals</h3>
              <p className="text-gray-300">Make or receive offers and complete transactions securely</p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">Platform Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl font-bold text-gray-900 mb-3">50,000+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl font-bold text-gray-900 mb-3">100+</div>
              <div className="text-gray-600">Countries</div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl font-bold text-gray-900 mb-3">$100M+</div>
              <div className="text-gray-600">Transaction Volume</div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl font-bold text-gray-900 mb-3">24/7</div>
              <div className="text-gray-600">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action - Darker background for emphasis */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 md:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8">Ready to Buy or Sell Domains?</h2>
          <p className="text-xl text-gray-300 mb-10">
            Join our platform today and start trading domains with ease
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/marketplace" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 px-6 py-3">
                Browse Domains
              </Button>
            </Link>
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto border-gray-500 text-white hover:bg-gray-800 px-6 py-3">
                Sell Domains
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-black text-white">
        <div className="max-w-6xl mx-auto px-6 md:px-8 text-center">
          <p>© 2024 DomainX Trading Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
