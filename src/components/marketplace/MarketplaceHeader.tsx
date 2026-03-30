
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
    <section className={`relative overflow-hidden ${isMobile ? 'py-6 px-4' : 'py-14'}`}>
      {/* gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 animate-gradient" />
      {/* dot pattern */}
      <div className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
      {/* glow orbs */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20 animate-glow-pulse pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.8) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-15 animate-glow-pulse pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.8) 0%, transparent 70%)', animationDelay: '2.5s' }} />

      <div className={`relative z-10 ${isMobile ? '' : 'max-w-6xl mx-auto px-4'}`}>
        <div className="text-center">
          {/* badge */}
          {!isMobile && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 rounded-full border border-indigo-400/30 bg-indigo-500/10 text-indigo-200 text-sm font-medium">
              <Globe2 className="w-3.5 h-3.5" />
              精选域名交易市场
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          )}
          <h1 className={`${isMobile ? 'text-2xl mb-2' : 'text-4xl mb-4'} font-bold text-white`}>
            {t('marketplace.title')}
          </h1>
          <p className={`${isMobile ? 'text-sm mb-4' : 'text-lg mb-8'} text-indigo-200/80`}>
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
