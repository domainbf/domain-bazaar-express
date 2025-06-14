import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCenterHelpCard } from '@/components/usercenter/UserCenterHelpCard';
import { UserCenterStatsGrid } from '@/components/usercenter/UserCenterStatsGrid';
import { UserCenterTabsContent } from '@/components/usercenter/UserCenterTabsContent';
import { DomainManagement } from '@/components/usercenter/DomainManagement';
import { ProfileSettings } from '@/components/usercenter/ProfileSettings';
import { TransactionHistory } from '@/components/usercenter/TransactionHistory';
import { NotificationsPanel } from '@/components/usercenter/NotificationsPanel';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { User, Settings, ClipboardList, Home, Award, HelpCircle, Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

export const UserCenter = () => {
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('domains');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }
    if (!user) {
      toast.error('请登录以访问您的账户');
      navigate('/');
      return;
    }
    setIsLoading(false);
  }, [user, isAuthLoading, navigate]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.history.replaceState({}, '', `/user-center?tab=${value}`);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['domains', 'transactions', 'profile', 'notifications'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Navbar />
        <LoadingSpinner />
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
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => navigate('/')}
              variant="outline" 
              className="flex items-center gap-1"
              size="sm"
            >
              <Home className="w-4 h-4" />
              返回首页
            </Button>
            
            {profile?.is_admin && (
              <Button 
                onClick={() => navigate('/admin')}
                variant="default"
                className="flex items-center gap-1"
                size="sm"
              >
                <Settings className="w-4 h-4" />
                管理员面板
              </Button>
            )}
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowHelp(!showHelp)}
              className="rounded-full"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <UserCenterHelpCard open={showHelp} onClose={() => setShowHelp(false)} />

        <UserCenterStatsGrid profile={profile} user={user} />

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
            <TabsTrigger value="notifications" className="flex items-center gap-1 data-[state=active]:bg-black data-[state=active]:text-white">
              <Bell className="w-4 h-4" />
              通知中心
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-1 data-[state=active]:bg-black data-[state=active]:text-white">
              <User className="w-4 h-4" />
              个人资料设置
            </TabsTrigger>
          </TabsList>
          <UserCenterTabsContent />
        </Tabs>
        
        <div className="mt-8 bg-gray-100 rounded-lg p-6 text-center">
          <h3 className="text-lg font-bold mb-2">需要帮助？</h3>
          <p className="text-gray-600 mb-4">如果您有任何问题或需要支持，请联系我们的客户服务团队</p>
          <Link to="/contact">
            <Button variant="outline" className="mr-2">
              联系客服
            </Button>
          </Link>
          <Link to="/faq">
            <Button variant="outline">
              常见问题
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
