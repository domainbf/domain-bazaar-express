import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DomainCard } from '@/components/DomainCard';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Languages, Sparkles, CreditCard, Shield, Globe2, MessageSquare, CheckCircle2 } from 'lucide-react';
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
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="fixed top-0 right-0 p-4 z-50 flex gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-full bg-white/10 backdrop-blur-lg hover:bg-white/20"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLanguage}
          className="rounded-full bg-white/10 backdrop-blur-lg hover:bg-white/20"
        >
          <Languages className="h-5 w-5" />
        </Button>
      </header>

      <section className="relative pt-24 pb-16 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 animate-pulse">
            <Sparkles className="w-6 h-6 text-violet-400" />
          </div>
          <div className="absolute top-1/3 right-1/3 animate-pulse delay-300">
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="inline-block text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-400 drop-shadow-lg animate-glow">
            {t('title')}
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed">
            {t('subtitle')}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="relative p-6 rounded-xl bg-white/5 backdrop-blur-lg transform hover:scale-105 transition-all duration-300">
            <div className="absolute -top-3 -right-3 p-2 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-full">
              <Globe2 className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-violet-300">选择域名</h3>
            <p className="text-gray-400">浏览我们精选的优质域名列表，找到适合您的完美域名</p>
          </div>
          
          <div className="relative p-6 rounded-xl bg-white/5 backdrop-blur-lg transform hover:scale-105 transition-all duration-300">
            <div className="absolute -top-3 -right-3 p-2 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-full">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-violet-300">提交报价</h3>
            <p className="text-gray-400">提供您的报价和联系方式，我们将尽快与您沟通</p>
          </div>
          
          <div className="relative p-6 rounded-xl bg-white/5 backdrop-blur-lg transform hover:scale-105 transition-all duration-300">
            <div className="absolute -top-3 -right-3 p-2 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-full">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-violet-300">安全支付</h3>
            <p className="text-gray-400">通过安全的支付渠道完成交易，确保资金安全</p>
          </div>
          
          <div className="relative p-6 rounded-xl bg-white/5 backdrop-blur-lg transform hover:scale-105 transition-all duration-300">
            <div className="absolute -top-3 -right-3 p-2 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-full">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-violet-300">域名转移</h3>
            <p className="text-gray-400">我们将协助您完成域名转移的全过程</p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'secondary'}
            className={`rounded-full backdrop-blur-md transition-all duration-300 ${
              filter === 'all' 
                ? 'bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {t('all')}
          </Button>
          <Button
            onClick={() => setFilter('premium')}
            variant={filter === 'premium' ? 'default' : 'secondary'}
            className={`rounded-full backdrop-blur-md transition-all duration-300 ${
              filter === 'premium' 
                ? 'bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {t('premium')}
          </Button>
          <Button
            onClick={() => setFilter('short')}
            variant={filter === 'short' ? 'default' : 'secondary'}
            className={`rounded-full backdrop-blur-md transition-all duration-300 ${
              filter === 'short' 
                ? 'bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {t('short')}
          </Button>
          <Button
            onClick={() => setFilter('dev')}
            variant={filter === 'dev' ? 'default' : 'secondary'}
            className={`rounded-full backdrop-blur-md transition-all duration-300 ${
              filter === 'dev' 
                ? 'bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {t('dev')}
          </Button>
        </div>
      </div>

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

      <section className="py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-400">
            为什么选择我们
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-white/5 backdrop-blur-lg border border-violet-500/10 hover:border-violet-500/20 transition-all duration-300">
              <Shield className="w-10 h-10 text-violet-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-violet-300">安全保障</h3>
              <p className="text-gray-400">
                采用业内领先的安全措施，保护您的交易安全。专业的托管服务，确保双方权益。
              </p>
            </div>
            
            <div className="p-6 rounded-xl bg-white/5 backdrop-blur-lg border border-violet-500/10 hover:border-violet-500/20 transition-all duration-300">
              <CreditCard className="w-10 h-10 text-violet-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-violet-300">灵活付款</h3>
              <p className="text-gray-400">
                支持多种支付方式，可分期付款。专业的财务团队，确保资金流转安全。
              </p>
            </div>
            
            <div className="p-6 rounded-xl bg-white/5 backdrop-blur-lg border border-violet-500/10 hover:border-violet-500/20 transition-all duration-300">
              <MessageSquare className="w-10 h-10 text-violet-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-violet-300">专业服务</h3>
              <p className="text-gray-400">
                7x24小时客户服务，专业团队全程指导。快速响应您的每一个需求。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-2xl text-center transform hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-cyan-600/20 rounded-2xl" />
              <h3 className="text-2xl font-bold mb-4 relative z-10">{t('premiumDomains')}</h3>
              <p className="text-gray-300 mb-6 relative z-10">{t('premiumDomainsDesc')}</p>
              <div className="space-y-4 relative z-10">
                {availableDomains.filter(d => d.category === 'premium').slice(0, 3).map(domain => (
                  <div key={domain.name} 
                    className="p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-cyan-500/10 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300">
                    {domain.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-8 rounded-2xl text-center transform hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-cyan-600/20 rounded-2xl" />
              <h3 className="text-2xl font-bold mb-4 relative z-10">{t('shortDomains')}</h3>
              <p className="text-gray-300 mb-6 relative z-10">{t('shortDomainsDesc')}</p>
              <div className="space-y-4 relative z-10">
                {availableDomains.filter(d => d.category === 'short').slice(0, 3).map(domain => (
                  <div key={domain.name} 
                    className="p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-cyan-500/10 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300">
                    {domain.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-8 rounded-2xl text-center transform hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-cyan-600/20 rounded-2xl" />
              <h3 className="text-2xl font-bold mb-4 relative z-10">{t('devDomains')}</h3>
              <p className="text-gray-300 mb-6 relative z-10">{t('devDomainsDesc')}</p>
              <div className="space-y-4 relative z-10">
                {availableDomains.filter(d => d.category === 'dev').slice(0, 3).map(domain => (
                  <div key={domain.name} 
                    className="p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-cyan-500/10 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300">
                    {domain.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
