
import { CategoryFilters } from './CategoryFilters';
import { PriceRangeFilter } from './PriceRangeFilter';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface FilterSectionProps {
  filter: string;
  setFilter: (filter: string) => void;
  priceRange: { min: string, max: string };
  setPriceRange: (range: { min: string, max: string }) => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (verified: boolean) => void;
  isMobile?: boolean;
}

export const FilterSection = ({ 
  filter, 
  setFilter, 
  priceRange, 
  setPriceRange,
  verifiedOnly,
  setVerifiedOnly,
  isMobile
}: FilterSectionProps) => {
  return (
    <section className={`bg-gray-50 border-b ${isMobile ? 'py-2 px-2' : 'py-4'}`}>
      <div className={`${isMobile ? '' : 'max-w-6xl mx-auto px-4'}`}>
        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-row items-center justify-between'}`}>
          <CategoryFilters 
            filter={filter} 
            setFilter={setFilter}
            isMobile={isMobile}
          />
          
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-row items-center gap-6'}`}>
            <PriceRangeFilter 
              priceRange={priceRange} 
              setPriceRange={setPriceRange} 
              isMobile={isMobile}
            />
            
            <div className="flex items-center gap-2">
              <Switch 
                id="verified-filter"
                checked={verifiedOnly}
                onCheckedChange={setVerifiedOnly}
              />
              <Label htmlFor="verified-filter" className={`${isMobile ? 'text-sm' : ''}`}>
                仅显示已验证域名
              </Label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
