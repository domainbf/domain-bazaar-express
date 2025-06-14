
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DomainCard } from '@/components/DomainCard';
import { Search, User, ClipboardList, ArrowRight, Bell, Award } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { supabase } from '@/integrations/supabase/client';
import { Domain } from '@/types/domain';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/cards";
import { useTranslation } from 'react-i18next';

const Index = () => {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 优化的域名加载函数
  const loadDomains = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading domains for homepage...');
      
      // 使用更高效的查询，减少数据传输
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
          owner_id,
          created_at,
          is_verified,
          verification_status
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(12); // 增加到12个域名以填充网格
      
      if (listingsError) {
        console.error('Error loading domain listings:', listingsError);
        throw new Error(`加载域名列表失败: ${listingsError.message}`);
      }

      if (!listingsData || listingsData.length === 0) {
        console.log('No domains found in database');
        setDomains([]);
        return;
      }
      
      console.log('Loaded domain listings:', listingsData.length);
      
      // 获取分析数据（批量查询）
      const domainIds = listingsData.map(domain => domain.id);
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('domain_analytics')
        .select('domain_id, views')
        .in('domain_id', domainIds);
      
      if (analyticsError) {
        console.error('Error fetching analytics:', analyticsError);
      }
      
      // 创建分析数据映射
      const analyticsMap = new Map();
      if (analyticsData) {
        analyticsData.forEach(item => {
          analyticsMap.set(item.domain_id, item.views || 0);
        });
      }
      
      // 处理并合并数据
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
      
      // 智能排序：已验证域名优先，然后按浏览量和价格
      processedDomains.sort((a, b) => {
        // 验证状态优先
        if (a.is_verified !== b.is_verified) {
          return b.is_verified ? 1 : -1;
        }
        
        // 精选域名优先
        if (a.highlight !== b.highlight) {
          return b.highlight ? 1 : -1;
        }
        
        // 浏览量优先
        const viewsDiff = (b.views || 0) - (a.views || 0);
        if (viewsDiff !== 0) return viewsDiff;
        
        // 最后按创建时间
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      console.log('Processed domains successfully:', processedDomains.length);
      setDomains(processedDomains);
      
    } catch (error: any) {
      console.error('Error loading domains:', error);
      const errorMessage = error.message || '加载域名列表失败，请刷新页面重试';
      setError(errorMessage);
      toast.error(errorMessage);
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

    // 延迟加载以确保组件完全挂载
    const timer = setTimeout(() => {
      loadDomains();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

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
    .slice(0, 9); // 限制显示数量

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
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      {/* Hero Section */}
      <header className="pt-16 pb-20 md:py-24 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 md:mb-8 leading-tight text-white">
            {t('homePage.title')}
          </h1>
          <p className="text-base md:text-xl text-white mb-8 md:mb-12 max-w-3xl mx-auto px-2 font-semibold">
            {t('homePage.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-2">
            <Link to="/marketplace" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 px-6 py-2 md:px-8 md:py-6 text-base md:text-lg font-bold">
                {t('homePage.browseDomains')}
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto border-gray-400 border-2 bg-transparent text-white hover:bg-gray-700 px-6 py-2 md:px-8 md:py-6 text-base md:text-lg font-bold"
              onClick={handleSellDomains}
            >
              {t('homePage.sellDomains')}
            </Button>
          </div>
        </div>
      </header>

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
                  <p className="text-3xl font-bold">{profile?.domains_count || 0}</p>
                  <p className="text-sm text-gray-500">{t('homePage.activeDomains')}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/user-center?tab=domains')}>
                    {t('homePage.manageDomains')}
                  </Button>
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
                  <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/user-center?tab=notifications')}>
                    {t('homePage.viewNotifications')}
                  </Button>
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
                  <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/user-center?tab=profile')}>
                    {t('homePage.editProfile')}
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="text-center">
              <Button 
                onClick={() => navigate('/dashboard')}
                className="bg-black hover:bg-gray-800 text-white"
              >
                {t('homePage.fullDashboard')}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Filter Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
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
            <div className="text-center py-16 bg-red-50 rounded-lg border border-red-200 mb-12">
              <h3 className="text-2xl font-medium text-red-600 mb-4">加载失败</h3>
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={handleRetry} className="bg-red-600 hover:bg-red-700">
                重新加载
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600">正在加载精选域名...</p>
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
