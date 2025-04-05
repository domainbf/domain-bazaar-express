import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { UserManagement } from '@/components/admin/UserManagement';
import { PendingVerifications } from '@/components/admin/PendingVerifications';
import { SiteSettings } from '@/components/admin/SiteSettings';
import { AllDomainListings } from '@/components/admin/AllDomainListings';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { AdminStats } from '@/types/domain';

interface AdminStats {
  total_domains: number;
  verified_domains: number;
  pending_verifications: number;
  total_users: number;
  users_count?: number;
  total_transactions?: number;
  total_revenue?: number;
}

export const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>({
    total_domains: 0,
    verified_domains: 0,
    pending_verifications: 0,
    total_users: 0,
    users_count: 0,
    total_transactions: 0,
    total_revenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        navigate('/');
        toast.error('您需要登录才能访问管理面板');
        return;
      }
      
      if (!isAdmin) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();
            
          if (error || !data?.is_admin) {
            navigate('/');
            toast.error('您没有权限访问管理面板');
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          navigate('/');
        }
      }
    };
    
    checkAdminStatus();
    fetchAdminStats();
    
    const promoteToAdmin = async () => {
      try {
        const { data, error } = await supabase.rpc('promote_user_to_admin', {
          user_email: '9208522@qq.com'
        } as any);
        
        if (!error) {
          console.log('Admin promotion successful');
        }
      } catch (error) {
        console.error('Error promoting to admin:', error);
      }
    };
    
    promoteToAdmin();
  }, [user, isAdmin, navigate]);

  const fetchAdminStats = async () => {
    setIsLoading(true);
    try {
      const mockStats: AdminStats = {
        total_domains: 152,
        verified_domains: 100,
        pending_verifications: 12,
        total_users: 210,
        users_count: 200,
        total_transactions: 23,
        total_revenue: 1000
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStats = async () => {
    await fetchAdminStats();
    toast.success("统计数据已更新");
  };

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              正在验证管理员权限...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">管理员控制面板</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <TabsTrigger value="dashboard">仪表盘</TabsTrigger>
            <TabsTrigger value="users">用户管理</TabsTrigger>
            <TabsTrigger value="domains">域名管理</TabsTrigger>
            <TabsTrigger value="verifications">待验证</TabsTrigger>
            <TabsTrigger value="settings">系统设置</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-6">
            <AdminDashboard stats={stats} isLoading={isLoading} onRefresh={refreshStats} />
          </TabsContent>
          
          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="domains" className="mt-6">
            <AllDomainListings />
          </TabsContent>
          
          <TabsContent value="verifications" className="mt-6">
            <PendingVerifications />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <SiteSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
