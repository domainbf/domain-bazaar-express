
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const SearchBar = ({ searchQuery, setSearchQuery }: SearchBarProps) => {
  const { t } = useTranslation();
  return (
    <div className="max-w-md mx-auto">
      <div className="relative">
        <Input
          type="text"
          placeholder={t('marketplace.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 bg-white border-gray-300 focus:border-black"
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      </div>
    </div>
  );
};
