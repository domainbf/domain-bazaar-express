
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PriceRangeFilterProps {
  priceRange: { min: string; max: string };
  setPriceRange: (range: { min: string; max: string }) => void;
}

export const PriceRangeFilter = ({ priceRange, setPriceRange }: PriceRangeFilterProps) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Min Price ($)</label>
          <Input
            type="number"
            value={priceRange.min}
            onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
            className="w-32 bg-white border-gray-300"
            placeholder="Min"
            min="0"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Max Price ($)</label>
          <Input
            type="number"
            value={priceRange.max}
            onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
            className="w-32 bg-white border-gray-300"
            placeholder="Max"
            min="0"
          />
        </div>
        <Button
          onClick={() => setPriceRange({min: '', max: ''})}
          variant="filter"
          className="text-gray-900"
        >
          Reset
        </Button>
      </div>
    </div>
  );
};
