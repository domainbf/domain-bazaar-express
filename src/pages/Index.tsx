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

  const sections = [
    {
      title: t('premiumDomains'),
      description: t('premiumDomainsDesc'),
      domains: availableDomains.slice(0, 7)
    },
    {
      title: t('shortDomains'),
      description: t('shortDomainsDesc'),
      domains: availableDomains.slice(7, 14)
    },
    {
      title: t('specialDomains'),
      description: t('specialDomainsDesc'),
      domains: availableDomains.slice(14, 21)
    },
    {
      title: t('otherDomains'),
      description: t('otherDomainsDesc'),
      domains: availableDomains.slice(21)
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
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
      <section className="pt-24 pb-16 px-4 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-cyan-500 animate-glow">
          {t('title')}
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </section>

      {/* Filter Section */}
      <div className="flex justify-center gap-4 mb-12 px-4">
        <Button
          onClick={() => setFilter('all')}
          variant={filter === 'all' ? 'default' : 'secondary'}
          className="rounded-full"
        >
          {t('all')}
        </Button>
        <Button
          onClick={() => setFilter('available')}
          variant={filter === 'available' ? 'default' : 'secondary'}
          className="rounded-full"
        >
          {t('available')}
        </Button>
        <Button
          onClick={() => setFilter('sold')}
          variant={filter === 'sold' ? 'default' : 'secondary'}
          className="rounded-full"
        >
          {t('sold')}
        </Button>
      </div>

      {/* Domain Sections */}
      <div className="max-w-7xl mx-auto px-4 space-y-24 mb-24">
        {sections.map((section, index) => (
          <section key={index} className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">{section.title}</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">{section.description}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {section.domains.map((domain) => (
                <DomainCard key={domain} domain={domain} />
              ))}
            </div>
          </section>
        ))}

        {/* Sold Domains Section */}
        {(filter === 'all' || filter === 'sold') && (
          <section className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">{t('soldDomains')}</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">{t('soldDomainsDesc')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {soldDomains.map((domain) => (
                <DomainCard key={domain} domain={domain} isSold={true} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Index;