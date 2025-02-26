
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
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDomains = availableDomains
    .filter(domain => filter === 'all' || domain.category === filter)
    .filter(domain => 
      searchQuery ? domain.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10" />
      </div>
      
      {/* 简化的 Hero 部分，集成搜索功能 */}
      <div className="relative z-10 pt-12 pb-8 md:pt-20 md:pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-400 mb-4">
              找到您的理想域名
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
              快速搜索、即刻注册
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Input
                type="text"
                placeholder="搜索域名..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white/5 border-violet-500/20 focus:border-violet-500/40"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 主要过滤和域名展示区域 */}
      <div className="relative z-10 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <FilterSection 
            currentFilter={filter}
            onFilterChange={setFilter}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
      </div>

      {/* 热门域名区域 */}
      <TrendingDomains />
      
      {/* 精选域名展示 */}
      <PremiumShowcase />
      
      {/* 平台数据统计 */}
      <StatsSection />
      
      {/* 功能特点介绍 */}
      <FeaturesSection />
      
      {/* 联系方式 */}
      <ContactSection />
    </div>
  );
};

export default Index;
