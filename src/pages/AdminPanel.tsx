
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Settings, RefreshCw, FileText } from 'lucide-react';
import { SiteSettings } from '@/components/admin/SiteSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export const AdminPanel = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
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
    if (!authLoading && user && !isAdmin) {
      toast.error('您没有管理员权限');
      navigate('/');
      return;
    }
    
    if (!authLoading && user && isAdmin) {
      loadAdminStats();
    }
  }, [user, isAdmin, authLoading, navigate]);

  const loadAdminStats = async () => {
    try {
      setIsLoading(true);
      setIsRefreshingStats(true);
      
      console.log('Loading admin stats...');
      
      // 使用更高效的查询方式
      const statsQueries = await Promise.allSettled([
        supabase.from('domain_listings').select('*', { count: 'exact', head: true }),
        supabase.from('domain_verifications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('domain_listings').select('*', { count: 'exact', head: true }).eq('status', 'available'),
        supabase.from('domain_offers').select('*', { count: 'exact', head: true }),
        supabase.from('transactions').select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);
      
      // 处理查询结果
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
      
      console.log('Admin stats loaded successfully');
    } catch (error: any) {
      console.error('Error loading admin stats:', error);
      toast.error('加载管理统计信息失败');
    } finally {
      setIsLoading(false);
      setIsRefreshingStats(false);
    }
  };

  // 如果认证还在加载中
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>正在验证身份...</p>
        </div>
      </div>
    );
  }

  // 如果用户未登录或不是管理员
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">访问被拒绝</h1>
          <p className="text-gray-600 mb-4">您没有权限访问此页面</p>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
          >
            返回首页
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
            <h1 className="text-3xl font-bold text-gray-900">管理员控制面板</h1>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadAdminStats}
            disabled={isRefreshingStats}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshingStats ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="dashboard">仪表盘</TabsTrigger>
            <TabsTrigger value="verifications">待验证域名</TabsTrigger>
            <TabsTrigger value="domains">所有域名</TabsTrigger>
            <TabsTrigger value="users">用户管理</TabsTrigger>
            <TabsTrigger value="content">内容管理</TabsTrigger>
            <TabsTrigger value="settings">网站设置</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <AdminDashboard />
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
          
          <TabsContent value="content">
            <ContentManagement />
          </TabsContent>
          
          <TabsContent value="settings">
            <SiteSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
