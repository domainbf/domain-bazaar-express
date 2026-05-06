import { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DomainCard } from '@/components/DomainCard';
import { Search, TrendingUp, Calculator, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/sections/HeroSection';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { fallbackDomains } from '@/data/availableDomains';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'framer-motion';

import { useNotifications } from '@/hooks/useNotifications';
import { HomeDomainItem, useHomeData } from '@/hooks/useHomeData';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { SkeletonCardGrid } from '@/components/common/SkeletonCard';

import { Footer } from '@/components/sections/Footer';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { DealsShowcaseSection } from '@/components/sections/DealsShowcaseSection';
import { DomainQuickViewDialog } from '@/components/domain/DomainQuickViewDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

const DomainEstimator = lazy(() => import('@/components/tools/DomainEstimator').then(m => ({ default: m.DomainEstimator })));
const DomainMonitor = lazy(() => import('@/components/tools/DomainMonitor').then(m => ({ default: m.DomainMonitor })));
const SoldDomains = lazy(() => import('@/components/sections/SoldDomains').then(m => ({ default: m.SoldDomains })));
const SupportSection = lazy(() => import('@/components/sections/SupportSection'));

const FALLBACK_DOMAINS: HomeDomainItem[] = fallbackDomains.slice(0, 9).map((d, i) => ({
  id: `fallback-${i}`,
  name: d.name,
  price: parseInt(d.price),
  category: d.category,
  description: d.description || '',
  highlight: d.highlight,
   currency: 'CNY',
   ownerId: '',
   createdAt: new Date().toISOString(),
   isVerified: true,
   verificationStatus: 'verified',
}));

const Index = () => {
  const [filter, setFilter] = useState('all');
  const [extFilter, setExtFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'hot' | 'latest_offer' | 'price_asc' | 'price_desc'>('hot');
  const [latestOfferMap, setLatestOfferMap] = useState<Record<string, string>>({});
  const [quickView, setQuickView] = useState<HomeDomainItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('marketplace');
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { unreadCount } = useNotifications();
  const { config: siteConfig } = useSiteSettings();
  const { data: homeData, isLoading } = useHomeData();

  // URL search param
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('search');
    if (s) setSearchQuery(s);
  }, []);

  // Use full hot list (up to ~50) so search/filter has more to work with on /index
  const domains: HomeDomainItem[] = useMemo(() => {
    const featured = homeData?.hotDomains ?? [];
    if (!featured.length) {
      return isLoading ? [] : FALLBACK_DOMAINS;
    }
    return [...featured].sort((a, b) => Number(Boolean(b.highlight)) - Number(Boolean(a.highlight)));
  }, [homeData?.hotDomains, isLoading]);

  // Available extensions, derived dynamically from data
  const availableExtensions = useMemo(() => {
    const set = new Set<string>();
    domains.forEach(d => {
      const idx = d.name.lastIndexOf('.');
      if (idx > 0) set.add(d.name.slice(idx).toLowerCase());
    });
    return Array.from(set).sort();
  }, [domains]);

  // Fetch latest offer timestamps so we can sort by 最新报价
  useEffect(() => {
    const ids = (homeData?.hotDomains ?? []).map(d => d.id).filter(Boolean);
    if (!ids.length) return;
    (async () => {
      const { data } = await (supabase as any)
        .from('domain_offers')
        .select('domain_id, created_at')
        .in('domain_id', ids)
        .order('created_at', { ascending: false });
      if (!data) return;
      const map: Record<string, string> = {};
      for (const row of data) {
        if (!map[row.domain_id]) map[row.domain_id] = row.created_at;
      }
      setLatestOfferMap(map);
    })();
  }, [homeData?.hotDomains]);

  const sortedDomains = useMemo(() => {
    const list = domains.filter(d => {
      if (filter !== 'all' && d.category !== filter) return false;
      if (extFilter !== 'all' && !d.name.toLowerCase().endsWith(extFilter)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return d.name?.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q);
      }
      return true;
    });

    const sorted = [...list];
    if (sortBy === 'price_asc') sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === 'price_desc') sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === 'latest_offer') {
      sorted.sort((a, b) => {
        const ta = latestOfferMap[a.id] ? new Date(latestOfferMap[a.id]).getTime() : 0;
        const tb = latestOfferMap[b.id] ? new Date(latestOfferMap[b.id]).getTime() : 0;
        return tb - ta;
      });
    }
    return sorted;
  }, [domains, filter, extFilter, searchQuery, sortBy, latestOfferMap]);

  const filteredDomains = useMemo(() => sortedDomains.slice(0, visibleCount), [sortedDomains, visibleCount]);

  // 重置分页（筛选/搜索/排序联动）
  useEffect(() => { setVisibleCount(12); }, [filter, extFilter, searchQuery, sortBy]);

  // 用于搜索后缀高亮：拿到查询匹配的后缀
  const matchedExtFromQuery = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q.startsWith('.')) return null;
    return availableExtensions.find(e => e.startsWith(q)) || null;
  }, [searchQuery, availableExtensions]);

  const handleSellDomains = () => {
    if (user) navigate('/user-center?tab=domains');
    else setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar unreadCount={unreadCount} />
      
      <div className={isMobile ? 'pb-20' : ''}>
        <HeroSection />

        {/* Domain Tabs Section */}
        <section className="py-12 md:py-16 bg-card">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-center mb-8">
                <TabsList className="grid grid-cols-3 w-full max-w-md">
                  <TabsTrigger value="marketplace" className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 tab-icon" />域名市场
                  </TabsTrigger>
                  <TabsTrigger value="estimator" className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 tab-icon" />价值评估
                  </TabsTrigger>
                  <TabsTrigger value="monitor" className="flex items-center gap-2">
                    <Eye className="w-4 h-4 tab-icon" />域名监控
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="marketplace">
                <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8 md:mb-10">
                  {t('homePage.featuredDomains')}
                </h2>

                {/* Filters — scrollable on mobile with right-fade hint */}
                <div className="relative mb-8">
                  <div className="overflow-x-auto pb-3 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' as any }}>
                    <div className="flex gap-2 md:gap-3 md:flex-wrap md:justify-center min-w-max px-4 md:min-w-0">
                    {[
                      { key: 'all', label: t('common.all') },
                      { key: 'premium', label: t('domains.categories.premium') },
                      { key: 'short', label: t('domains.categories.short') },
                      { key: 'dev', label: t('domains.categories.tech') },
                    ].map(f => (
                      <Button
                        key={f.key}
                        variant={filter === f.key ? 'default' : 'outline'}
                        onClick={() => setFilter(f.key)}
                        size="sm"
                        className="font-bold"
                      >
                        {f.label}
                      </Button>
                    ))}
                    </div>
                  </div>
                  {/* Right-edge fade hint for mobile */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent md:hidden" />
                </div>

                <div className="max-w-md mx-auto mb-4 flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder={t('marketplace.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-10 md:h-12 pl-12 pr-4 bg-background border-border focus:border-ring text-foreground font-medium"
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  </div>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger className="w-[130px] h-10 md:h-12 font-bold text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hot">🔥 热门</SelectItem>
                      <SelectItem value="latest_offer">🆕 最新报价</SelectItem>
                      <SelectItem value="price_asc">↑ 价格从低</SelectItem>
                      <SelectItem value="price_desc">↓ 价格从高</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Extension chips */}
                {availableExtensions.length > 0 && (
                  <div className="max-w-2xl mx-auto mb-8 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2 justify-start md:justify-center min-w-max px-4 md:px-0">
                      <button
                        onClick={() => setExtFilter('all')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                          extFilter === 'all'
                            ? 'bg-foreground text-background border-foreground'
                            : 'bg-background text-foreground border-border hover:border-foreground/50'
                        }`}
                      >
                        全部后缀
                      </button>
                      {availableExtensions.map(ext => {
                        const isActive = extFilter === ext;
                        const isMatched = matchedExtFromQuery === ext;
                        return (
                          <button
                            key={ext}
                            onClick={() => setExtFilter(ext)}
                            className={`text-xs font-mono font-bold px-3 py-1.5 rounded-full border transition-all ${
                              isActive
                                ? 'bg-foreground text-background border-foreground'
                                : isMatched
                                  ? 'bg-yellow-300/70 dark:bg-yellow-500/40 text-foreground border-yellow-500/60 ring-2 ring-yellow-400/60'
                                  : 'bg-background text-foreground border-border hover:border-foreground/50'
                            }`}
                          >
                            {ext}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Domain Cards */}
                {isLoading ? (
                  <SkeletonCardGrid count={6} />
                ) : filteredDomains.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mb-8 px-2 md:px-0">
                      {filteredDomains.map((domain, i) => (
                        <motion.div
                          key={domain.id}
                          initial={{ opacity: 0, y: 18 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: '-40px' }}
                          transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.05 }}
                        >
                          <DomainCard
                            domain={domain.name}
                            price={domain.price}
                            currency={domain.currency}
                            highlight={domain.highlight || false}
                            description={domain.description || ''}
                            category={domain.category || ''}
                            domainId={domain.id}
                            sellerId={domain.ownerId || ''}
                            isVerified={domain.isVerified ?? domain.verificationStatus === 'verified'}
                            searchQuery={searchQuery}
                            onQuickView={() => setQuickView(domain)}
                          />
                        </motion.div>
                      ))}
                    </div>
                    <div className="text-center space-y-3">
                      <div className="text-xs text-muted-foreground">
                        显示 <span className="font-bold text-foreground tabular-nums">{filteredDomains.length}</span> / {sortedDomains.length} 个域名
                      </div>
                      <div className="flex justify-center gap-3 flex-wrap">
                        {visibleCount < sortedDomains.length && (
                          <Button
                            onClick={() => setVisibleCount(c => c + 12)}
                            variant="outline"
                            className="px-6 py-2 font-bold"
                          >
                            加载更多 ({sortedDomains.length - visibleCount})
                          </Button>
                        )}
                        <Link to="/marketplace">
                          <Button className="px-6 py-2">前往完整市场 →</Button>
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 bg-muted rounded-lg border border-border mb-12">
                    <h3 className="text-2xl font-medium text-muted-foreground mb-4">
                      {domains.length === 0 ? '暂无域名' : t('marketplace.noDomainsFound')}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {domains.length === 0 ? '看起来还没有域名添加到平台中' : t('homePage.tryAdjustingFilters')}
                    </p>
                    <Button onClick={handleSellDomains}>{t('homePage.addYourDomain')}</Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="estimator">
                <Suspense fallback={<div className="flex justify-center py-12"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                  <DomainEstimator />
                </Suspense>
              </TabsContent>

              <TabsContent value="monitor">
                <Suspense fallback={<div className="flex justify-center py-12"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                  <DomainMonitor />
                </Suspense>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        <DealsShowcaseSection />

        <HowItWorksSection />

        {/* Features / How It Works (site-config driven) */}
        <section className="py-16 md:py-20 bg-card relative overflow-hidden">
          <div className="relative max-w-6xl mx-auto px-4 md:px-8 z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-10 md:mb-16">
              {siteConfig.how_it_works_title || t('homePage.howItWorks')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                { step: '1', title: siteConfig.step1_title || t('homePage.step1Title'), desc: siteConfig.step1_desc || t('homePage.step1Description') },
                { step: '2', title: siteConfig.step2_title || t('homePage.step2Title'), desc: siteConfig.step2_desc || t('homePage.step2Description') },
                { step: '3', title: siteConfig.step3_title || t('homePage.step3Title'), desc: siteConfig.step3_desc || t('homePage.step3Description') },
              ].map(({ step, title, desc }) => (
                <div key={step} className="rounded-2xl p-6 md:p-8 text-center border border-border bg-background">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-muted border border-border flex items-center justify-center mx-auto mb-4 md:mb-6 text-xl md:text-2xl font-bold text-foreground">
                    {step}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-3 text-foreground">{title}</h3>
                  <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 md:py-20 bg-card relative overflow-hidden">
          <div className="relative max-w-6xl mx-auto px-4 md:px-8 z-10">
            <motion.h2
              className="text-2xl md:text-3xl font-bold text-center text-foreground mb-10 md:mb-14"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              viewport={{ once: true }}
            >
              {siteConfig.stats_title || t('homePage.platformStats')}
            </motion.h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { value: siteConfig.stat_users || '50,000+', label: t('homePage.activeUsers') },
                { value: siteConfig.stat_countries || '100+', label: t('homePage.countries') },
                { value: siteConfig.stat_volume || '$100M+', label: t('homePage.transactionVolume') },
                { value: siteConfig.stat_support || '24/7', label: t('homePage.customerSupport') },
              ].map(({ value, label }, i) => (
                <motion.div
                  key={label}
                  className="text-center p-4 md:p-6 bg-background border border-border rounded-2xl hover-lift"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.09 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="text-2xl md:text-4xl font-bold mb-2 md:mb-3 text-foreground">
                    {value}
                  </div>
                  <div className="text-muted-foreground text-xs md:text-sm font-medium">{label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <Suspense fallback={null}><SupportSection /></Suspense>
        <Suspense fallback={null}><SoldDomains /></Suspense>

        {/* CTA */}
        <section className="py-16 md:py-20 bg-card relative overflow-hidden">
          <div className="relative max-w-4xl mx-auto px-4 md:px-8 text-center z-10">
            <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 text-foreground">
              {siteConfig.cta_title || t('homePage.ctaTitle')}
            </h2>
            <p className="text-base md:text-xl text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed">
              {siteConfig.cta_description || t('homePage.ctaDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/marketplace" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 px-8 py-3 text-base font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.97]">
                  {siteConfig.cta_btn_primary || t('homePage.browseDomains')}
                </Button>
              </Link>
              <Link to={user ? "/user-center" : "#"} onClick={user ? undefined : () => setIsAuthModalOpen(true)} className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto px-8 py-3 text-base font-bold transition-all active:scale-[0.97] border-2 border-foreground text-foreground hover:bg-foreground hover:text-background"
                >
                  {user ? (siteConfig.cta_btn_secondary || t('homePage.visitUserCenter')) : t('homePage.registerLogin')}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>

      
      <AuthModal open={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <DomainQuickViewDialog
        open={!!quickView}
        onClose={() => setQuickView(null)}
        domain={quickView?.name || ''}
        domainId={quickView?.id}
        sellerId={quickView?.ownerId}
        price={quickView?.price}
        currency={quickView?.currency}
      />
    </div>
  );
};

export default Index;
