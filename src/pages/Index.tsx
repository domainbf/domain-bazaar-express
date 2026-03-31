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
import { Domain } from '@/types/domain';
import { fallbackDomains } from '@/data/availableDomains';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'framer-motion';

import { useNotifications } from '@/hooks/useNotifications';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useDomainListings } from '@/hooks/useDomainListings';
import { SkeletonCardGrid } from '@/components/common/SkeletonCard';

import { Footer } from '@/components/sections/Footer';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { DealsShowcaseSection } from '@/components/sections/DealsShowcaseSection';

const DomainEstimator = lazy(() => import('@/components/tools/DomainEstimator').then(m => ({ default: m.DomainEstimator })));
const DomainMonitor = lazy(() => import('@/components/tools/DomainMonitor').then(m => ({ default: m.DomainMonitor })));
const SoldDomains = lazy(() => import('@/components/sections/SoldDomains').then(m => ({ default: m.SoldDomains })));
const SupportSection = lazy(() => import('@/components/sections/SupportSection'));

const FALLBACK_DOMAINS: Domain[] = fallbackDomains.slice(0, 9).map((d, i) => ({
  id: `fallback-${i}`,
  name: d.name,
  price: parseInt(d.price),
  category: d.category,
  description: d.description || '',
  status: 'available',
  highlight: d.highlight,
  owner_id: '',
  created_at: new Date().toISOString(),
  is_verified: true,
  verification_status: 'verified',
  views: 0,
}));

const Index = () => {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('marketplace');
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { unreadCount } = useNotifications();
  const { config: siteConfig } = useSiteSettings();

  // ── React Query — shares cache with Marketplace page ──────────
  const { data: allDomains, isLoading } = useDomainListings();

  // URL search param
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('search');
    if (s) setSearchQuery(s);
  }, []);

  // Show top-9 by views, with fallback when DB is empty
  const domains: Domain[] = useMemo(() => {
    if (!allDomains?.length) return isLoading ? [] : FALLBACK_DOMAINS;
    return [...allDomains].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 9);
  }, [allDomains, isLoading]);

  const filteredDomains = useMemo(() => domains
    .filter(d => {
      if (filter !== 'all' && d.category !== filter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return d.name?.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q);
      }
      return true;
    }), [domains, filter, searchQuery]);

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

                <div className="max-w-md mx-auto mb-10">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder={t('marketplace.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-10 md:h-12 pl-12 pr-4 bg-background border-border focus:border-ring text-foreground font-medium"
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  </div>
                </div>

                {/* Domain Cards */}
                {isLoading ? (
                  <SkeletonCardGrid count={6} />
                ) : filteredDomains.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mb-8 px-2 md:px-0">
                      {filteredDomains.map((domain) => (
                        <DomainCard
                          key={domain.id}
                          domain={domain.name}
                          price={domain.price}
                          highlight={domain.highlight || false}
                          description={domain.description || ''}
                          category={domain.category || ''}
                          domainId={domain.id}
                          sellerId={domain.owner_id || ''}
                        />
                      ))}
                    </div>
                    <div className="text-center">
                      <Link to="/marketplace">
                        <Button className="px-8 py-3">查看更多域名</Button>
                      </Link>
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
    </div>
  );
};

export default Index;
