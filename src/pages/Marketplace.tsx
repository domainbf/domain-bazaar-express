import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { DomainListings } from '@/components/marketplace/DomainListings';
import { useIsMobile } from '@/hooks/use-mobile';
import { SoldDomains } from '@/components/sections/SoldDomains';
import { useNotifications } from '@/hooks/useNotifications';
import { useDomainListings, DOMAIN_LISTINGS_KEY } from '@/hooks/useDomainListings';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, TrendingUp, RefreshCw, Star, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

const getDomainExtension = (domain: string): string => {
  const match = domain.match(/(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?$/);
  return match ? match[0].toLowerCase() : '';
};

const TLD_FILTERS = [
  { id: 'all', label: '全部' },
  { id: '.com', label: '.com' },
  { id: '.net', label: '.net' },
  { id: '.cn', label: '.cn' },
  { id: '.io', label: '.io' },
  { id: '.ai', label: '.ai' },
  { id: '.app', label: '.app' },
  { id: '.org', label: '.org' },
  { id: '.co', label: '.co' },
  { id: '.me', label: '.me' },
];

const PRICE_CHIPS = [
  { id: 'all', label: '不限价格', min: 0, max: Infinity },
  { id: 'under5k', label: '5千以下', min: 0, max: 5000 },
  { id: '5k-20k', label: '5千~2万', min: 5000, max: 20000 },
  { id: '20k-100k', label: '2万~10万', min: 20000, max: 100000 },
  { id: 'over100k', label: '10万以上', min: 100000, max: Infinity },
];

const SORT_OPTIONS = [
  { id: 'newest', label: '最新上架' },
  { id: 'price_asc', label: '价格↑' },
  { id: 'price_desc', label: '价格↓' },
  { id: 'views', label: '最多浏览' },
];

export const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tldFilter, setTldFilter] = useState('all');
  const [priceChip, setPriceChip] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const isMobile = useIsMobile();
  const { unreadCount } = useNotifications();
  const queryClient = useQueryClient();

  const { data: allDomains = [], isLoading, isError, refetch } = useDomainListings();

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('search');
    if (s) setSearchQuery(s);
  }, []);

  const featuredDomains = useMemo(
    () => allDomains.filter(d => d.highlight).slice(0, 6),
    [allDomains]
  );

  const filteredDomains = useMemo(() => {
    let result = [...allDomains];
    if (tldFilter !== 'all')
      result = result.filter(d =>
        getDomainExtension(d.name) === tldFilter ||
        getDomainExtension(d.name).endsWith(tldFilter)
      );
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(d =>
        d.name?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q)
      );
    }
    const pc = PRICE_CHIPS.find(p => p.id === priceChip);
    if (pc && pc.id !== 'all')
      result = result.filter(d => d.price >= pc.min && d.price <= pc.max);
    if (verifiedOnly) result = result.filter(d => d.is_verified);
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':  return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'views':      return (b.views || 0) - (a.views || 0);
        default:           return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return result;
  }, [allDomains, tldFilter, searchQuery, priceChip, verifiedOnly, sortBy]);

  const hasActiveFilters = tldFilter !== 'all' || priceChip !== 'all' || verifiedOnly || sortBy !== 'newest' || searchQuery.trim();

  const clearAll = () => {
    setTldFilter('all'); setPriceChip('all'); setSortBy('newest');
    setVerifiedOnly(false); setSearchQuery('');
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: DOMAIN_LISTINGS_KEY });
  };

  const px = isMobile ? 'px-4' : 'max-w-3xl mx-auto px-6';

  return (
    <div className="min-h-screen bg-background">
      <Navbar unreadCount={unreadCount} />

      <div className={isMobile ? 'pb-24' : 'pb-16'}>

        {/* ── Search bar ─────────────────────────────────────── */}
        <div className="border-b border-border bg-background">
          <div className={`${px} py-3`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜索域名..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-10 pl-9 pr-9 bg-muted/40 border-border rounded-lg text-sm"
                data-testid="input-search-marketplace"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── TLD Filter Row ──────────────────────────────────── */}
        <div className="border-b border-border bg-background">
          <div className={`${px} py-2.5`}>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {TLD_FILTERS.map(tld => (
                <button
                  key={tld.id}
                  data-testid={`filter-tld-${tld.id}`}
                  onClick={() => setTldFilter(tld.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                    tldFilter === tld.id
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {tld.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Price + Sort Bar ────────────────────────────────── */}
        <div className="border-b border-border bg-background/90 sticky top-0 z-10 backdrop-blur-sm">
          <div className={px}>
            {/* Row 1: Price chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-2 border-b border-border/50">
              {PRICE_CHIPS.map(chip => (
                <button
                  key={chip.id}
                  data-testid={`filter-price-${chip.id}`}
                  onClick={() => setPriceChip(chip.id)}
                  className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors shrink-0 ${
                    priceChip === chip.id
                      ? 'bg-foreground text-background font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            {/* Row 2: Sort options */}
            <div className="flex items-center gap-1 py-2">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  data-testid={`sort-${opt.id}`}
                  onClick={() => setSortBy(opt.id)}
                  className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                    sortBy === opt.id
                      ? 'bg-foreground text-background font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="ml-auto p-1 text-muted-foreground hover:text-foreground rounded"
                  data-testid="button-clear-filters"
                  title="清空筛选"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Main Content ────────────────────────────────────── */}
        <div className={px}>

          {/* Featured section — only when no active filters */}
          {!isLoading && featuredDomains.length > 0 && !hasActiveFilters && (
            <section className="mt-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-bold">精选推荐</span>
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">HOT</Badge>
              </div>
              <div className={`grid gap-2 ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {featuredDomains.map(domain => (
                  <Link
                    key={domain.id}
                    to={`/domain/${encodeURIComponent(domain.name)}`}
                    data-testid={`featured-domain-${domain.id}`}
                    className="group block rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium text-orange-500 flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-current" />精选
                      </span>
                      {domain.is_verified && (
                        <span className="text-[10px] text-muted-foreground">已验证</span>
                      )}
                    </div>
                    <p className="font-black text-sm uppercase tracking-tight truncate text-foreground group-hover:text-primary transition-colors">
                      {domain.name}
                    </p>
                    <p className="text-sm font-bold text-foreground mt-1">
                      {domain.price > 0 ? `$${domain.price.toLocaleString()}` : '$0'}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Count + verified toggle */}
          {!isLoading && (
            <div className="flex items-center justify-between py-3">
              <p className="text-sm text-muted-foreground" data-testid="text-domain-count">
                共 <span className="font-semibold text-foreground">{filteredDomains.length}</span> 个域名
                {filteredDomains.length !== allDomains.length && (
                  <span className="ml-1 text-xs text-muted-foreground/60">/ {allDomains.length}</span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <button
                  data-testid="toggle-verified-only"
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors ${
                    verifiedOnly
                      ? 'bg-foreground text-background font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <TrendingUp className="h-3 w-3" />
                  仅已验证
                </button>
                <button
                  onClick={handleRefresh}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  title="刷新"
                  data-testid="button-refresh-domains"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Domain list */}
          {isError ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">加载域名失败，请重试</p>
              <Button onClick={() => refetch()} variant="outline" size="sm">重新加载</Button>
            </div>
          ) : isLoading ? (
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-4 py-4 border-b border-border animate-pulse">
                  <div className="h-7 w-48 bg-muted rounded mb-2" />
                  <div className="h-5 w-24 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : filteredDomains.length === 0 && allDomains.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">暂无在售域名</h3>
              <p className="text-muted-foreground text-sm mb-4">市场还没有域名，快来第一个上架吧</p>
              <Button asChild size="sm"><Link to="/dashboard">上架域名</Link></Button>
            </div>
          ) : filteredDomains.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🤔</div>
              <h3 className="text-lg font-semibold mb-2">没有找到匹配的域名</h3>
              <p className="text-muted-foreground text-sm mb-4">请尝试调整筛选条件</p>
              <Button onClick={clearAll} variant="outline" size="sm">清空筛选</Button>
            </div>
          ) : (
            <DomainListings isLoading={false} domains={filteredDomains} isMobile={isMobile} />
          )}
        </div>

        <div className={`mt-8 ${px}`}>
          <SoldDomains />
        </div>
      </div>
    </div>
  );
};
