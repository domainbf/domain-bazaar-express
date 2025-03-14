
import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DomainManagement } from '@/components/usercenter/DomainManagement';
import { ProfileSettings } from '@/components/usercenter/ProfileSettings';
import { TransactionHistory } from '@/components/usercenter/TransactionHistory';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { User, Settings, ClipboardList } from 'lucide-react';

export const UserCenter = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('domains');

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      toast.error('请登录以访问您的账户');
      navigate('/');
      return;
    }
    setIsLoading(false);
  }, [user, navigate]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL without refreshing
    window.history.pushState({}, '', `/user-center?tab=${value}`);
  };

  useEffect(() => {
    // Read initial tab from URL query param
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['domains', 'transactions', 'profile'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 flex justify-center items-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black">用户中心</h1>
            <p className="text-gray-600">
              欢迎回来, {profile?.full_name || user?.email?.split('@')[0] || '用户'}
            </p>
          </div>
          
          {profile?.is_admin && (
            <div>
              <button 
                onClick={() => navigate('/admin')}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Settings className="w-4 h-4" />
                管理员面板
              </button>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-6 bg-white border">
            <TabsTrigger value="domains" className="flex items-center gap-1 data-[state=active]:bg-black data-[state=active]:text-white">
              <ClipboardList className="w-4 h-4" />
              我的域名
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-1 data-[state=active]:bg-black data-[state=active]:text-white">
              <ClipboardList className="w-4 h-4" />
              交易记录
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-1 data-[state=active]:bg-black data-[state=active]:text-white">
              <User className="w-4 h-4" />
              个人资料设置
            </TabsTrigger>
          </TabsList>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <TabsContent value="domains">
              <DomainManagement />
            </TabsContent>

            <TabsContent value="transactions">
              <TransactionHistory />
            </TabsContent>

            <TabsContent value="profile">
              <ProfileSettings />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
