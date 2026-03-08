import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navbar } from '@/components/Navbar';
import { DomainListings } from '@/components/marketplace/DomainListings';
import { AdvancedFilters, AdvancedFiltersState } from '@/components/marketplace/AdvancedFilters';
import { Domain } from '@/types/domain';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { SkeletonCardGrid } from '@/components/common/SkeletonCard';
import { SoldDomains } from '@/components/sections/SoldDomains';
import { useNotifications } from '@/hooks/useNotifications';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, SlidersHorizontal, X } from 'lucide-react';

const getDomainNameWithoutExtension = (domain: string): string => {
  const lastDot = domain.lastIndexOf('.');
  if (lastDot === -1) return domain;
  return domain.substring(0, lastDot);
};

const getDomainExtension = (domain: string): string => {
  const match = domain.match(/(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?$/);
  return match ? match[0].toLowerCase() : '';
};

export const Marketplace = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<{min: string, max: string}>({min: '', max: ''});
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({
    priceMin: '',
    priceMax: '',
    lengthMin: '',
    lengthMax: '',
    extensions: [],
    verifiedOnly: false,
    category: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const { unreadCount } = useNotifications();

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.priceMin) count++;
    if (advancedFilters.priceMax) count++;
    if (advancedFilters.lengthMin) count++;
    if (advancedFilters.lengthMax) count++;
    if (advancedFilters.extensions.length > 0) count++;
    if (advancedFilters.verifiedOnly) count++;
    if (advancedFilters.category !== 'all') count++;
    if (priceRange.min) count++;
    if (priceRange.max) count++;
    if (verifiedOnly) count++;
    if (filter !== 'all') count++;
    return count;
  }, [advancedFilters, priceRange, verifiedOnly, filter]);

  const categoryFilters = [
    { id: 'all', label: t('marketplace.filters.all') },
    { id: 'premium', label: t('marketplace.filters.premium') },
    { id: 'short', label: t('marketplace.filters.short') },
    { id: 'business', label: t('marketplace.filters.business') },
    { id: 'tech', label: t('marketplace.filters.tech') }
  ];

  const loadDomains = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: listingsData, error: listingsError } = await supabase
        .from('domain_listings')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (listingsError) throw new Error(`加载域名列表失败: ${listingsError.message}`);
      
      if (!listingsData || listingsData.length === 0) {
        setDomains([]);
        return;
      }
      
      const domainIds = listingsData.map(domain => domain.id);
      const { data: analyticsData } = await supabase
        .from('domain_analytics')
        .select('domain_id, views, favorites, offers')
        .in('domain_id', domainIds);
      
      const analyticsMap = new Map();
      analyticsData?.forEach(item => analyticsMap.set(item.domain_id, item));
      
      const processedDomains: Domain[] = listingsData.map(domain => {
        const analytics = analyticsMap.get(domain.id);
        let viewsValue = 0;
        if (analytics?.views) {
          viewsValue = typeof analytics.views === 'number' ? analytics.views : parseInt(String(analytics.views), 10) || 0;
        }
        
        return {
          id: domain.id,
          name: domain.name || '',
          price: Number(domain.price) || 0,
          category: domain.category || 'standard',
          description: domain.description || '',
          status: domain.status || 'available',
          highlight: Boolean(domain.highlight),
          owner_id: domain.owner_id || '',
          created_at: domain.created_at || new Date().toISOString(),
          is_verified: Boolean(domain.is_verified),
          verification_status: domain.verification_status || 'pending',
          views: viewsValue
        };
      });
      
      processedDomains.sort((a, b) => {
        if (a.is_verified !== b.is_verified) return b.is_verified ? 1 : -1;
        const viewsDiff = (b.views || 0) - (a.views || 0);
        if (viewsDiff !== 0) return viewsDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      setDomains(processedDomains);
    } catch (error: any) {
      const errorMessage = error.message || '加载域名列表失败，请刷新页面重试';
      setError(errorMessage);
      toast.error(errorMessage);
      setDomains([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) setSearchQuery(searchParam);
    const timer = setTimeout(() => loadDomains(), 100);
    return () => clearTimeout(timer);
  }, [loadDomains]);

  useEffect(() => {
    const channel = supabase
      .channel('domain_listings_public')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'domain_listings' }, () => loadDomains())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadDomains]);

  const filteredDomains = useMemo(() => {
    let result = [...domains];
    if (filter !== 'all') result = result.filter(d => d.category === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(d => d.name?.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q));
    }
    if (priceRange.min) { const v = parseFloat(priceRange.min); if (!isNaN(v)) result = result.filter(d => d.price >= v); }
    if (priceRange.max) { const v = parseFloat(priceRange.max); if (!isNaN(v)) result = result.filter(d => d.price <= v); }
    if (verifiedOnly) result = result.filter(d => d.is_verified);
    if (advancedFilters.priceMin) { const v = parseFloat(advancedFilters.priceMin); if (!isNaN(v)) result = result.filter(d => d.price >= v); }
    if (advancedFilters.priceMax) { const v = parseFloat(advancedFilters.priceMax); if (!isNaN(v)) result = result.filter(d => d.price <= v); }
    if (advancedFilters.lengthMin) { const v = parseInt(advancedFilters.lengthMin); if (!isNaN(v)) result = result.filter(d => getDomainNameWithoutExtension(d.name).length >= v); }
    if (advancedFilters.lengthMax) { const v = parseInt(advancedFilters.lengthMax); if (!isNaN(v)) result = result.filter(d => getDomainNameWithoutExtension(d.name).length <= v); }
    if (advancedFilters.extensions.length > 0) result = result.filter(d => { const ext = getDomainExtension(d.name); return advancedFilters.extensions.some(e => ext.endsWith(e.toLowerCase())); });
    if (advancedFilters.category !== 'all') result = result.filter(d => d.category === advancedFilters.category);
    if (advancedFilters.verifiedOnly) result = result.filter(d => d.is_verified);

    result.sort((a, b) => {
      const order = advancedFilters.sortOrder === 'asc' ? 1 : -1;
      switch (advancedFilters.sortBy) {
        case 'price': return (a.price - b.price) * order;
        case 'name': return a.name.localeCompare(b.name) * order;
        case 'views': return ((a.views || 0) - (b.views || 0)) * order;
        default: return (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) * order;
      }
    });
    return result;
  }, [domains, filter, searchQuery, priceRange, verifiedOnly, advancedFilters]);

  const clearAllFilters = () => {
    setFilter('all');
    setSearchQuery('');
    setPriceRange({ min: '', max: '' });
    setVerifiedOnly(false);
    setAdvancedFilters({
      priceMin: '', priceMax: '', lengthMin: '', lengthMax: '',
      extensions: [], verifiedOnly: false, category: 'all', sortBy: 'created_at', sortOrder: 'desc',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar unreadCount={unreadCount} />
      
      <div className={isMobile ? 'pb-20' : ''}>
        {/* Hero Header */}
        <section className={`bg-primary text-primary-foreground ${isMobile ? 'py-8 px-4' : 'py-14'}`}>
          <div className={`${isMobile ? '' : 'max-w-6xl mx-auto px-6'}`}>
            <div className="text-center">
              <h1 className={`${isMobile ? 'text-2xl mb-2' : 'text-3xl mb-3'} font-bold`}>
                {t('marketplace.title')}
              </h1>
              <p className={`${isMobile ? 'text-sm mb-5' : 'text-base mb-8'} opacity-70`}>
                {t('marketplace.subtitle')}
              </p>
              
              {/* Search Bar */}
              <div className="max-w-lg mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t('marketplace.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-11 pl-11 pr-4 bg-background text-foreground border-border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filters Bar */}
        <section className="border-b border-border bg-card">
          <div className={`${isMobile ? 'px-3 py-3' : 'max-w-6xl mx-auto px-6 py-3'}`}>
            <div className="flex items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {categoryFilters.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      filter === cat.id
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Filter Toggle */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    showFilters || activeFiltersCount > 0
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  筛选
                  {activeFiltersCount > 0 && (
                    <span className="bg-background text-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
                {activeFiltersCount > 0 && (
                  <button onClick={clearAllFilters} className="text-xs text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Expandable Filter Panel */}
            {showFilters && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-3`}>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">最低价格 ($)</label>
                    <Input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                      placeholder="最低"
                      className="h-8 text-xs"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">最高价格 ($)</label>
                    <Input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                      placeholder="最高"
                      className="h-8 text-xs"
                      min="0"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="verified-filter"
                        checked={verifiedOnly}
                        onCheckedChange={setVerifiedOnly}
                      />
                      <Label htmlFor="verified-filter" className="text-xs">仅已验证</Label>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <AdvancedFilters
                      filters={advancedFilters}
                      onFiltersChange={setAdvancedFilters}
                      activeFiltersCount={activeFiltersCount}
                      isMobile={isMobile}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Domain Listings */}
        <section className={`${isMobile ? 'py-6 px-3' : 'py-10'}`}>
          <div className={`${isMobile ? '' : 'max-w-6xl mx-auto px-6'}`}>
            {error ? (
              <div className="text-center py-16">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => { setError(null); loadDomains(); }} variant="outline" size="sm">
                  重新加载
                </Button>
              </div>
            ) : isLoading ? (
              <SkeletonCardGrid count={isMobile ? 6 : 9} />
            ) : (
              <>
                <DomainListings 
                  isLoading={isLoading} 
                  domains={filteredDomains}
                  isMobile={isMobile}
                />
                
                {!isLoading && filteredDomains.length === 0 && domains.length === 0 && !error && (
                  <div className="text-center py-16">
                    <h3 className="text-lg font-semibold mb-2">暂无域名列表</h3>
                    <p className="text-muted-foreground mb-4">看起来还没有域名添加到市场中</p>
                    <Button onClick={loadDomains} variant="outline" size="sm">重新加载</Button>
                  </div>
                )}
                
                {!isLoading && filteredDomains.length === 0 && domains.length > 0 && !error && (
                  <div className="text-center py-16">
                    <h3 className="text-lg font-semibold mb-2">没有找到匹配的域名</h3>
                    <p className="text-muted-foreground">请尝试调整搜索条件或筛选器</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <SoldDomains />
      </div>

      {isMobile && <BottomNavigation unreadCount={unreadCount} />}
    </div>
  );
};
