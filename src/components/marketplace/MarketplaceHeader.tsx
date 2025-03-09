
import { SearchBar } from './SearchBar';

interface MarketplaceHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const MarketplaceHeader = ({ searchQuery, setSearchQuery }: MarketplaceHeaderProps) => {
  return (
    <header className="py-16 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-black mb-6">
          Discover Your Perfect Domain
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Browse our marketplace of premium domains owned by our community
        </p>
        
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>
    </header>
  );
};
