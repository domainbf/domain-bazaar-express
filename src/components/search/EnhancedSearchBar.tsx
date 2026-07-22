import React, { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, TrendingUp, Clock, Star, Sparkles } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import { SearchSuggestion } from '@/types/domain';

interface EnhancedSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

const RECENT_KEY = 'domain_recent_searches';
const TRENDING = ['AI域名', '区块链', '电商平台', '科技公司', '在线教育'];

export const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  onSearch,
  placeholder = '搜索域名...',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const debouncedQuery = useDebounce(query, 350);

  // Load recent from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecentSearches(JSON.parse(raw).slice(0, 5));
    } catch { /* ignore */ }
  }, []);

  // Merge real marketplace matches + AI-generated ideas
  const searchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      // 1. Real domain matches from the marketplace
      const { data: real } = await supabase
        .from('domains')
        .select('name, price')
        .ilike('name', `%${q}%`)
        .eq('status', 'available')
        .limit(4);

      const realHits: SearchSuggestion[] = (real || []).map((d: any) => ({
        domain: d.name,
        type: 'exact',
        score: 100,
      }));

      // 2. AI ideas via cmdk-suggest edge fn
      let aiHits: SearchSuggestion[] = [];
      try {
        const { data: ai } = await supabase.functions.invoke('cmdk-suggest', {
          body: { query: q },
        });
        const items = (ai as any)?.suggestions || [];
        aiHits = items.slice(0, 6).map((s: any) => ({
          domain: s.name || s.domain,
          type: 'similar',
          score: 85,
        }));
      } catch { /* silent */ }

      // Dedupe by domain
      const seen = new Set<string>();
      const merged = [...realHits, ...aiHits].filter((s) => {
        const k = s.domain.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      setSuggestions(merged.slice(0, 8));
    } catch (error) {
      console.error('搜索建议失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery) {
      searchSuggestions(debouncedQuery);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery, searchSuggestions]);

  const persistRecent = (q: string) => {
    const next = [q, ...recentSearches.filter((i) => i !== q)].slice(0, 5);
    setRecentSearches(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const handleSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    persistRecent(trimmed);
    onSearch(trimmed);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (s: SearchSuggestion) => {
    setQuery(s.domain);
    handleSearch(s.domain);
  };

  const getSuggestionIcon = (type: string) =>
    type === 'trending' ? <TrendingUp className="h-4 w-4 text-orange-500" /> :
    type === 'similar' ? <Sparkles className="h-4 w-4 text-blue-500" /> :
    <Search className="h-4 w-4 text-green-500" />;

  const getSuggestionBadge = (type: string) => {
    const map = {
      exact: { label: '在售', variant: 'default' as const },
      similar: { label: 'AI 推荐', variant: 'secondary' as const },
      trending: { label: '热门', variant: 'outline' as const },
    };
    const c = map[type as keyof typeof map] || map.similar;
    return <Badge variant={c.variant} className="text-xs">{c.label}</Badge>;
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
          className="pl-10 pr-20"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Button
          size="sm"
          onClick={() => handleSearch(query)}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8"
        >
          搜索
        </Button>
      </div>

      {showSuggestions && (query || recentSearches.length > 0) && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {loading && (
              <div className="p-3 text-center text-xs text-muted-foreground">
                正在生成智能推荐…
              </div>
            )}
            {suggestions.length > 0 && (
              <div className="p-3 border-b">
                <div className="text-sm font-medium text-muted-foreground mb-2">智能推荐</div>
                <div className="space-y-1">
                  {suggestions.map((s, i) => (
                    <div
                      key={`${s.domain}-${i}`}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                      onMouseDown={() => handleSuggestionClick(s)}
                    >
                      <div className="flex items-center gap-2">
                        {getSuggestionIcon(s.type)}
                        <span className="font-medium">{s.domain}</span>
                      </div>
                      {getSuggestionBadge(s.type)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {recentSearches.length > 0 && (
              <div className="p-3 border-b">
                <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> 最近搜索
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((r) => (
                    <Badge key={r} variant="outline" className="cursor-pointer hover:bg-muted"
                      onMouseDown={() => handleSearch(r)}>
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="p-3">
              <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Star className="h-3.5 w-3.5" /> 热门方向
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TRENDING.map((t) => (
                  <Badge key={t} variant="secondary" className="cursor-pointer hover:bg-muted"
                    onMouseDown={() => handleSearch(t)}>
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
