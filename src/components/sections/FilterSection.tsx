
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface FilterSectionProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
}

export const FilterSection = ({ currentFilter, onFilterChange }: FilterSectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-3 justify-center">
        {['all', 'premium', 'short', 'dev'].map((category) => (
          <Button
            key={category}
            onClick={() => onFilterChange(category)}
            variant={currentFilter === category ? 'default' : 'secondary'}
            className={`rounded-full backdrop-blur-md transition-all duration-300 ${
              currentFilter === category 
                ? 'bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {t(category)}
          </Button>
        ))}
      </div>
    </div>
  );
};
