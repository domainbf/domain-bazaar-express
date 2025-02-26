
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DomainCard } from '@/components/DomainCard';
import { Button } from '@/components/ui/button';
import { 
  Diamond, 
  Globe2, 
  Sparkles, 
  GemIcon, 
  ShieldCheck, 
  Rocket,
  Crown,
  Star
} from 'lucide-react';
import { useTheme } from 'next-themes';

const availableDomains = [
  { name: "nic.bn", price: "50,000", category: "premium", highlight: true },
  { name: "X.RW", price: "25,000", category: "short", highlight: true },
  { name: "F.AF", price: "30,000", category: "short", highlight: true },
  { name: "L.KE", price: "28,000", category: "short" },
  { name: "Y.CR", price: "32,000", category: "short" },
  { name: "CXL.NET", price: "15,000", category: "premium", highlight: true },
  { name: "Top.vg", price: "12,000", category: "premium" },
  { name: "Dev.ug", price: "8,000", category: "dev", highlight: true },
  { name: "BUG.KZ", price: "10,000", category: "dev" }
];

const Index = () => {
  const [filter, setFilter] = useState('all');
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
      
      {/* Hero Section with Animated Elements */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 animate-float">
            <Diamond className="w-8 h-8 text-violet-400/60" />
          </div>
          <div className="absolute top-40 right-1/3 animate-float delay-300">
            <Crown className="w-6 h-6 text-amber-400/60" />
          </div>
          <div className="absolute bottom-20 left-1/3 animate-float delay-500">
            <Star className="w-5 h-5 text-cyan-400/60" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 animate-glow">
            {t('title')}
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed">
            {t('subtitle')}
          </p>
          
          {/* Value Proposition Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="glass-card p-6 rounded-xl backdrop-blur-md border border-white/10">
              <GemIcon className="w-10 h-10 text-violet-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-violet-200">独特价值</h3>
              <p className="text-gray-400">每个域名都是独一无二的数字资产</p>
            </div>
            <div className="glass-card p-6 rounded-xl backdrop-blur-md border border-white/10">
              <ShieldCheck className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-cyan-200">安全保障</h3>
              <p className="text-gray-400">规范的交易流程，确保您的投资安全</p>
            </div>
            <div className="glass-card p-6 rounded-xl backdrop-blur-md border border-white/10">
              <Rocket className="w-10 h-10 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-amber-200">增值潜力</h3>
              <p className="text-gray-400">优质域名具备巨大的升值空间</p>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Buttons */}
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="flex flex-wrap justify-center gap-4">
          {['all', 'premium', 'short', 'dev'].map((category) => (
            <Button
              key={category}
              onClick={() => setFilter(category)}
              variant={filter === category ? 'default' : 'secondary'}
              className={`rounded-full backdrop-blur-md transition-all duration-300 ${
                filter === category 
                  ? 'bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600' 
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {t(category)}
            </Button>
          ))}
        </div>
      </div>

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

      {/* Features Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="glass-card p-8 rounded-2xl text-center transform hover:scale-105 transition-all duration-300">
              <Globe2 className="w-10 h-10 text-violet-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-violet-200">全球可达</h3>
              <p className="text-gray-400">覆盖全球的域名交易网络，随时随地交易</p>
            </div>
            
            <div className="glass-card p-8 rounded-2xl text-center transform hover:scale-105 transition-all duration-300">
              <Sparkles className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-cyan-200">优质精选</h3>
              <p className="text-gray-400">严选优质域名，确保投资价值</p>
            </div>
            
            <div className="glass-card p-8 rounded-2xl text-center transform hover:scale-105 transition-all duration-300">
              <Crown className="w-10 h-10 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-amber-200">尊享服务</h3>
              <p className="text-gray-400">专业的域名顾问团队，全程贴心服务</p>
            </div>
            
            <div className="glass-card p-8 rounded-2xl text-center transform hover:scale-105 transition-all duration-300">
              <Diamond className="w-10 h-10 text-rose-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-rose-200">增值保障</h3>
              <p className="text-gray-400">持续的价值评估，助力资产增值</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
