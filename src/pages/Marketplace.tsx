import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Navbar } from '@/components/Navbar';
import { DomainListings, type MarketplaceLayout } from '@/components/marketplace/DomainListings';
import { FilterToolbar, type ToolbarGroup, type ToolbarOption, type ToolbarToggle } from '@/components/marketplace/FilterToolbar';
import { DomainQuickViewDialog } from '@/components/domain/DomainQuickViewDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { SoldDomains } from '@/components/sections/SoldDomains';
import { useNotifications } from '@/hooks/useNotifications';
import { useDomainListings, useSoldListings, DOMAIN_LISTINGS_KEY } from '@/hooks/useDomainListings';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { Domain } from '@/types/domain';

import { Button } from '@/components/ui/button';
import { Heart, TrendingUp, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SavedSearches } from '@/components/marketplace/SavedSearches';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';


const getDomainExtension = (domain: string): string => {
  const match = domain.match(/(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?$/);
  return match ? match[0].toLowerCase() : '';
};

const PRICE_CHIPS: ToolbarOption[] = [
  { id: 'all', label: '不限价格' }, { id: 'under5k', label: '5千以下' },
  { id: '5k-20k', label: '5千~2万' }, { id: '20k-100k', label: '2万~10万' },
  { id: 'over100k', label: '10万以上' },
];

const LENGTH_CHIPS: ToolbarOption[] = [
  { id: 'all', label: '不限长度' }, { id: 'xs', label: '≤3' },
  { id: 'sm', label: '4-6' }, { id: 'md', label: '7-10' }, { id: 'lg', label: '>10' },
];

const PRICE_RANGES: Record<string, [number, number]> = {
  under5k: [0, 5000], '5k-20k': [5000, 20000], '20k-100k': [20000, 100000],
  over100k: [100000, Infinity],
};

const LENGTH_RANGES: Record<string, [number, number]> = {
  xs: [0, 3], sm: [4, 6], md: [7, 10], lg: [11, 999],
};

const SORT_OPTIONS: ToolbarOption[] = [
  { id: 'newest', label: '最新上架' }, { id: 'price_asc', label: '价格 ↑' },
  { id: 'price_desc', label: '价格 ↓' }, { id: 'length_asc', label: '短域名优先' },
  { id: 'alphanum', label: '字母数字优先' }, { id: 'name_asc', label: 'A-Z' },
  { id: 'views', label: '最多浏览' },
];

const TLD_GROUPS: ToolbarOption[] = [
  { id: 'all', label: '全部后缀' }, { id: '.com', label: '.com' }, { id: '.net', label: '.net' },
  { id: '.cn', label: '.cn' }, { id: '.io', label: '.io' }, { id: '.ai', label: '.ai' },
  { id: '.app', label: '.app' }, { id: '.org', label: '.org' }, { id: '.co', label: '.co' },
  { id: '.me', label: '.me' },
];

/** 筛选状态在会话内持久化 —— 语言切换 / 重挂载后不会回到默认筛选 */
const FILTERS_STORAGE_KEY = 'marketplace-filters-v2';

type PersistedFilters = {
  searchQuery: string; tldFilter: string; priceChip: string; sortBy: string;
  verifiedOnly: boolean; favoritesOnly: boolean; lengthChip: string; activeTab: string;
};

const DEFAULT_FILTERS: PersistedFilters = {
  searchQuery: '', tldFilter: 'all', priceChip: 'all', sortBy: 'newest',
  verifiedOnly: false, favoritesOnly: false, lengthChip: 'all', activeTab: 'available',
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
  const [activeTab, setActiveTab] = useState<string>(persisted.activeTab);
  const [searchQuery, setSearchQuery] = useState(persisted.searchQuery);
  const [tldFilter, setTldFilter] = useState(persisted.tldFilter);
  const [priceChip, setPriceChip] = useState(persisted.priceChip);
  const [sortBy, setSortBy] = useState<string>(persisted.sortBy);
  const [verifiedOnly, setVerifiedOnly] = useState(persisted.verifiedOnly);
  const [favoritesOnly, setFavoritesOnly] = useState(persisted.favoritesOnly);
  const [lengthChip, setLengthChip] = useState<string>(persisted.lengthChip);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [quickDomain, setQuickDomain] = useState<{ d: Domain; index: number } | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify({
        searchQuery, tldFilter, priceChip, sortBy, verifiedOnly, favoritesOnly, lengthChip, activeTab,
      }));
    } catch {}
  }, [searchQuery, tldFilter, priceChip, sortBy, verifiedOnly, favoritesOnly, lengthChip, activeTab]);

  const layout: MarketplaceLayout = 'magazine';

  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { favoriteSet } = useFavorites();
  const queryClient = useQueryClient();

  const { data: allDomains = [], isLoading, isError, refetch } = useDomainListings();
  const { data: soldDomains = [], isLoading: soldLoading } = useSoldListings();

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
    const pr = PRICE_RANGES[priceChip];
    if (pr) result = result.filter(d => d.price >= pr[0] && d.price < pr[1]);
    if (verifiedOnly) result = result.filter(d => d.is_verified);
    if (favoritesOnly) result = result.filter(d => favoriteSet.has(d.id));
    const lr = LENGTH_RANGES[lengthChip];
    if (lr) result = result.filter(d => {
      const n = domainBase(d.name).length;
      return n >= lr[0] && n <= lr[1];
    });

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
        default:            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });
    return result;
  }, [allDomains, tldFilter, searchQuery, priceChip, verifiedOnly, favoritesOnly, favoriteSet, sortBy, lengthChip]);

  const sortedSold = useMemo(() => {
    return [...soldDomains].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  }, [soldDomains]);

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

  const priceGroups: ToolbarGroup[] = [
    {
      id: 'price', label: '价格', value: priceChip, onChange: setPriceChip, options: PRICE_CHIPS,
    },
    {
      id: 'length', label: '长度', value: lengthChip, onChange: setLengthChip, options: LENGTH_CHIPS,
    },
    {
      id: 'tld', label: '后缀', value: tldFilter, onChange: setTldFilter, options: TLD_GROUPS, mono: true,
    },
  ];

  const toolbarToggles: ToolbarToggle[] = [
    { id: 'verified', label: t('marketplace.ui.verifiedOnlyShort'), active: verifiedOnly, onToggle: () => setVerifiedOnly(v => !v), icon: <TrendingUp className="h-3 w-3" /> },
    {
      id: 'favorites', label: t('marketplace.ui.myFavorites'), active: favoritesOnly, onToggle: toggleFavoritesOnly,
      icon: <Heart className="h-3 w-3" />,
    },
  ];

  const px = isMobile ? 'px-4' : 'page-container';

  // Quick-view navigation across a given list
  const makeOnSelect = (list: Domain[]) => (d: Domain, i: number) => setQuickDomain({ d, index: i });
  const openAtIndex = (i: number) => {
    const list = activeTab === 'sold' ? sortedSold : filteredDomains;
    const d = list[i];
    if (d) setQuickDomain({ d, index: i });
  };
  const quickList = activeTab === 'sold' ? sortedSold : filteredDomains;

  return (
    <div className="min-h-screen bg-background">
      <Navbar unreadCount={unreadCount} />

      <div className={isMobile ? 'pb-24' : 'pb-16'}>

        {/* ── Header: tabs + search toolbar ─────────────────────── */}
        <div className="border-b border-border bg-background sticky top-0 z-20 backdrop-blur-md bg-background/90">
          <div className={px}>
            <div className="flex items-center justify-between gap-3 py-3">
              <div className="inline-flex shrink-0 rounded-full bg-muted/60 p-0.5" role="tablist">
                {[
                  { id: 'available', label: t('marketplace.ui.tabAvailable') },
                  { id: 'sold', label: t('marketplace.ui.tabSold') },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    data-testid={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                      activeTab === tab.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleRefresh}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                title={t('marketplace.ui.refresh')}
                data-testid="button-refresh-domains"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>
              </button>
            </div>

            <FilterToolbar
              search={searchQuery}
              onSearch={setSearchQuery}
              searchPlaceholder={t('marketplace.searchPlaceholder')}
              sortValue={sortBy}
              onSortChange={setSortBy}
              sortOptions={SORT_OPTIONS}
              groups={priceGroups}
              toggles={toolbarToggles}
              view={view}
              onViewChange={setView}
              onClear={clearAll}
              filterLabel={t('marketplace.ui.filterLabel')}
              clearLabel={t('marketplace.ui.clearFilters')}
              className="pb-3"
            />
          </div>
        </div>

        {/* ── Count + saved searches ────────────────────────────── */}
        {!isLoading && (
          <div className={cn(px, 'flex items-center justify-between py-3 gap-3 flex-wrap')}>
            <p className="text-sm text-muted-foreground" data-testid="text-domain-count">
              <span className="font-semibold text-foreground">
                {activeTab === 'sold'
                  ? t('marketplace.ui.soldCount', { count: sortedSold.length })
                  : t('marketplace.ui.countLabel', { count: filteredDomains.length })}
              </span>
              {activeTab === 'available' && filteredDomains.length !== allDomains.length && (
                <span className="ml-1 text-xs text-muted-foreground/60">/ {allDomains.length}</span>
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
          </div>
        )}

        {/* ── Content ───────────────────────────────────────────── */}
        {activeTab === 'available' && (
        <div className={px}>
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
              onSelect={makeOnSelect(filteredDomains)}
            />
          )}
        </div>
        )}

        {activeTab === 'sold' && (
          soldLoading ? (
            <div className={px}>
              <DomainListings isLoading domains={[]} isMobile={isMobile} layout={layout} view="grid" />
            </div>
          ) : sortedSold.length === 0 ? (
            <div className={cn(px, 'text-center py-20')}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Trophy className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('marketplace.ui.noSoldTitle')}</h3>
              <p className="text-muted-foreground text-sm">{t('marketplace.ui.noSoldDesc')}</p>
            </div>

          ) : (
            <SoldDomains onSelect={makeOnSelect(sortedSold)} grid title={t('marketplace.ui.soldTitle')} />
          )
        )}

        {/* ── Quick view dialog ─────────────────────────────────── */}
        <DomainQuickViewDialog
          open={!!quickDomain}
          onClose={() => setQuickDomain(null)}
          domain={quickDomain?.d.name ?? ''}
          domainId={quickDomain?.d.id}
          sellerId={quickDomain?.d.owner_id}
          price={typeof quickDomain?.d.price === 'number' ? quickDomain.d.price : undefined}
          currency={quickDomain?.d.currency}
          isSold={activeTab === 'sold'}
          onPrev={() => quickDomain && openAtIndex(quickDomain.index - 1)}
          onNext={() => quickDomain && openAtIndex(quickDomain.index + 1)}
          hasPrev={!!quickDomain && quickDomain.index > 0}
          hasNext={!!quickDomain && quickDomain.index < quickList.length - 1}
        />

      </div>
    </div>
  );
};

export default Marketplace;
