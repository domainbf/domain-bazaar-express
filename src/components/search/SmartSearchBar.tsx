
import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, TrendingUp, Clock, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchSuggestion } from '@/types/domain';
import { cn } from '@/lib/utils';

interface SmartSearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  suggestions: SearchSuggestion[];
  onSuggestionSelect: (suggestion: string) => void;
  onFiltersToggle: () => void;
  className?: string;
  recentSearches?: string[];
  popularSearches?: string[];
}

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  suggestions,
  onSuggestionSelect,
  onFiltersToggle,
  className,
  recentSearches = [],
  popularSearches = ['ai.com', 'crypto.com', 'nft.io', 'web3.co']
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const allSuggestions = [...suggestions, ...recentSearches.map(s => ({ domain: s, type: 'recent' as const, score: 1 }))];
    
    if (!showSuggestions || allSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          onSuggestionSelect(allSuggestions[selectedIndex].domain);
          setShowSuggestions(false);
        } else if (searchTerm.trim()) {
          onSuggestionSelect(searchTerm.trim());
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        inputRef.current?.blur();
        break;
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'exact':
        return <Search className="h-3 w-3" />;
      case 'trending':
        return <TrendingUp className="h-3 w-3" />;
      case 'recent':
        return <Clock className="h-3 w-3" />;
      case 'popular':
        return <Star className="h-3 w-3" />;
      default:
        return <Search className="h-3 w-3" />;
    }
  };

  const getSuggestionBadge = (type: string) => {
    switch (type) {
      case 'exact':
        return <Badge variant="default" className="text-xs">精确</Badge>;
      case 'trending':
        return <Badge variant="secondary" className="text-xs">热门</Badge>;
      case 'similar':
        return <Badge variant="outline" className="text-xs">相似</Badge>;
      case 'recent':
        return <Badge variant="outline" className="text-xs">最近</Badge>;
      case 'popular':
        return <Badge variant="secondary" className="text-xs">流行</Badge>;
      default:
        return null;
    }
  };

  const allSuggestions = [
    ...suggestions,
    ...recentSearches.slice(0, 3).map(s => ({ domain: s, type: 'recent' as const, score: 1 })),
    ...(searchTerm.length === 0 ? popularSearches.map(s => ({ domain: s, type: 'popular' as const, score: 1 })) : [])
  ];

  return (
    <div className={cn("relative w-full max-w-3xl", className)}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="搜索域名、关键词或分类... (例如: tech, ai.com, 3字母域名)"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          onKeyDown={handleKeyDown}
          className="pl-12 pr-20 h-14 text-base border-2 focus:border-primary rounded-xl"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onSearchChange('');
                inputRef.current?.focus();
              }}
              className="h-8 w-8 p-0 hover:bg-muted/50"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onFiltersToggle}
            className="h-9 px-3 border-2"
          >
            <Filter className="h-4 w-4 mr-1" />
            筛选
          </Button>
        </div>
      </div>

      {/* 智能搜索建议下拉框 */}
      {showSuggestions && allSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-background border-2 border-border rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto"
        >
          <div className="p-2">
            {searchTerm.length === 0 && (
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                热门搜索
              </div>
            )}
            {allSuggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.domain}-${suggestion.type}`}
                className={cn(
                  "flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-150 rounded-lg mx-1",
                  index === selectedIndex 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "hover:bg-muted/50"
                )}
                onClick={() => {
                  onSuggestionSelect(suggestion.domain);
                  setShowSuggestions(false);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-1 rounded", index === selectedIndex ? "text-primary" : "text-muted-foreground")}>
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{suggestion.domain}</span>
                    {suggestion.type === 'trending' && (
                      <span className="text-xs text-muted-foreground">正在热搜</span>
                    )}
                  </div>
                  {getSuggestionBadge(suggestion.type)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(suggestion.score * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
