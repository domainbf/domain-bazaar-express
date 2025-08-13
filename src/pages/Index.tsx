import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DomainCard } from '@/components/DomainCard';
import { Search, User, ClipboardList, ArrowRight, Bell, TrendingUp, Calculator, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/sections/HeroSection';
import { DomainEstimator } from '@/components/tools/DomainEstimator';
import { DomainMonitor } from '@/components/tools/DomainMonitor';
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

  // 优化的域名加载函数
  const loadDomains = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading domains for homepage...');
      
      // 添加重试机制和更好的错误处理
      let retryCount = 0;
      const maxRetries = 3;
      let listingsData = null;
      
      while (retryCount < maxRetries) {
        try {
          const { data, error: listingsError } = await supabase
            .from('domain_listings')
            .select(`
              id,
              name,
              price,
              category,
              description,
              status,
              highlight,
              owner_id,
              created_at,
              is_verified,
              verification_status
            `)
            .eq('status', 'available')
            .order('created_at', { ascending: false })
            .limit(12);
          
          if (listingsError) {
            throw listingsError;
          }
          
          listingsData = data;
          break;
        } catch (error: any) {
          retryCount++;
          console.error(`Attempt ${retryCount} failed:`, error);
          
          if (retryCount >= maxRetries) {
            // 如果数据库连接失败，使用本地备用数据
            console.warn('Database connection failed, using fallback data');
            const fallbackData = fallbackDomains.map((domain, index) => ({
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
              verification_status: 'verified'
            }));
            listingsData = fallbackData;
            break;
          }
          
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      if (!listingsData || listingsData.length === 0) {
        console.log('No domains found in database, using fallback approach');
        // 设置空数组但不返回，继续处理
        setDomains([]);
        setIsLoading(false);
        return;
      }
      
      console.log('Loaded domain listings:', listingsData.length);
      
      const domainIds = listingsData.map(domain => domain.id);
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('domain_analytics')
        .select('domain_id, views')
        .in('domain_id', domainIds);
      
      if (analyticsError) {
        console.error('Error fetching analytics:', analyticsError);
      }
      
      const analyticsMap = new Map();
      if (analyticsData) {
        analyticsData.forEach(item => {
          analyticsMap.set(item.domain_id, item.views || 0);
        });
      }
      
      const processedDomains: Domain[] = listingsData.map(domain => ({
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
        views: analyticsMap.get(domain.id) || 0
      }));
      
      processedDomains.sort((a, b) => {
        if (a.is_verified !== b.is_verified) {
          return b.is_verified ? 1 : -1;
        }
        
        if (a.highlight !== b.highlight) {
          return b.highlight ? 1 : -1;
        }
        
        const viewsDiff = (b.views || 0) - (a.views || 0);
        if (viewsDiff !== 0) return viewsDiff;
        
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      console.log('Processed domains successfully:', processedDomains.length);
      setDomains(processedDomains);
      
    } catch (error: any) {
      console.error('Error loading domains:', error);
      let errorMessage = '域名加载遇到问题';
      
      // 根据错误类型提供更友好的提示
      if (error.message?.includes('upstream connect error') || error.message?.includes('503')) {
        errorMessage = '服务暂时不可用，请稍后重试';
      } else if (error.message?.includes('timeout')) {
        errorMessage = '网络连接超时，请检查网络后重试';
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = '网络连接问题，请检查网络设置';
      } else {
        errorMessage = error.message || '加载域名列表失败，请刷新页面重试';
      }
      
      setError(errorMessage);
      console.warn('Domain loading failed, user can still browse other features');
      setDomains([]);
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
      <Navbar />
      
      {/* Hero Section */}
      <HeroSection />

      {/* User Dashboard Section - Show when logged in */}
      {user && !authLoading && (
        <section className="py-12 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{t('homePage.userDashboard')}</h2>
              <Link to="/user-center" className="text-blue-600 hover:text-blue-800 flex items-center">
                {t('common.viewAll')} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-gray-600" />
                    {t('userCenter.myDomains')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{myDomainsCount}</p>
                  <p className="text-sm text-gray-500">{t('homePage.activeDomains')}</p>
                </CardContent>
                <CardFooter>
                  <Link to="/user-center?tab=domains" className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                      {t('homePage.manageDomains')}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5 text-gray-600" />
                    {t('notifications.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">0</p>
                  <p className="text-sm text-gray-500">{t('homePage.unreadMessages')}</p>
                </CardContent>
                <CardFooter>
                  <Link to="/user-center?tab=notifications" className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                      {t('homePage.viewNotifications')}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-600" />
                    {t('userCenter.profile')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium truncate">{profile?.full_name || user?.email?.split('@')[0] || t('homePage.defaultUser')}</p>
                  <p className="text-sm text-gray-500">{profile?.account_level || t('homePage.basicUser')}</p>
                </CardContent>
                <CardFooter>
                  <Link to="/user-center?tab=profile" className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                      {t('homePage.editProfile')}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
            
            <div className="text-center">
              <Link to="/dashboard">
                <Button className="bg-black hover:bg-gray-800 text-white">
                  {t('homePage.fullDashboard')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

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
                <div className="flex flex-col items-center justify-center py-20 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
                    <div className="absolute inset-0 w-20 h-20 border-4 border-transparent rounded-full animate-spin border-r-purple-500" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-gray-800">正在加载域名</h3>
                  <p className="mt-2 text-gray-600">为您精选最优质的域名...</p>
                  <div className="mt-4 flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
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

      <AuthModal open={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

export default Index;
