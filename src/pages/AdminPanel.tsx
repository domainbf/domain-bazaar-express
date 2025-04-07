
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
import { Shield, Settings, Loader2 } from 'lucide-react';
import { SiteSettings } from '@/components/admin/SiteSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const AdminPanel = () => {
  const { user, isAdmin, checkAdminStatus } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<AdminStats>({
    total_domains: 0,
    pending_verifications: 0,
    active_listings: 0,
    total_offers: 0,
    recent_transactions: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifyingAdminStatus, setIsVerifyingAdminStatus] = useState(true);

  useEffect(() => {
    const verifyAndLoad = async () => {
      setIsVerifyingAdminStatus(true);
      // Re-check admin status when the page loads
      const adminStatus = await checkAdminStatus();
      
      if (!adminStatus) {
        toast.error('您没有管理员权限');
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
    try {
      // Get total domains
      const { data: domains, error: domainsError } = await supabase
        .from('domain_listings')
        .select('id', { count: 'exact' });
      
      if (domainsError) throw domainsError;
      
      // Get pending verifications
      const { data: verifications, error: verificationsError } = await supabase
        .from('domain_verifications')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');
      
      if (verificationsError) throw verificationsError;
      
      // Get active listings
      const { data: activeListings, error: activeListingsError } = await supabase
        .from('domain_listings')
        .select('id', { count: 'exact' })
        .eq('status', 'available');
      
      if (activeListingsError) throw activeListingsError;
      
      // Get total offers
      const { data: offers, error: offersError } = await supabase
        .from('domain_offers')
        .select('id', { count: 'exact' });
      
      if (offersError) throw offersError;
      
      setStats({
        total_domains: domains?.length || 0,
        pending_verifications: verifications?.length || 0,
        active_listings: activeListings?.length || 0,
        total_offers: offers?.length || 0,
        recent_transactions: 0, // This would require more complex query
      });
    } catch (error: any) {
      console.error('Error loading admin stats:', error);
      toast.error(error.message || '加载管理统计信息失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifyingAdminStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-gray-600">验证管理员权限...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">访问被拒绝</h1>
          <p className="text-gray-600">您没有权限访问此页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900">管理员控制面板</h1>
        </div>
        
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="dashboard">仪表盘</TabsTrigger>
            <TabsTrigger value="verifications">待验证域名</TabsTrigger>
            <TabsTrigger value="domains">所有域名</TabsTrigger>
            <TabsTrigger value="users">用户管理</TabsTrigger>
            <TabsTrigger value="settings">网站设置</TabsTrigger>
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
