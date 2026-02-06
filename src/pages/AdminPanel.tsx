import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminStats } from '@/types/domain';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { PendingVerifications } from '@/components/admin/PendingVerifications';
import { AllDomainListings } from '@/components/admin/AllDomainListings';
import { UserManagement } from '@/components/admin/UserManagement';
import { ContentManagement } from '@/components/admin/ContentManagement';
import { SeoConfiguration } from '@/components/admin/SeoConfiguration';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Settings, RefreshCw, FileText, Layers, Search, Home, Users, Globe, CheckSquare, BarChart3 } from 'lucide-react';
import { SiteSettings } from '@/components/admin/SiteSettings';
import { HomeContentManagement } from '@/components/admin/HomeContentManagement';
import { BulkDomainOperations } from '@/components/admin/BulkDomainOperations';
import { QuickSettingsPanel } from '@/components/admin/QuickSettingsPanel';
import { AdminActivityLog } from '@/components/admin/AdminActivityLog';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export const AdminPanel = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  
  const [stats, setStats] = useState<AdminStats>({
    total_domains: 0,
    pending_verifications: 0,
    active_listings: 0,
    total_offers: 0,
    recent_transactions: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'dashboard');

  useEffect(() => {
    const checkAndLoadAdmin = async () => {
      if (authLoading) return;
      
      if (!user) {
        toast.error('请先登录');
        navigate('/auth');
        return;
      }
      
      try {
        const { data: isAdminUser, error } = await supabase.rpc('is_admin', {
          user_id: user.id
        });
        
        if (error) {
          console.error('Admin check error:', error);
          toast.error('权限验证失败');
          navigate('/');
          return;
        }
        
        if (!isAdminUser) {
          toast.error('您没有管理员权限');
          navigate('/');
          return;
        }
        
        loadAdminStats();
      } catch (error) {
        console.error('Error checking admin status:', error);
        toast.error('权限验证失败');
        navigate('/');
      }
    };
    
    checkAndLoadAdmin();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const loadAdminStats = async () => {
    try {
      setIsLoading(true);
      setIsRefreshingStats(true);
      
      const statsQueries = await Promise.allSettled([
        supabase.from('domain_listings').select('*', { count: 'exact', head: true }),
        supabase.from('domain_verifications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('domain_listings').select('*', { count: 'exact', head: true }).eq('status', 'available'),
        supabase.from('domain_offers').select('*', { count: 'exact', head: true }),
        supabase.from('transactions').select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);
      
      const statsResults = statsQueries.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value.count || 0;
        } else {
          console.error(`Stats query ${index} failed:`, result.reason);
          return 0;
        }
      });
      
      setStats({
        total_domains: statsResults[0],
        pending_verifications: statsResults[1],
        active_listings: statsResults[2],
        total_offers: statsResults[3],
        recent_transactions: statsResults[4],
      });
    } catch (error: any) {
      console.error('Error loading admin stats:', error);
      toast.error('加载管理统计信息失败');
    } finally {
      setIsLoading(false);
      setIsRefreshingStats(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">正在验证身份...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">需要登录</h1>
          <p className="text-muted-foreground mb-4">请先登录管理员账户</p>
          <Button variant="default" onClick={() => navigate('/auth')}>
            前往登录
          </Button>
        </div>
      </div>
    );
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const tabItems = [
    { value: 'dashboard', label: '仪表盘', icon: BarChart3 },
    { value: 'verifications', label: '待验证', icon: CheckSquare, badge: stats.pending_verifications },
    { value: 'domains', label: '域名管理', icon: Globe },
    { value: 'bulk', label: '批量操作', icon: Layers },
    { value: 'users', label: '用户管理', icon: Users },
    { value: 'homepage', label: '首页管理', icon: Home },
    { value: 'content', label: '内容管理', icon: FileText },
    { value: 'seo', label: 'SEO配置', icon: Search },
    { value: 'quick-settings', label: '快速设置', icon: Settings },
    { value: 'settings', label: '系统设置', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">管理员控制面板</h1>
              <p className="text-sm text-muted-foreground">管理网站内容、用户和系统设置</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              返回首页
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadAdminStats}
              disabled={isRefreshingStats}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshingStats ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <Card className="mb-6">
            <CardContent className="p-2">
              <ScrollArea className="w-full">
                <TabsList className="inline-flex h-auto w-auto min-w-full gap-1 bg-transparent p-0">
                  {tabItems.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md whitespace-nowrap"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        {tab.badge && tab.badge > 0 && (
                          <Badge variant="secondary" className="ml-1 h-5 min-w-5 flex items-center justify-center text-xs">
                            {tab.badge}
                          </Badge>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </ScrollArea>
            </CardContent>
          </Card>
          
          <TabsContent value="dashboard" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AdminDashboard />
              </div>
              <div>
                <AdminActivityLog />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="verifications" className="mt-0">
            <PendingVerifications />
          </TabsContent>
          
          <TabsContent value="domains" className="mt-0">
            <AllDomainListings />
          </TabsContent>
          
          <TabsContent value="bulk" className="mt-0">
            <BulkDomainOperations />
          </TabsContent>
          
          <TabsContent value="users" className="mt-0">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="homepage" className="mt-0">
            <HomeContentManagement />
          </TabsContent>
          
          <TabsContent value="content" className="mt-0">
            <ContentManagement />
          </TabsContent>
          
          <TabsContent value="seo" className="mt-0">
            <SeoConfiguration />
          </TabsContent>

          <TabsContent value="quick-settings" className="mt-0">
            <QuickSettingsPanel />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-0">
            <SiteSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
