import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DomainCard } from '@/components/DomainCard';
import { HorizontalDomainCarousel } from '@/components/HorizontalDomainCarousel';
import { Search, User, ClipboardList, ArrowRight, Bell, TrendingUp, Calculator, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/sections/HeroSection';
import { DomainEstimator } from '@/components/tools/DomainEstimator';
import { DomainMonitor } from '@/components/tools/DomainMonitor';
import { SoldDomains } from '@/components/sections/SoldDomains';
import SupportSection from '@/components/sections/SupportSection';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { supabase } from '@/integrations/supabase/client';
import { Domain } from '@/types/domain';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { fallbackDomains } from '@/data/availableDomains';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { useNotifications } from '@/hooks/useNotifications';

const Index = () => {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [myDomainsCount, setMyDomainsCount] = useState(0);
  const { user, profile, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { unreadCount } = useNotifications();

  // 优化的域名加载函数 - 减少复杂度，提高加载速度
  const loadDomains = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading domains for homepage...');
      
      // 简化查询，只获取必要字段，减少网络传输
      const { data: listingsData, error: listingsError } = await supabase
        .from('domain_listings')
        .select(`
          id,
          name,
          price,
          category,
          description,
          status,
          highlight,
          is_verified
        `)
        .in('status', ['available', 'reserved'])
        .order('highlight', { ascending: false })
        .order('is_verified', { ascending: false })
        .limit(9); // 减少到9个，提高加载速度
      
      if (listingsError) {
        throw listingsError;
      }

      if (!listingsData || listingsData.length === 0) {
        console.log('No domains found, using fallback data');
        const fallbackData = fallbackDomains.slice(0, 9).map((domain, index) => ({
          id: `fallback-${index}`,
          name: domain.name,
          price: parseInt(domain.price),
          category: domain.category,
          description: domain.description || '',
          status: 'available',
          highlight: domain.highlight,
          owner_id: '',
          created_at: new Date().toISOString(),
          is_verified: true,
          verification_status: 'verified',
          views: 0
        }));
        setDomains(fallbackData);
        setIsLoading(false);
        return;
      }
      
      // 简化数据处理，去掉复杂的分析数据查询
      const processedDomains: Domain[] = listingsData.map(domain => ({
        id: domain.id,
        name: domain.name || '',
        price: Number(domain.price) || 0,
        category: domain.category || 'standard',
        description: domain.description || '',
        status: domain.status || 'available',
        highlight: Boolean(domain.highlight),
        owner_id: '',
        created_at: new Date().toISOString(),
        is_verified: Boolean(domain.is_verified),
        verification_status: domain.is_verified ? 'verified' : 'pending',
        views: 0
      }));
      
      console.log('Loaded domains successfully:', processedDomains.length);
      setDomains(processedDomains);
      
    } catch (error: any) {
      console.error('Error loading domains:', error);
      
      // 发生错误时使用备用数据，确保页面正常显示
      console.warn('Using fallback data due to error');
      const fallbackData = fallbackDomains.slice(0, 9).map((domain, index) => ({
        id: `fallback-${index}`,
        name: domain.name,
        price: parseInt(domain.price),
        category: domain.category,
        description: domain.description || '',
        status: 'available',
        highlight: domain.highlight,
        owner_id: '',
        created_at: new Date().toISOString(),
        is_verified: true,
        verification_status: 'verified',
        views: 0
      }));
      setDomains(fallbackData);
      
      // 不设置错误状态，让页面正常显示备用数据
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 从 URL 获取搜索参数
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }

    // 只在组件首次挂载时加载数据
    loadDomains();
  }, []); // 移除所有依赖项，防止无限循环

  // 实时统计我的域名数量，修复首页与管理页面数量不一致
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchCount = async () => {
      if (!user?.id) { setMyDomainsCount(0); return; }
      const { count, error } = await supabase
        .from('domain_listings')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);
      if (!error && typeof count === 'number') {
        setMyDomainsCount(count || 0);
      }
    };

    fetchCount();

    if (user?.id) {
      channel = supabase
        .channel(`domain_count_${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'domain_listings', filter: `owner_id=eq.${user.id}` },
          () => fetchCount()
        )
        .subscribe();
    }

    return () => { if (channel) supabase.removeChannel(channel); };
  }, [user?.id]);

  // 优化的过滤逻辑
  const filteredDomains = domains
    .filter(domain => {
      if (filter !== 'all' && domain.category !== filter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return (
          domain.name?.toLowerCase().includes(query) || 
          domain.description?.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .slice(0, 9);

  const handleSellDomains = () => {
    if (user) {
      navigate('/user-center?tab=domains');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleRetry = () => {
    setError(null);
    loadDomains();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar unreadCount={unreadCount} />
      
      <div className={isMobile ? 'pb-20' : ''}>
      {/* Hero Section */}
      <HeroSection />

      {/* 主要内容区域 - 使用标签页 */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger value="marketplace" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  域名市场
                </TabsTrigger>
                <TabsTrigger value="estimator" className="flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  价值评估
                </TabsTrigger>
                <TabsTrigger value="monitor" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  域名监控
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="marketplace">
              <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8 md:mb-10">{t('homePage.featuredDomains')}</h2>
              
              {/* Filter buttons */}
              <div className="overflow-x-auto pb-4 mb-8">
                <div className="flex gap-2 md:gap-3 md:flex-wrap md:justify-center min-w-max px-4">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                    className={filter === 'all' ? 'bg-gray-900 text-white font-bold' : 'text-gray-900 border-gray-700 border-2 font-bold'}
                    size="sm"
                  >
                    {t('common.all')}
                  </Button>
                  <Button
                    variant={filter === 'premium' ? 'default' : 'outline'}
                    onClick={() => setFilter('premium')}
                    className={filter === 'premium' ? 'bg-gray-900 text-white font-bold' : 'text-gray-900 border-gray-700 border-2 font-bold'}
                    size="sm"
                  >
                    {t('domains.categories.premium')}
                  </Button>
                  <Button
                    variant={filter === 'short' ? 'default' : 'outline'}
                    onClick={() => setFilter('short')}
                    className={filter === 'short' ? 'bg-gray-900 text-white font-bold' : 'text-gray-900 border-gray-700 border-2 font-bold'}
                    size="sm"
                  >
                    {t('domains.categories.short')}
                  </Button>
                  <Button
                    variant={filter === 'dev' ? 'default' : 'outline'}
                    onClick={() => setFilter('dev')}
                    className={filter === 'dev' ? 'bg-gray-900 text-white font-bold' : 'text-gray-900 border-gray-700 border-2 font-bold'}
                    size="sm"
                  >
                    {t('domains.categories.tech')}
                  </Button>
                </div>
              </div>

              <div className="max-w-md mx-auto mb-10">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder={t('marketplace.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 md:h-12 pl-12 pr-4 bg-white border-gray-500 focus:border-gray-900 text-gray-900 font-medium"
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-700 w-5 h-5" />
                </div>
              </div>

              {/* Domain Cards Grid */}
              {error ? (
                <div className="text-center py-16 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-200 mb-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-red-700 mb-2">加载遇到问题</h3>
                  <p className="text-red-600 mb-6 max-w-md mx-auto leading-relaxed">{error}</p>
                  <div className="space-x-4">
                    <Button onClick={handleRetry} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2">
                      重新加载
                    </Button>
                    <Button variant="outline" onClick={() => window.location.reload()} className="border-red-300 text-red-600 hover:bg-red-50">
                      刷新页面
                    </Button>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mb-8 px-2 md:px-0">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
                      <div className="bg-gray-200 h-4 rounded mb-2"></div>
                      <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
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
                      <Button className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3">
                        查看更多域名
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200 mb-12">
                  <h3 className="text-2xl font-medium text-gray-600 mb-4">
                    {domains.length === 0 ? '暂无域名' : t('marketplace.noDomainsFound')}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {domains.length === 0 ? '看起来还没有域名添加到平台中' : t('homePage.tryAdjustingFilters')}
                  </p>
                  <div className="space-x-4">
                    <Button onClick={handleSellDomains} className="bg-gray-900">
                      {t('homePage.addYourDomain')}
                    </Button>
                    <Button variant="outline" onClick={handleRetry}>
                      刷新页面
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="estimator">
              <DomainEstimator />
            </TabsContent>

            <TabsContent value="monitor">
              <DomainMonitor />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 md:mb-16 text-white-enhanced">{t('homePage.howItWorks')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            <div className="bg-gray-800 rounded-xl p-6 md:p-8 text-center">
              <div className="bg-white text-gray-900 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 text-xl md:text-2xl font-bold">1</div>
              <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-white-enhanced">{t('homePage.step1Title')}</h3>
              <p className="text-white text-sm md:text-base font-semibold">{t('homePage.step1Description')}</p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 md:p-8 text-center">
              <div className="bg-white text-gray-900 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 text-xl md:text-2xl font-bold">2</div>
              <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-white-enhanced">{t('homePage.step2Title')}</h3>
              <p className="text-white text-sm md:text-base font-semibold">{t('homePage.step2Description')}</p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 md:p-8 text-center">
              <div className="bg-white text-gray-900 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 text-xl md:text-2xl font-bold">3</div>
              <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-white-enhanced">{t('homePage.step3Title')}</h3>
              <p className="text-white text-sm md:text-base font-semibold">{t('homePage.step3Description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-dark-enhanced mb-10 md:mb-16">{t('homePage.platformStats')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="text-center p-4 md:p-6 bg-gray-100 rounded-lg shadow-sm">
              <div className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-3">50,000+</div>
              <div className="text-gray-800 text-sm md:text-base font-semibold">{t('homePage.activeUsers')}</div>
            </div>
            <div className="text-center p-4 md:p-6 bg-gray-100 rounded-lg shadow-sm">
              <div className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-3">100+</div>
              <div className="text-gray-800 text-sm md:text-base font-semibold">{t('homePage.countries')}</div>
            </div>
            <div className="text-center p-4 md:p-6 bg-gray-100 rounded-lg shadow-sm">
              <div className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-3">$100M+</div>
              <div className="text-gray-800 text-sm md:text-base font-semibold">{t('homePage.transactionVolume')}</div>
            </div>
            <div className="text-center p-4 md:p-6 bg-gray-100 rounded-lg shadow-sm">
              <div className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-3">24/7</div>
              <div className="text-gray-800 text-sm md:text-base font-semibold">{t('homePage.customerSupport')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <SupportSection />

      {/* Sold Domains Section */}
      <SoldDomains />

      {/* Call to Action */}
      <section className="py-16 md:py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-white-enhanced">{t('homePage.ctaTitle')}</h2>
          <p className="text-base md:text-xl text-white mb-8 md:mb-10 font-semibold">
            {t('homePage.ctaDescription')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/marketplace" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 px-6 py-2 md:px-6 md:py-3 text-base font-bold">
                {t('homePage.browseDomains')}
              </Button>
            </Link>
            <Link to={user ? "/user-center" : "#"} onClick={user ? undefined : () => setIsAuthModalOpen(true)} className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto border-white border-2 bg-transparent text-white hover:bg-gray-700 px-6 py-2 md:px-6 md:py-3 text-base font-bold"
              >
                {user ? t('homePage.visitUserCenter') : t('homePage.registerLogin')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-12 bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
          <p className="text-sm md:text-base font-semibold">{t('homePage.footer')}</p>
        </div>
      </footer>
      </div>

      {isMobile && <BottomNavigation unreadCount={unreadCount} />}
      <AuthModal open={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

export default Index;
