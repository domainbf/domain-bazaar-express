import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DomainCard } from '@/components/DomainCard';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Languages } from 'lucide-react';
import { useTheme } from 'next-themes';

const availableDomains = [
  "nic.bn", "X.RW", "F.AF", "L.KE", "Y.CR", "CXL.NET", "Top.vg", "Dev.ug",
  "BUG.KZ", "Fil.ng", "DOMAIN.BF", "WHOIS.LS", "GAME.kg", "Rule.ml",
  "SORA.mk", "Name.cf", "Fuck.bf", "Fuck.fo", "1024.pw", "0451.me",
  "0451.xyz", "Hello.uy", "Met.as", "Tools.st", "intels.at",
  "HUANGPIAN.NET", "KUAIGAN.NET", "liaoliao.me"
];

const soldDomains = [
  "sold.com",
  "example.net",
  "demo.org"
];

const Index = () => {
  const [filter, setFilter] = useState('all');
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with theme and language toggles */}
        <div className="flex justify-end gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="rounded-full"
          >
            <Languages className="h-5 w-5" />
          </Button>
        </div>

        {/* Title Section */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-bold neon-text bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-cyan-500 animate-glow">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-400">
            {t('subtitle')}
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center gap-4 mb-12">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'secondary'}
            className="rounded-full transition-all"
          >
            {t('all')}
          </Button>
          <Button
            onClick={() => setFilter('available')}
            variant={filter === 'available' ? 'default' : 'secondary'}
            className="rounded-full transition-all"
          >
            {t('available')}
          </Button>
          <Button
            onClick={() => setFilter('sold')}
            variant={filter === 'sold' ? 'default' : 'secondary'}
            className="rounded-full transition-all"
          >
            {t('sold')}
          </Button>
        </div>

        {/* Domain Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(filter === 'all' || filter === 'available') &&
            availableDomains.map((domain) => (
              <DomainCard key={domain} domain={domain} />
            ))}
          
          {(filter === 'all' || filter === 'sold') &&
            soldDomains.map((domain) => (
              <DomainCard key={domain} domain={domain} isSold={true} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Index;