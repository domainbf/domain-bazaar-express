
import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchSuggestion } from '@/types/domain';
import { cn } from '@/lib/utils';

interface EnhancedSearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  suggestions: SearchSuggestion[];
  onSuggestionSelect: (suggestion: string) => void;
  onFiltersToggle: () => void;
  className?: string;
}

export const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  suggestions,
  onSuggestionSelect,
  onFiltersToggle,
  className
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          onSuggestionSelect(suggestions[selectedIndex].domain);
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        inputRef.current?.blur();
        break;
    }
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'exact':
        return <Search className="h-3 w-3" />;
      case 'trending':
        return <TrendingUp className="h-3 w-3" />;
      default:
        return <Search className="h-3 w-3" />;
    }
  };

  const getSuggestionBadge = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'exact':
        return <Badge variant="default" className="text-xs">精确</Badge>;
      case 'trending':
        return <Badge variant="secondary" className="text-xs">热门</Badge>;
      case 'similar':
        return <Badge variant="outline" className="text-xs">相似</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className={cn("relative w-full max-w-2xl", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="搜索域名... (例如: example.com, tech, ai)"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // 延迟隐藏建议，以便处理点击事件
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-20 h-12 text-base"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onSearchChange('');
                inputRef.current?.focus();
              }}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onFiltersToggle}
            className="h-8 px-3"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 搜索建议下拉框 */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.domain}-${suggestion.type}`}
              className={cn(
                "flex items-center justify-between px-4 py-3 cursor-pointer transition-colors",
                index === selectedIndex 
                  ? "bg-accent text-accent-foreground" 
                  : "hover:bg-muted"
              )}
              onClick={() => {
                onSuggestionSelect(suggestion.domain);
                setShowSuggestions(false);
              }}
            >
              <div className="flex items-center gap-3">
                {getSuggestionIcon(suggestion.type)}
                <span className="font-medium">{suggestion.domain}</span>
                {getSuggestionBadge(suggestion.type)}
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.round(suggestion.score * 100)}% 匹配
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
