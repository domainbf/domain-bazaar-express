
import { useState } from 'react';
import { DomainCard } from '@/components/DomainCard';
import { HeroSection } from '@/components/sections/HeroSection';
import { FilterSection } from '@/components/sections/FilterSection';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { StatsSection } from '@/components/sections/StatsSection';
import { PremiumShowcase } from '@/components/sections/PremiumShowcase';
import { TrendingDomains } from '@/components/sections/TrendingDomains';
import { ContactSection } from '@/components/sections/ContactSection';
import { availableDomains } from '@/data/availableDomains';

const Index = () => {
  const [filter, setFilter] = useState('all');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10" />
      </div>
      
      <HeroSection />
      
      <StatsSection />
      
      <TrendingDomains />
      
      <PremiumShowcase />
      
      <FilterSection 
        currentFilter={filter}
        onFilterChange={setFilter}
      />

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
      
      <ContactSection />
    </div>
  );
};

export default Index;
