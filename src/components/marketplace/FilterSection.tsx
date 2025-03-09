
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
}

export const FilterSection = ({ 
  filter, 
  setFilter, 
  priceRange, 
  setPriceRange 
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
          <PriceRangeFilter priceRange={priceRange} setPriceRange={setPriceRange} />
        )}
      </div>
    </section>
  );
};
