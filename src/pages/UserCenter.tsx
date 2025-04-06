
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
import { User, Settings, ClipboardList, Home, Award, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

export const UserCenter = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('domains');
  const [showHelp, setShowHelp] = useState(false);

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

        {showHelp && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                用户中心使用帮助
              </CardTitle>
              <CardDescription className="text-blue-600">
                在这里您可以管理您的域名、查看交易记录并更新个人资料
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-3 rounded border border-blue-100">
                  <h3 className="font-bold text-blue-800 mb-1 flex items-center gap-1">
                    <ClipboardList className="h-4 w-4" />
                    我的域名
                  </h3>
                  <p className="text-gray-600">管理您拥有的域名，上架或下架它们</p>
                </div>
                <div className="bg-white p-3 rounded border border-blue-100">
                  <h3 className="font-bold text-blue-800 mb-1 flex items-center gap-1">
                    <ClipboardList className="h-4 w-4" />
                    交易记录
                  </h3>
                  <p className="text-gray-600">查看您的所有域名买卖交易记录</p>
                </div>
                <div className="bg-white p-3 rounded border border-blue-100">
                  <h3 className="font-bold text-blue-800 mb-1 flex items-center gap-1">
                    <User className="h-4 w-4" />
                    个人资料
                  </h3>
                  <p className="text-gray-600">更新您的个人信息和账户设置</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowHelp(false)}
                  className="text-blue-700"
                >
                  关闭帮助
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5" />
                账户状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{profile?.account_level || "基础用户"}</p>
              <p className="text-xs opacity-80 mt-1">注册时间: {new Date(user?.created_at || Date.now()).toLocaleDateString()}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">我的域名</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{profile?.domains_count || 0}</p>
              <p className="text-xs text-gray-500 mt-1">在售域名</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">成功交易</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{profile?.completed_transactions || 0}</p>
              <p className="text-xs text-gray-500 mt-1">已完成交易</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">余额</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${profile?.balance || "0.00"}</p>
              <p className="text-xs text-gray-500 mt-1">账户余额</p>
            </CardContent>
          </Card>
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
