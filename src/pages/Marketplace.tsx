import { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { DomainListings } from '@/components/marketplace/DomainListings';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';

import { SkeletonCardGrid } from '@/components/common/SkeletonCard';
import { SoldDomains } from '@/components/sections/SoldDomains';
import { useNotifications } from '@/hooks/useNotifications';
import { useDomainListings } from '@/hooks/useDomainListings';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, ArrowUpDown, TrendingUp, Clock, Eye, Star, Flame, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DOMAIN_LISTINGS_KEY } from '@/hooks/useDomainListings';

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
  { id: 'newest', label: '最新上架', icon: Clock },
  { id: 'price_asc', label: '价格↑', icon: ArrowUpDown },
  { id: 'price_desc', label: '价格↓', icon: ArrowUpDown },
  { id: 'views', label: '最多浏览', icon: Eye },
];

export const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tldFilter, setTldFilter] = useState('all');
  const [priceChip, setPriceChip] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const { unreadCount } = useNotifications();
  const queryClient = useQueryClient();

  // ── React Query — cached, parallel fetch, no waterfall ──────
  const { data: allDomains = [], isLoading, isError, refetch } = useDomainListings();

  // Read search param from URL on mount
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
      result = result.filter(d => getDomainExtension(d.name) === tldFilter || getDomainExtension(d.name).endsWith(tldFilter));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(d => d.name?.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q));
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
    setTldFilter('all'); setPriceChip('all'); setSortBy('newest'); setVerifiedOnly(false); setSearchQuery('');
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: DOMAIN_LISTINGS_KEY });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar unreadCount={unreadCount} />

      <div className={isMobile ? 'pb-20' : ''}>
        {/* Hero Header */}
        <section className={`bg-primary text-primary-foreground ${isMobile ? 'py-8 px-4' : 'py-14'}`}>
          <div className={isMobile ? '' : 'max-w-6xl mx-auto px-6'}>
            <div className="text-center">
              <h1 className={`${isMobile ? 'text-2xl mb-2' : 'text-3xl mb-3'} font-bold`}>
                {t('marketplace.title')}
              </h1>
              <p className={`${isMobile ? 'text-sm mb-5' : 'text-base mb-8'} opacity-70`}>
                {t('marketplace.subtitle')}
              </p>
              <div className="max-w-xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
                  <Input
                    type="text"
                    placeholder={t('marketplace.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-11 pl-11 pr-4 bg-background text-foreground border-border rounded-lg"
                    data-testid="input-search-marketplace"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TLD Filter Row */}
        <section className="border-b border-border bg-card">
          <div className={isMobile ? 'px-3 py-2.5' : 'max-w-6xl mx-auto px-6 py-2.5'}>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {TLD_FILTERS.map(tld => (
                <button
                  key={tld.id}
                  data-testid={`filter-tld-${tld.id}`}
                  onClick={() => setTldFilter(tld.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                    tldFilter === tld.id ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {tld.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Price + Sort Bar */}
        <section className="border-b border-border bg-background/60 backdrop-blur-sm sticky top-0 z-10">
          <div className={isMobile ? 'px-3 py-2.5' : 'max-w-6xl mx-auto px-6 py-2.5'}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                {PRICE_CHIPS.map(chip => (
                  <button
                    key={chip.id}
                    data-testid={`filter-price-${chip.id}`}
                    onClick={() => setPriceChip(chip.id)}
                    className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors shrink-0 ${
                      priceChip === chip.id ? 'bg-primary text-primary-foreground font-medium' : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    data-testid={`sort-${opt.id}`}
                    onClick={() => setSortBy(opt.id)}
                    className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                      sortBy === opt.id ? 'bg-foreground text-background font-medium' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                {hasActiveFilters && (
                  <button onClick={clearAll} className="ml-1 text-muted-foreground hover:text-foreground" data-testid="button-clear-filters">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className={isMobile ? 'px-3 pt-5 pb-6' : 'max-w-6xl mx-auto px-6 pt-8 pb-12'}>

          {/* Featured Domains */}
          {!isLoading && featuredDomains.length > 0 && tldFilter === 'all' && priceChip === 'all' && !searchQuery && (
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-bold">精选推荐</h2>
                <Badge variant="secondary" className="text-xs">HOT</Badge>
              </div>
              <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {featuredDomains.map(domain => (
                  <Link
                    key={domain.id}
                    to={`/domain/${domain.id}`}
                    data-testid={`featured-domain-${domain.id}`}
                    className="group block rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 dark:border-orange-900/40 p-4 hover:shadow-md transition-all hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-xs font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />精选
                      </div>
                      {domain.is_verified && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 border-green-400 text-green-600">已验证</Badge>
                      )}
                    </div>
                    <p className="font-bold text-foreground group-hover:text-primary transition-colors truncate">{domain.name}</p>
                    {domain.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{domain.description}</p>
                    )}
                    <p className="mt-2 font-semibold text-primary text-sm">
                      {domain.price > 0 ? `¥${domain.price.toLocaleString()}` : '面议'}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Result count + verified toggle */}
          {!isLoading && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground" data-testid="text-domain-count">
                共 <span className="font-semibold text-foreground">{filteredDomains.length}</span> 个域名
                {filteredDomains.length !== allDomains.length && (
                  <span className="ml-1 text-xs">(共 {allDomains.length} 个)</span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <button
                  data-testid="toggle-verified-only"
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors ${
                    verifiedOnly ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <TrendingUp className="h-3 w-3" />仅已验证
                </button>
                <button
                  onClick={handleRefresh}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="刷新数据"
                  data-testid="button-refresh-domains"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Domain Listings */}
          {isError ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">加载域名失败，请重试</p>
              <Button onClick={() => refetch()} variant="outline" size="sm">重新加载</Button>
            </div>
          ) : isLoading ? (
            <SkeletonCardGrid count={isMobile ? 6 : 9} />
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

        <SoldDomains />
      </div>

      
    </div>
  );
};
