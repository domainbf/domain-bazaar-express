
import { SearchBar } from './SearchBar';
import { useTranslation } from 'react-i18next';
import { Globe2, Sparkles } from 'lucide-react';

interface MarketplaceHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isMobile?: boolean;
}

export const MarketplaceHeader = ({ searchQuery, setSearchQuery, isMobile = false }: MarketplaceHeaderProps) => {
  const { t } = useTranslation();

  return (
    <section className={`page-hero ${isMobile ? 'py-8 px-4' : 'py-16'}`}>
      {/* dot pattern — same texture language as the homepage hero */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 85%)',
        }} />

      <div className={`relative z-10 ${isMobile ? '' : 'page-container'}`}>
        <div className="text-center">
          {/* badge */}
          {!isMobile && (
            <div className="page-eyebrow mb-5">
              <Globe2 className="w-3.5 h-3.5" />
              {t('marketplace.heroBadge')}
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          )}
          <h1 className={`${isMobile ? 'text-3xl mb-2' : 'text-4xl md:text-5xl mb-4'} font-bold tracking-tight text-foreground`}>
            {t('marketplace.title')}
          </h1>
          <p className={`${isMobile ? 'text-sm mb-5' : 'text-lg mb-8'} text-muted-foreground`}>
            {t('marketplace.subtitle')}
          </p>

          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>
      </div>
    </section>
  );
};
