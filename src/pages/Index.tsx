import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DomainCard } from '@/components/DomainCard';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Languages } from 'lucide-react';
import { useTheme } from 'next-themes';

const availableDomains = [
  { name: "nic.bn", price: "50,000", category: "premium" },
  { name: "X.RW", price: "25,000", category: "short" },
  { name: "F.AF", price: "30,000", category: "short" },
  { name: "L.KE", price: "28,000", category: "short" },
  { name: "Y.CR", price: "32,000", category: "short" },
  { name: "CXL.NET", price: "15,000", category: "premium" },
  { name: "Top.vg", price: "12,000", category: "premium" },
  { name: "Dev.ug", price: "8,000", category: "dev" },
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
    <div className="min-h-screen">
      {/* Header Controls */}
      <header className="fixed top-0 right-0 p-4 z-50 flex gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-full bg-background/20 backdrop-blur-lg"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLanguage}
          className="rounded-full bg-background/20 backdrop-blur-lg"
        >
          <Languages className="h-5 w-5" />
        </Button>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 animate-pulse" />
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-cyan-500 animate-glow relative z-10">
          {t('title')}
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 relative z-10">
          {t('subtitle')}
        </p>
      </section>

      {/* Filter Section */}
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'secondary'}
            className="rounded-full"
          >
            {t('all')}
          </Button>
          <Button
            onClick={() => setFilter('premium')}
            variant={filter === 'premium' ? 'default' : 'secondary'}
            className="rounded-full"
          >
            {t('premium')}
          </Button>
          <Button
            onClick={() => setFilter('short')}
            variant={filter === 'short' ? 'default' : 'secondary'}
            className="rounded-full"
          >
            {t('short')}
          </Button>
          <Button
            onClick={() => setFilter('dev')}
            variant={filter === 'dev' ? 'default' : 'secondary'}
            className="rounded-full"
          >
            {t('dev')}
          </Button>
        </div>
      </div>

      {/* Domains Grid */}
      <div className="max-w-7xl mx-auto px-4 mb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableDomains
            .filter(domain => filter === 'all' || domain.category === filter)
            .map((domain) => (
              <DomainCard 
                key={domain.name} 
                domain={domain.name} 
                price={domain.price}
              />
            ))}
        </div>
      </div>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-background/50 to-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Premium Domains */}
            <div className="glass-card p-8 rounded-2xl text-center">
              <h3 className="text-2xl font-bold mb-4">{t('premiumDomains')}</h3>
              <p className="text-gray-400 mb-6">{t('premiumDomainsDesc')}</p>
              <div className="space-y-4">
                {availableDomains.filter(d => d.category === 'premium').slice(0, 3).map(domain => (
                  <div key={domain.name} className="p-3 bg-background/40 rounded-lg">
                    {domain.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Short Domains */}
            <div className="glass-card p-8 rounded-2xl text-center">
              <h3 className="text-2xl font-bold mb-4">{t('shortDomains')}</h3>
              <p className="text-gray-400 mb-6">{t('shortDomainsDesc')}</p>
              <div className="space-y-4">
                {availableDomains.filter(d => d.category === 'short').slice(0, 3).map(domain => (
                  <div key={domain.name} className="p-3 bg-background/40 rounded-lg">
                    {domain.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Developer Domains */}
            <div className="glass-card p-8 rounded-2xl text-center">
              <h3 className="text-2xl font-bold mb-4">{t('devDomains')}</h3>
              <p className="text-gray-400 mb-6">{t('devDomainsDesc')}</p>
              <div className="space-y-4">
                {availableDomains.filter(d => d.category === 'dev').slice(0, 3).map(domain => (
                  <div key={domain.name} className="p-3 bg-background/40 rounded-lg">
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