
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

export const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin, if not redirect
    const checkAdminStatus = async () => {
      if (!user) {
        navigate('/');
        toast.error('您需要登录才能访问管理面板');
        return;
      }
      
      if (!isAdmin) {
        try {
          // Try to fetch admin status from database
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
    
    // Promote user to admin if needed
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
            <AdminDashboard />
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
