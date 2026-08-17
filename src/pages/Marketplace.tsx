import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

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
import { SavedSearches } from '@/components/marketplace/SavedSearches';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';


const getDomainExtension = (domain: string): string => {
  const match = domain.match(/(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?$/);
  return match ? match[0].toLowerCase() : '';
};

const TLD_FILTERS = [
  { id: 'all', labelKey: 'marketplace.ui.tldAll' },
  { id: '.com', labelKey: null },
  { id: '.net', labelKey: null },
  { id: '.cn', labelKey: null },
  { id: '.io', labelKey: null },
  { id: '.ai', labelKey: null },
  { id: '.app', labelKey: null },
  { id: '.org', labelKey: null },
  { id: '.co', labelKey: null },
  { id: '.me', labelKey: null },
];

const PRICE_CHIPS = [
  { id: 'all', labelKey: 'marketplace.ui.priceChips.all', min: 0, max: Infinity },
  { id: 'under5k', labelKey: 'marketplace.ui.priceChips.under5k', min: 0, max: 5000 },
  { id: '5k-20k', labelKey: 'marketplace.ui.priceChips.mid1', min: 5000, max: 20000 },
  { id: '20k-100k', labelKey: 'marketplace.ui.priceChips.mid2', min: 20000, max: 100000 },
  { id: 'over100k', labelKey: 'marketplace.ui.priceChips.over100k', min: 100000, max: Infinity },
];

const LENGTH_CHIPS = [
  { id: 'all',   labelKey: 'marketplace.ui.lengthChips.all', test: (_n: number) => true },
  { id: 'xs',    labelKey: 'marketplace.ui.lengthChips.xs',  test: (n: number) => n <= 3 },
  { id: 'sm',    labelKey: 'marketplace.ui.lengthChips.sm',  test: (n: number) => n >= 4 && n <= 6 },
  { id: 'md',    labelKey: 'marketplace.ui.lengthChips.md',  test: (n: number) => n >= 7 && n <= 10 },
  { id: 'lg',    labelKey: 'marketplace.ui.lengthChips.lg',  test: (n: number) => n > 10 },
] as const;

const SORT_OPTIONS = [
  { id: 'newest',     labelKey: 'marketplace.ui.sortOptions.newest',    icon: null },
  { id: 'price_asc',  labelKey: 'marketplace.ui.sortOptions.priceAsc',  icon: null },
  { id: 'price_desc', labelKey: 'marketplace.ui.sortOptions.priceDesc', icon: null },
  { id: 'length_asc', labelKey: 'marketplace.ui.sortOptions.lengthAsc', icon: Ruler },
  { id: 'alphanum',   labelKey: 'marketplace.ui.sortOptions.alphanum',  icon: Hash },
  { id: 'name_asc',   labelKey: 'marketplace.ui.sortOptions.nameAsc',   icon: ArrowDownAZ },
  { id: 'views',      labelKey: 'marketplace.ui.sortOptions.views',     icon: null },
] as const;

/** 筛选状态在会话内持久化 —— 语言切换 / 重挂载后不会回到默认筛选 */
const FILTERS_STORAGE_KEY = 'marketplace-filters-v1';

type PersistedFilters = {
  searchQuery: string;
  tldFilter: string;
  priceChip: string;
  sortBy: string;
  verifiedOnly: boolean;
  favoritesOnly: boolean;
  lengthChip: string;
};

const DEFAULT_FILTERS: PersistedFilters = {
  searchQuery: '', tldFilter: 'all', priceChip: 'all', sortBy: 'newest',
  verifiedOnly: false, favoritesOnly: false, lengthChip: 'all',
};

const readPersistedFilters = (): PersistedFilters => {
  try {
    const raw = sessionStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return DEFAULT_FILTERS;
    return { ...DEFAULT_FILTERS, ...(JSON.parse(raw) as Partial<PersistedFilters>) };
  } catch {
    return DEFAULT_FILTERS;
  }
};


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
  const { t } = useTranslation();
  const persisted = useRef<PersistedFilters>(readPersistedFilters()).current;
  const [searchQuery, setSearchQuery] = useState(persisted.searchQuery);
  const [tldFilter, setTldFilter] = useState(persisted.tldFilter);
  const [priceChip, setPriceChip] = useState(persisted.priceChip);
  const [sortBy, setSortBy] = useState<string>(persisted.sortBy);
  const [verifiedOnly, setVerifiedOnly] = useState(persisted.verifiedOnly);
  const [favoritesOnly, setFavoritesOnly] = useState(persisted.favoritesOnly);
  const [lengthChip, setLengthChip] = useState<string>(persisted.lengthChip);
  const [view, setView] = useState<'grid' | 'list'>(() => {
    try { return (localStorage.getItem('marketplace-view') as 'grid' | 'list') || 'grid'; } catch { return 'grid'; }
  });
  useEffect(() => { try { localStorage.setItem('marketplace-view', view); } catch {} }, [view]);

  // 持久化筛选条件（会话级），语言切换或组件重挂载都能恢复
  useEffect(() => {
    try {
      sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify({
        searchQuery, tldFilter, priceChip, sortBy, verifiedOnly, favoritesOnly, lengthChip,
      }));
    } catch {}
  }, [searchQuery, tldFilter, priceChip, sortBy, verifiedOnly, favoritesOnly, lengthChip]);
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
    if (!user) { toast.error(t('marketplace.ui.loginToFilterFavorites')); return; }
    setFavoritesOnly(v => !v);
  };

  // Drawer preview removed — cards now navigate directly to the domain detail page.

  const px = isMobile ? 'px-4' : 'page-container';

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
                  placeholder={t('marketplace.searchPlaceholder')}
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
                    ? 'bg-destructive/10 text-destructive border border-destructive/40'
                    : 'bg-muted/40 text-muted-foreground border border-border hover:text-foreground'
                }`}
                title={favoritesOnly ? t('marketplace.ui.showAll') : t('marketplace.ui.favoritesOnlyTitle')}
              >
                <Heart className={`h-3.5 w-3.5 ${favoritesOnly ? 'fill-current' : ''}`} />
                {!isMobile && t('marketplace.ui.myFavorites')}
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
                  {tld.labelKey ? t(tld.labelKey) : tld.id}
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
                  {t(chip.labelKey)}
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
                  {t(chip.labelKey)}
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
                    {t(opt.labelKey)}
                  </button>
                );
              })}
              <div className="ml-auto flex items-center gap-1 shrink-0">
                <div className="inline-flex bg-muted/40 rounded-md p-0.5" role="tablist" aria-label={t('marketplace.ui.viewLabel')}>
                  <button
                    type="button"
                    onClick={() => setView('grid')}
                    data-testid="view-grid"
                    title={t('marketplace.ui.gridView')}
                    className={`h-6 w-7 flex items-center justify-center rounded ${view === 'grid' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    data-testid="view-list"
                    title={t('marketplace.ui.listView')}
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
                    title={t('marketplace.ui.clearFilters')}
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
                <span className="font-semibold text-foreground">{t('marketplace.ui.countLabel', { count: filteredDomains.length })}</span>
                {filteredDomains.length !== allDomains.length && (
                  <span className="ml-1 text-xs text-muted-foreground/60">/ {allDomains.length}</span>
                )}
                {favoritesOnly && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-destructive font-medium">
                    <Heart className="h-2.5 w-2.5 fill-current" />{t('marketplace.ui.favOnlyBadge')}
                  </span>
                )}
              </p>
              <div className="flex-1 min-w-0">
                <SavedSearches
                  currentQuery={searchQuery}
                  currentFilters={{ tld: tldFilter, price: priceChip, length: lengthChip, verifiedOnly, favoritesOnly, sortBy }}
                  onApply={(q, f) => {
                    setSearchQuery(q || '');
                    if (f.tld) setTldFilter(f.tld);
                    if (f.price) setPriceChip(f.price);
                    if (f.length) setLengthChip(f.length);
                    if (typeof f.verifiedOnly === 'boolean') setVerifiedOnly(f.verifiedOnly);
                    if (typeof f.favoritesOnly === 'boolean') setFavoritesOnly(f.favoritesOnly);
                    if (f.sortBy) setSortBy(f.sortBy);
                  }}
                />
              </div>
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
                  {t('marketplace.ui.verifiedOnlyShort')}
                </button>
                <button
                  onClick={handleRefresh}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  title={t('marketplace.ui.refresh')}
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
              <p className="text-muted-foreground mb-4">{t('marketplace.ui.loadErrorRetry')}</p>
              <Button onClick={() => refetch()} variant="outline" size="sm">{t('marketplace.ui.reload')}</Button>
            </div>
          ) : isLoading ? (
            <DomainListings isLoading domains={[]} isMobile={isMobile} layout={layout} view={view} />
          ) : filteredDomains.length === 0 && allDomains.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">{t('marketplace.ui.emptyTitle')}</h3>
              <p className="text-muted-foreground text-sm mb-4">{t('marketplace.ui.emptyDesc')}</p>
              <Button asChild size="sm"><Link to="/dashboard">{t('marketplace.ui.listDomain')}</Link></Button>
            </div>
          ) : filteredDomains.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🤔</div>
              <h3 className="text-lg font-semibold mb-2">{t('marketplace.ui.noMatchTitle')}</h3>
              <p className="text-muted-foreground text-sm mb-4">{t('marketplace.ui.noMatchDesc')}</p>
              <Button onClick={clearAll} variant="outline" size="sm">{t('marketplace.ui.clearFilters')}</Button>
            </div>
          ) : (
            <DomainListings
              isLoading={false}
              domains={filteredDomains}
              isMobile={isMobile}
              layout={layout}
              view={view}
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
