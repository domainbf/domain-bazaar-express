
import { useState } from 'react';
import { DomainCard } from '@/components/DomainCard';
import { HeroSection } from '@/components/sections/HeroSection';
import { FilterSection } from '@/components/sections/FilterSection';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { availableDomains } from '@/data/availableDomains';

const Index = () => {
  const [filter, setFilter] = useState('all');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
      
      <HeroSection />
      
      <FilterSection 
        currentFilter={filter}
        onFilterChange={setFilter}
      />

      {/* Domain Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 mb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableDomains
            .filter(domain => filter === 'all' || domain.category === filter)
            .map((domain) => (
              <DomainCard 
                key={domain.name} 
                domain={domain.name} 
                price={domain.price}
                highlight={domain.highlight}
              />
            ))}
        </div>
      </div>

      <FeaturesSection />
    </div>
  );
};

export default Index;
