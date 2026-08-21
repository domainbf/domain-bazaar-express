import { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Search, X, SlidersHorizontal, LayoutGrid, List as ListIcon, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToolbarOption { id: string; label: string }
export interface ToolbarGroup {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: ToolbarOption[];
  /** Render options as mono chips (used for TLDs). */
  mono?: boolean;
}
export interface ToolbarToggle {
  id: string;
  label: string;
  active: boolean;
  onToggle: () => void;
  icon?: ReactNode;
}

interface FilterToolbarProps {
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder?: string;
  sortValue: string;
  onSortChange: (v: string) => void;
  sortOptions: ToolbarOption[];
  groups?: ToolbarGroup[];
  toggles?: ToolbarToggle[];
  view?: 'grid' | 'list';
  onViewChange?: (v: 'grid' | 'list') => void;
  onClear?: () => void;
  filterLabel?: string;
  clearLabel?: string;
  rightSlot?: ReactNode;
  className?: string;
}

/**
 * One compact line of controls: search · sort · filters popover · view toggle.
 * Everything secondary lives behind the popover so the page stays about domains.
 */
export const FilterToolbar = ({
  search, onSearch, searchPlaceholder,
  sortValue, onSortChange, sortOptions,
  groups = [], toggles = [],
  view, onViewChange, onClear,
  filterLabel = '筛选', clearLabel = '清空',
  rightSlot, className,
}: FilterToolbarProps) => {
  const activeCount =
    groups.filter(g => g.value !== g.options[0]?.id).length +
    toggles.filter(t => t.active).length;

  const activeChips = [
    ...groups
      .filter(g => g.value !== g.options[0]?.id)
      .map(g => ({
        key: g.id,
        label: g.options.find(o => o.id === g.value)?.label ?? g.value,
        clear: () => g.onChange(g.options[0]?.id ?? ''),
      })),
    ...toggles.filter(t => t.active).map(t => ({ key: t.id, label: t.label, clear: t.onToggle })),
  ];

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 pl-9 pr-9 rounded-full bg-muted/40 border-border text-sm"
            data-testid="input-search-marketplace"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch('')}
              aria-label={clearLabel}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort */}
        <Select value={sortValue} onValueChange={onSortChange}>
          <SelectTrigger
            className="h-10 w-auto min-w-0 gap-1.5 rounded-full border-border bg-muted/40 px-3 text-xs font-medium"
            data-testid="select-sort"
            aria-label="排序"
          >
            <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="hidden sm:inline"><SelectValue /></span>
          </SelectTrigger>
          <SelectContent align="end">
            {sortOptions.map(o => (
              <SelectItem key={o.id} value={o.id} data-testid={`sort-${o.id}`} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filters popover */}
        {(groups.length > 0 || toggles.length > 0) && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="relative h-10 shrink-0 gap-1.5 rounded-full border-border bg-muted/40 px-3 text-xs font-medium"
                data-testid="button-open-filters"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{filterLabel}</span>
                {activeCount > 0 && (
                  <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
                    {activeCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[min(88vw,20rem)] max-h-[70vh] overflow-y-auto p-4 space-y-4">
              {groups.map(g => (
                <div key={g.id} className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{g.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {g.options.map(o => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => g.onChange(o.id)}
                        data-testid={`filter-${g.id}-${o.id}`}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-xs transition-colors',
                          g.mono && 'font-mono',
                          g.value === o.id
                            ? 'bg-foreground text-background font-semibold'
                            : 'bg-muted text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {toggles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
                  {toggles.map(tg => (
                    <button
                      key={tg.id}
                      type="button"
                      onClick={tg.onToggle}
                      data-testid={`toggle-${tg.id}`}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors',
                        tg.active
                          ? 'bg-foreground text-background font-semibold'
                          : 'bg-muted text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {tg.icon}{tg.label}
                    </button>
                  ))}
                </div>
              )}

              {onClear && (
                <Button variant="ghost" size="sm" onClick={onClear} className="w-full text-xs" data-testid="button-clear-filters">
                  {clearLabel}
                </Button>
              )}
            </PopoverContent>
          </Popover>
        )}

        {/* View toggle */}
        {view && onViewChange && (
          <div className="hidden sm:inline-flex shrink-0 rounded-full bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => onViewChange('grid')}
              data-testid="view-grid"
              aria-label="网格视图"
              className={cn('h-9 w-9 flex items-center justify-center rounded-full transition-colors',
                view === 'grid' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewChange('list')}
              data-testid="view-list"
              aria-label="列表视图"
              className={cn('h-9 w-9 flex items-center justify-center rounded-full transition-colors',
                view === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              <ListIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {rightSlot}
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeChips.map(c => (
            <button
              key={c.key}
              type="button"
              onClick={c.clear}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              {c.label}<X className="h-3 w-3" />
            </button>
          ))}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="px-1.5 text-[11px] font-medium text-muted-foreground underline-offset-2 hover:underline"
            >
              {clearLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
