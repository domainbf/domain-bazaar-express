
import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, TrendingUp, Clock, Star } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { SearchSuggestion } from '@/types/domain';

interface EnhancedSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  onSearch,
  placeholder = "搜索域名...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches] = useState<string[]>([
    'AI域名', '区块链', '电商平台', '科技公司', '在线教育'
  ]);

  const debouncedQuery = useDebounce(query, 300);

  // 模糊搜索和智能推荐
  const searchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      // 模拟智能推荐算法
      const mockSuggestions: SearchSuggestion[] = [
        {
          domain: `${searchQuery}.com`,
          type: 'exact',
          score: 100
        },
        {
          domain: `${searchQuery}.cn`,
          type: 'exact',
          score: 95
        },
        {
          domain: `my${searchQuery}.com`,
          type: 'similar',
          score: 85
        },
        {
          domain: `${searchQuery}app.com`,
          type: 'similar',
          score: 80
        },
        {
          domain: `get${searchQuery}.com`,
          type: 'similar',
          score: 75
        },
        {
          domain: `${searchQuery}online.com`,
          type: 'trending',
          score: 70
        }
      ];

      // 根据查询相似度排序
      const filteredSuggestions = mockSuggestions
        .filter(s => s.domain.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);

      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('搜索建议失败:', error);
    }
  }, []);

  React.useEffect(() => {
    if (debouncedQuery) {
      searchSuggestions(debouncedQuery);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedQuery, searchSuggestions]);

  const handleSearch = (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      // 添加到最近搜索
      setRecentSearches(prev => {
        const updated = [trimmedQuery, ...prev.filter(item => item !== trimmedQuery)];
        return updated.slice(0, 5);
      });
      
      onSearch(trimmedQuery);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.domain);
    handleSearch(suggestion.domain);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'trending':
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'similar':
        return <Star className="h-4 w-4 text-blue-500" />;
      default:
        return <Search className="h-4 w-4 text-green-500" />;
    }
  };

  const getSuggestionBadge = (type: string) => {
    const badgeConfig = {
      exact: { label: '精确匹配', variant: 'default' as const },
      similar: { label: '相似推荐', variant: 'secondary' as const },
      trending: { label: '热门推荐', variant: 'outline' as const }
    };
    
    const config = badgeConfig[type as keyof typeof badgeConfig] || badgeConfig.similar;
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={() => setShowSuggestions(true)}
          className="pl-10 pr-12"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Button
          size="sm"
          onClick={() => handleSearch(query)}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8"
        >
          搜索
        </Button>
      </div>

      {/* 搜索建议和推荐 */}
      {showSuggestions && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {/* 智能推荐 */}
            {suggestions.length > 0 && (
              <div className="p-3 border-b">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  智能推荐
                </div>
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="flex items-center gap-2">
                        {getSuggestionIcon(suggestion.type)}
                        <span>{suggestion.domain}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSuggestionBadge(suggestion.type)}
                        <span className="text-xs text-muted-foreground">
                          {suggestion.score}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 最近搜索 */}
            {recentSearches.length > 0 && query === '' && (
              <div className="p-3 border-b">
                <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  最近搜索
                </div>
                <div className="flex flex-wrap gap-1">
                  {recentSearches.map((search, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => {
                        setQuery(search);
                        handleSearch(search);
                      }}
                    >
                      {search}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 热门搜索 */}
            {query === '' && (
              <div className="p-3">
                <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  热门搜索
                </div>
                <div className="flex flex-wrap gap-1">
                  {trendingSearches.map((search, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => {
                        setQuery(search);
                        handleSearch(search);
                      }}
                    >
                      {search}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 无结果状态 */}
            {query && suggestions.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>未找到相关建议</p>
                <p className="text-sm">尝试其他关键词或查看热门搜索</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 点击外部关闭建议 */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
};
