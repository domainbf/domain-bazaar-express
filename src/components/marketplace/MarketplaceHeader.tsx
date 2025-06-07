
import { SearchBar } from './SearchBar';
import { useTranslation } from 'react-i18next';

interface MarketplaceHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isMobile?: boolean;
}

export const MarketplaceHeader = ({ searchQuery, setSearchQuery, isMobile = false }: MarketplaceHeaderProps) => {
  const { t } = useTranslation();
  
  return (
    <section className={`bg-gradient-to-r from-gray-900 to-black text-white ${isMobile ? 'py-6 px-4' : 'py-12'}`}>
      <div className={`${isMobile ? '' : 'max-w-6xl mx-auto px-4'}`}>
        <div className="text-center">
          <h1 className={`${isMobile ? 'text-2xl mb-2' : 'text-4xl mb-4'} font-bold`}>
            {t('marketplace.title', '域名市场')}
          </h1>
          <p className={`${isMobile ? 'text-sm mb-4' : 'text-xl mb-6'} text-gray-300`}>
            {t('marketplace.subtitle', '浏览并购买优质域名')}
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
