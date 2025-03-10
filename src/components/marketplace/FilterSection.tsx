
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Filter } from 'lucide-react';
import { CategoryFilters } from './CategoryFilters';
import { PriceRangeFilter } from './PriceRangeFilter';

interface FilterSectionProps {
  filter: string;
  setFilter: (filter: string) => void;
  priceRange: { min: string; max: string };
  setPriceRange: (range: { min: string; max: string }) => void;
  verifiedOnly?: boolean;
  setVerifiedOnly?: (verified: boolean) => void;
}

export const FilterSection = ({ 
  filter, 
  setFilter, 
  priceRange, 
  setPriceRange,
  verifiedOnly = false,
  setVerifiedOnly
}: FilterSectionProps) => {
  const [showFilters, setShowFilters] = useState(false);
  
  const categoryFilters = [
    { id: 'all', label: 'All' },
    { id: 'premium', label: 'Premium' },
    { id: 'short', label: 'Short' },
    { id: 'dev', label: 'Development' },
    { id: 'brandable', label: 'Brandable' }
  ];

  return (
    <section className="py-8 border-b">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-4">
          <CategoryFilters 
            filter={filter} 
            setFilter={setFilter} 
            categoryFilters={categoryFilters} 
          />
          
          <Button
            variant="filter"
            onClick={() => setShowFilters(!showFilters)}
            className="text-gray-900"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
        
        {showFilters && (
          <div className="space-y-4">
            <PriceRangeFilter priceRange={priceRange} setPriceRange={setPriceRange} />
            
            {setVerifiedOnly && (
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="verifiedOnly"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="verifiedOnly" className="text-sm font-medium text-gray-700">
                  Verified domains only
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
