
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DomainManagement } from '@/components/usercenter/DomainManagement';
import { ProfileSettings } from '@/components/usercenter/ProfileSettings';
import { CustomUrlSettings } from '@/components/usercenter/CustomUrlSettings';
import { TransactionHistory } from '@/components/usercenter/TransactionHistory';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const UserCenter = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect if not logged in
    if (!isLoading && !user) {
      navigate('/');
      toast.error('您需要登录才能访问用户中心');
    }
  }, [user, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-[calc(100vh-64px)]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }
  
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">用户中心</h1>
        
        {profile && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">用户账号</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {profile.full_name || user.email?.split('@')[0] || '用户'}
                </div>
                <p className="text-sm text-gray-500 mt-1">{user.email}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">账号级别</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {profile.account_level || '标准用户'}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {profile.is_seller ? '卖家账号' : '买家账号'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">我的域名</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {profile.domains_count || 0}
                </div>
                <p className="text-sm text-gray-500 mt-1">在售域名</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">交易记录</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {profile.completed_transactions || 0}
                </div>
                <p className="text-sm text-gray-500 mt-1">已完成交易</p>
              </CardContent>
            </Card>
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <TabsTrigger value="profile">个人资料</TabsTrigger>
            <TabsTrigger value="domains">我的域名</TabsTrigger>
            <TabsTrigger value="custom-url">个人主页</TabsTrigger>
            <TabsTrigger value="transactions">交易记录</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-6">
            <ProfileSettings />
          </TabsContent>
          
          <TabsContent value="domains" className="mt-6">
            <DomainManagement />
          </TabsContent>
          
          <TabsContent value="custom-url" className="mt-6">
            <CustomUrlSettings />
          </TabsContent>
          
          <TabsContent value="transactions" className="mt-6">
            <TransactionHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
