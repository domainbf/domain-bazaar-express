
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
  const { user, isAdmin, checkAdminStatus } = useAuth();
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
  const [isVerifyingAdminStatus, setIsVerifyingAdminStatus] = useState(true);
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  useEffect(() => {
    const verifyAndLoad = async () => {
      setIsVerifyingAdminStatus(true);
      // Re-check admin status when the page loads
      const adminStatus = await checkAdminStatus();
      
      if (!adminStatus) {
        toast.error(t('admin.accessDenied', '您没有管理员权限'));
        navigate('/');
        return;
      }
      
      setIsVerifyingAdminStatus(false);
      loadAdminStats();
    };
    
    verifyAndLoad();
  }, []);

  const loadAdminStats = async () => {
    setIsLoading(true);
    setIsRefreshingStats(true);
    try {
      // 并行获取统计信息，优化加载性能
      const [domainsResult, verificationsResult, activeListingsResult, offersResult, transactionsResult] = await Promise.all([
        // 获取总域名数
        supabase.from('domain_listings').select('id', { count: 'exact' }),
        
        // 获取待验证域名数
        supabase.from('domain_verifications').select('id', { count: 'exact' }).eq('status', 'pending'),
        
        // 获取活跃列表数
        supabase.from('domain_listings').select('id', { count: 'exact' }).eq('status', 'available'),
        
        // 获取报价总数
        supabase.from('domain_offers').select('id', { count: 'exact' }),
        
        // 获取最近交易数
        supabase.from('transactions').select('id', { count: 'exact' }).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);
      
      // 检查是否有任何错误
      if (domainsResult.error) throw domainsResult.error;
      if (verificationsResult.error) throw verificationsResult.error;
      if (activeListingsResult.error) throw activeListingsResult.error;
      if (offersResult.error) throw offersResult.error;
      if (transactionsResult.error) throw transactionsResult.error;
      
      setStats({
        total_domains: domainsResult.data?.length || 0,
        pending_verifications: verificationsResult.data?.length || 0,
        active_listings: activeListingsResult.data?.length || 0,
        total_offers: offersResult.data?.length || 0,
        recent_transactions: transactionsResult.data?.length || 0,
      });
    } catch (error: any) {
      console.error('Error loading admin stats:', error);
      toast.error(t('admin.stats.loadError', '加载管理统计信息失败'));
    } finally {
      setIsLoading(false);
      setIsRefreshingStats(false);
    }
  };

  if (isVerifyingAdminStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-gray-600">{t('admin.verifyingPermissions', '验证管理员权限...')}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
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
    // 切换到相应的Tab时自动刷新相关数据
    if (value === 'dashboard') {
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
