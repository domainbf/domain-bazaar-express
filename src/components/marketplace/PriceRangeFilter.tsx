
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';

interface PriceRangeFilterProps {
  priceRange: { min: string; max: string };
  setPriceRange: (range: { min: string; max: string }) => void;
}

export const PriceRangeFilter = ({ priceRange, setPriceRange }: PriceRangeFilterProps) => {
  const { t } = useTranslation();
  return (
    <div className="bg-muted/40 p-4 rounded-lg mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/70">{t('marketplace.price.minLabel')}</label>
          <Input
            type="number"
            value={priceRange.min}
            onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
            className="w-32 bg-background border-input"
            placeholder={t('marketplace.price.minPlaceholder')}
            min="0"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/70">{t('marketplace.price.maxLabel')}</label>
          <Input
            type="number"
            value={priceRange.max}
            onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
            className="w-32 bg-background border-input"
            placeholder={t('marketplace.price.maxPlaceholder')}
            min="0"
          />
        </div>
        <Button
          onClick={() => setPriceRange({min: '', max: ''})}
          variant="filter"
        >
          {t('marketplace.price.reset')}
        </Button>
      </div>
    </div>
  );
};
