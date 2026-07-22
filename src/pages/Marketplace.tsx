import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { DomainListings, type MarketplaceLayout } from '@/components/marketplace/DomainListings';
import { useIsMobile } from '@/hooks/use-mobile';
import { SoldDomains } from '@/components/sections/SoldDomains';
import { useNotifications } from '@/hooks/useNotifications';
import { useDomainListings, DOMAIN_LISTINGS_KEY } from '@/hooks/useDomainListings';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search, X, TrendingUp, RefreshCw, Heart, ArrowDownAZ, Ruler, Hash,
  LayoutGrid, List as ListIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';


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

const LENGTH_CHIPS = [
  { id: 'all',   label: '不限长度', test: (_n: number) => true },
  { id: 'xs',    label: '超短 ≤3',  test: (n: number) => n <= 3 },
  { id: 'sm',    label: '短 4-6',   test: (n: number) => n >= 4 && n <= 6 },
  { id: 'md',    label: '中 7-10',  test: (n: number) => n >= 7 && n <= 10 },
  { id: 'lg',    label: '长 >10',   test: (n: number) => n > 10 },
] as const;

const SORT_OPTIONS = [
  { id: 'newest',        label: '最新上架',    icon: null },
  { id: 'price_asc',     label: '价格 ↑',       icon: null },
  { id: 'price_desc',    label: '价格 ↓',       icon: null },
  { id: 'length_asc',    label: '短域名优先',   icon: Ruler },
  { id: 'alphanum',      label: '字母数字优先', icon: Hash },
  { id: 'name_asc',      label: 'A-Z',         icon: ArrowDownAZ },
  { id: 'views',         label: '最多浏览',     icon: null },
] as const;

// Basename before the TLD, e.g. "test.com" → "test"
const domainBase = (name: string) => {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(0, i) : name;
};

// Alphanumeric-priority key: pure numeric first, then short letters+digits, then longer.
const alphanumScore = (name: string) => {
  const base = domainBase(name).toLowerCase();
  const isAlnum = /^[a-z0-9]+$/.test(base);
  const hasDigit = /\d/.test(base);
  const rank = !isAlnum ? 3 : (/^\d+$/.test(base) ? 0 : (hasDigit ? 1 : 2));
  return rank * 1000 + base.length;
};

export const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tldFilter, setTldFilter] = useState('all');
  const [priceChip, setPriceChip] = useState('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [lengthChip, setLengthChip] = useState<string>('all');
  const [view, setView] = useState<'grid' | 'list'>(() => {
    try { return (localStorage.getItem('marketplace-view') as 'grid' | 'list') || 'grid'; } catch { return 'grid'; }
  });
  useEffect(() => { try { localStorage.setItem('marketplace-view', view); } catch {} }, [view]);
  // Layout kept for backwards compat; hero row is enabled by default via 'magazine'.
  const layout: MarketplaceLayout = 'magazine';

  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { favoriteSet } = useFavorites();
  const queryClient = useQueryClient();

  const { data: allDomains = [], isLoading, isError, refetch } = useDomainListings();

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('search');
    if (s) setSearchQuery(s);
    const fav = new URLSearchParams(window.location.search).get('fav');
    if (fav === '1') setFavoritesOnly(true);
  }, []);

  const filteredDomains = useMemo(() => {
    let result = [...allDomains];
    if (tldFilter !== 'all') {
      result = result.filter(d =>
        getDomainExtension(d.name) === tldFilter ||
        getDomainExtension(d.name).endsWith(tldFilter)
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(d =>
        d.name?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q)
      );
    }
    const pc = PRICE_CHIPS.find(p => p.id === priceChip);
    if (pc && pc.id !== 'all') {
      result = result.filter(d => d.price >= pc.min && d.price <= pc.max);
    }
    if (verifiedOnly) result = result.filter(d => d.is_verified);
    if (favoritesOnly) result = result.filter(d => favoriteSet.has(d.id));
    const lc = LENGTH_CHIPS.find(l => l.id === lengthChip);
    if (lc && lc.id !== 'all') {
      result = result.filter(d => lc.test(domainBase(d.name).length));
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':   return a.price - b.price;
        case 'price_desc':  return b.price - a.price;
        case 'length_asc':  return domainBase(a.name).length - domainBase(b.name).length
                                 || a.name.localeCompare(b.name);
        case 'alphanum':    return alphanumScore(a.name) - alphanumScore(b.name)
                                 || a.name.localeCompare(b.name);
        case 'name_asc':    return a.name.localeCompare(b.name);
        case 'views':       return (b.views || 0) - (a.views || 0);
        default:            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return result;
  }, [allDomains, tldFilter, searchQuery, priceChip, verifiedOnly, favoritesOnly, favoriteSet, sortBy, lengthChip]);

  const hasActiveFilters =
    tldFilter !== 'all' || priceChip !== 'all' || verifiedOnly || favoritesOnly ||
    sortBy !== 'newest' || !!searchQuery.trim() || lengthChip !== 'all';

  const clearAll = () => {
    setTldFilter('all'); setPriceChip('all'); setSortBy('newest');
    setVerifiedOnly(false); setFavoritesOnly(false); setSearchQuery('');
    setLengthChip('all');
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: DOMAIN_LISTINGS_KEY });
  };

  const toggleFavoritesOnly = () => {
    if (!user) { toast.error('请先登录后再筛选收藏'); return; }
    setFavoritesOnly(v => !v);
  };

  // Drawer preview removed — cards now navigate directly to the domain detail page.

  const px = isMobile ? 'px-4' : 'max-w-7xl mx-auto px-6';

  return (
    <div className="min-h-screen bg-background">
      <Navbar unreadCount={unreadCount} />

      <div className={isMobile ? 'pb-24' : 'pb-16'}>

        {/* ── Search bar ─────────────────────────────────────── */}
        <div className="border-b border-border bg-background">
          <div className={`${px} py-3`}>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
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
              <button
                onClick={toggleFavoritesOnly}
                data-testid="toggle-favorites-only"
                className={`h-10 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 ${
                  favoritesOnly
                    ? 'bg-red-500/10 text-red-500 border border-red-500/40'
                    : 'bg-muted/40 text-muted-foreground border border-border hover:text-foreground'
                }`}
                title={favoritesOnly ? '显示全部' : '仅显示我的收藏'}
              >
                <Heart className={`h-3.5 w-3.5 ${favoritesOnly ? 'fill-current' : ''}`} />
                {!isMobile && '我的收藏'}
              </button>
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
            {/* Row 1b: Length chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-2 border-b border-border/50">
              {LENGTH_CHIPS.map(chip => (
                <button
                  key={chip.id}
                  data-testid={`filter-length-${chip.id}`}
                  onClick={() => setLengthChip(chip.id)}
                  className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors shrink-0 ${
                    lengthChip === chip.id
                      ? 'bg-foreground text-background font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            {/* Row 2: Sort options */}
            <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
              {SORT_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const active = sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    data-testid={`sort-${opt.id}`}
                    onClick={() => setSortBy(opt.id)}
                    className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors inline-flex items-center gap-1 shrink-0 ${
                      active
                        ? 'bg-foreground text-background font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {Icon && <Icon className="h-3 w-3" />}
                    {opt.label}
                  </button>
                );
              })}
              <div className="ml-auto flex items-center gap-1 shrink-0">
                <div className="inline-flex bg-muted/40 rounded-md p-0.5" role="tablist" aria-label="视图">
                  <button
                    type="button"
                    onClick={() => setView('grid')}
                    data-testid="view-grid"
                    title="网格视图"
                    className={`h-6 w-7 flex items-center justify-center rounded ${view === 'grid' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    data-testid="view-list"
                    title="列表视图"
                    className={`h-6 w-7 flex items-center justify-center rounded ${view === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <ListIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearAll}
                    className="p-1 text-muted-foreground hover:text-foreground rounded"
                    data-testid="button-clear-filters"
                    title="清空筛选"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Content ────────────────────────────────────── */}
        <div className={px}>

          {/* Count + verified toggle */}
          {!isLoading && (
            <div className="flex items-center justify-between py-3 gap-3 flex-wrap">
              <p className="text-sm text-muted-foreground" data-testid="text-domain-count">
                共 <span className="font-semibold text-foreground">{filteredDomains.length}</span> 个域名
                {filteredDomains.length !== allDomains.length && (
                  <span className="ml-1 text-xs text-muted-foreground/60">/ {allDomains.length}</span>
                )}
                {favoritesOnly && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-red-500 font-medium">
                    <Heart className="h-2.5 w-2.5 fill-current" />仅收藏
                  </span>
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
            <DomainListings isLoading domains={[]} isMobile={isMobile} layout={layout} />
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
            <DomainListings
              isLoading={false}
              domains={filteredDomains}
              isMobile={isMobile}
              layout={layout}
            />
          )}
        </div>

        <div className={`mt-8 ${px}`}>
          <SoldDomains />
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
