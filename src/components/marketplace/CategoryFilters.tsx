
import { Button } from "@/components/ui/button";

interface CategoryFilter {
  id: string;
  label: string;
}

interface CategoryFiltersProps {
  filter: string;
  setFilter: (filter: string) => void;
  categoryFilters: CategoryFilter[];
}

export const CategoryFilters = ({ filter, setFilter, categoryFilters }: CategoryFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {categoryFilters.map(category => (
        <Button
          key={category.id}
          variant={filter === category.id ? 'filterActive' : 'filter'}
          onClick={() => setFilter(category.id)}
          className="min-w-[80px]"
        >
          {category.label}
        </Button>
      ))}
    </div>
  );
};
