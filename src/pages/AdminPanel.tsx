
import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminStats } from '@/types/domain';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { PendingVerifications } from '@/components/admin/PendingVerifications';
import { AllDomainListings } from '@/components/admin/AllDomainListings';
import { UserManagement } from '@/components/admin/UserManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Settings, Loader2, RefreshCw } from 'lucide-react';
import { SiteSettings } from '@/components/admin/SiteSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export const AdminPanel = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
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
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  useEffect(() => {
    // 快速权限检查
    if (user && !isAdmin) {
      toast.error(t('admin.accessDenied', '您没有管理员权限'));
      navigate('/');
      return;
    }
    
    if (user && isAdmin) {
      loadAdminStats();
    }
  }, [user, isAdmin, navigate]);

  const loadAdminStats = async () => {
    try {
      setIsLoading(true);
      setIsRefreshingStats(true);
      
      // 使用单个查询获取所有统计信息，提高性能
      const [
        { count: totalDomains },
        { count: pendingVerifications },
        { count: activeListings },
        { count: totalOffers },
        { count: recentTransactions }
      ] = await Promise.all([
        supabase.from('domain_listings').select('*', { count: 'exact', head: true }),
        supabase.from('domain_verifications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('domain_listings').select('*', { count: 'exact', head: true }).eq('status', 'available'),
        supabase.from('domain_offers').select('*', { count: 'exact', head: true }),
        supabase.from('transactions').select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);
      
      setStats({
        total_domains: totalDomains || 0,
        pending_verifications: pendingVerifications || 0,
        active_listings: activeListings || 0,
        total_offers: totalOffers || 0,
        recent_transactions: recentTransactions || 0,
      });
    } catch (error: any) {
      console.error('Error loading admin stats:', error);
      toast.error(t('admin.stats.loadError', '加载管理统计信息失败'));
    } finally {
      setIsLoading(false);
      setIsRefreshingStats(false);
    }
  };

  // 如果用户未登录或不是管理员，显示错误页面
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">{t('admin.accessDeniedTitle', '访问被拒绝')}</h1>
          <p className="text-gray-600">{t('admin.accessDeniedMessage', '您没有权限访问此页面')}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate('/')}
          >
            {t('common.backToHome', '返回首页')}
          </Button>
        </div>
      </div>
    );
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // 只有在切换到仪表盘时才刷新统计数据
    if (value === 'dashboard' && !isLoading) {
      loadAdminStats();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.title', '管理员控制面板')}</h1>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadAdminStats}
            disabled={isRefreshingStats}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshingStats ? "animate-spin" : ""}`} />
            {t('common.refresh', '刷新')}
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="dashboard">{t('admin.tabs.dashboard', '仪表盘')}</TabsTrigger>
            <TabsTrigger value="verifications">{t('admin.tabs.verifications', '待验证域名')}</TabsTrigger>
            <TabsTrigger value="domains">{t('admin.tabs.domains', '所有域名')}</TabsTrigger>
            <TabsTrigger value="users">{t('admin.tabs.users', '用户管理')}</TabsTrigger>
            <TabsTrigger value="settings">{t('admin.tabs.settings', '网站设置')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <AdminDashboard stats={stats} isLoading={isLoading} onRefresh={loadAdminStats} />
          </TabsContent>
          
          <TabsContent value="verifications">
            <PendingVerifications />
          </TabsContent>
          
          <TabsContent value="domains">
            <AllDomainListings />
          </TabsContent>
          
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="settings">
            <SiteSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
