import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCenterHelpCard } from '@/components/usercenter/UserCenterHelpCard';
import { UserCenterStatsGrid } from '@/components/usercenter/UserCenterStatsGrid';
import { UserCenterTabsContent } from '@/components/usercenter/UserCenterTabsContent';
import { UserCenterLayout } from '@/components/usercenter/UserCenterLayout';
import { Button } from "@/components/ui/button";
import { Home, HelpCircle, Settings, ClipboardList, User, Bell, MessageSquare, FileQuestion } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { useNotifications } from '@/hooks/useNotifications';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Card, CardContent } from "@/components/ui/card";

export const UserCenter = () => {
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('domains');
  const [showHelp, setShowHelp] = useState(false);

  const { unreadCount, refreshNotifications } = useNotifications();

  const displayName = useMemo(() => {
    return profile?.full_name || user?.email?.split('@')[0] || '用户';
  }, [profile?.full_name, user?.email]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      toast.error('会话已失效，请重新登录');
      navigate('/auth', { replace: true });
    }
  }, [isAuthLoading, user, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['domains', 'transactions', 'profile', 'notifications'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.history.replaceState({}, '', `/user-center?tab=${value}`);
    if (value === 'notifications') refreshNotifications();
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">正在加载用户中心...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">需要登录</h2>
            <p className="text-gray-600 mb-4">请登录后访问用户中心</p>
            <Button onClick={() => navigate('/auth')}>
              前往登录
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar unreadCount={unreadCount} />
      
      <UserCenterLayout profile={profile} user={user}>
        {/* 快捷操作区域 */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              返回首页
            </Button>
            
            {profile?.is_admin && (
              <Button 
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
              >
                <Settings className="w-4 h-4" />
                管理员面板
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              帮助中心
            </Button>
          </div>
        </div>

        <UserCenterHelpCard open={showHelp} onClose={() => setShowHelp(false)} />
        
        {/* 统计数据网格 */}
        <UserCenterStatsGrid profile={profile} user={user} />

        {/* 主要功能标签页 */}
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="border-b border-gray-200 bg-white rounded-t-lg">
                <TabsList className="grid w-full grid-cols-4 bg-transparent h-auto p-0">
                  <TabsTrigger 
                    value="domains" 
                    className="flex items-center gap-2 py-4 px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700 rounded-none border-b-2 border-transparent hover:bg-gray-50 transition-all"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span className="hidden sm:inline">我的域名</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="transactions" 
                    className="flex items-center gap-2 py-4 px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700 rounded-none border-b-2 border-transparent hover:bg-gray-50 transition-all"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span className="hidden sm:inline">交易记录</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notifications" 
                    className="flex items-center gap-2 py-4 px-6 relative data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700 rounded-none border-b-2 border-transparent hover:bg-gray-50 transition-all"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="hidden sm:inline">通知中心</span>
                    {unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold min-w-[1.2rem] h-5 flex items-center justify-center rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="profile" 
                    className="flex items-center gap-2 py-4 px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700 rounded-none border-b-2 border-transparent hover:bg-gray-50 transition-all"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">个人设置</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="p-6">
                <UserCenterTabsContent />
              </div>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* 帮助和支持区域 */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">需要帮助？</h3>
            </div>
            <p className="text-blue-700 mb-4">我们的客户服务团队随时为您提供支持</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/contact">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  联系客服
                </Button>
              </Link>
              <Link to="/faq">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100 flex items-center gap-2">
                  <FileQuestion className="w-4 h-4" />
                  常见问题
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </UserCenterLayout>
    </div>
  );
};

export default UserCenter;