
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Users,
  Globe,
  TrendingUp,
  DollarSign,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalDomains: number;
  pendingVerifications: number;
  completedTransactions: number;
  totalRevenue: number;
  activeListings: number;
  newUsersToday: number;
  newDomainsToday: number;
}

export const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalDomains: 0,
    pendingVerifications: 0,
    completedTransactions: 0,
    totalRevenue: 0,
    activeListings: 0,
    newUsersToday: 0,
    newDomainsToday: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminStats();
      fetchRecentActivities();
    }
  }, [isAdmin]);

  const fetchAdminStats = async () => {
    setIsLoading(true);
    try {
      // 获取用户统计
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, created_at');
      
      if (usersError) throw usersError;

      // 获取域名统计
      const { data: domainsData, error: domainsError } = await supabase
        .from('domain_listings')
        .select('id, status, price, created_at');
      
      if (domainsError) throw domainsError;

      // 获取验证统计
      const { data: verificationsData, error: verificationsError } = await supabase
        .from('domain_verifications')
        .select('id, status');
      
      if (verificationsError) throw verificationsError;

      // 获取交易统计
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('id, status, amount');
      
      if (transactionsError) throw transactionsError;

      // 计算今天的数据
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const newUsersToday = usersData?.filter(user => 
        new Date(user.created_at) >= today
      ).length || 0;

      const newDomainsToday = domainsData?.filter(domain => 
        new Date(domain.created_at) >= today
      ).length || 0;

      const totalRevenue = transactionsData
        ?.filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;

      setStats({
        totalUsers: usersData?.length || 0,
        totalDomains: domainsData?.length || 0,
        pendingVerifications: verificationsData?.filter(v => v.status === 'pending').length || 0,
        completedTransactions: transactionsData?.filter(t => t.status === 'completed').length || 0,
        totalRevenue,
        activeListings: domainsData?.filter(d => d.status === 'available').length || 0,
        newUsersToday,
        newDomainsToday
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast.error('获取统计数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const { data: activities, error } = await supabase
        .from('user_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentActivities(activities || []);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">访问受限</h3>
          <p className="text-gray-600">您没有权限访问管理员面板</p>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: '总用户数',
      value: stats.totalUsers.toLocaleString(),
      change: `+${stats.newUsersToday}`,
      changeLabel: '今日新增',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: '总域名数',
      value: stats.totalDomains.toLocaleString(),
      change: `+${stats.newDomainsToday}`,
      changeLabel: '今日新增',
      icon: Globe,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: '活跃出售',
      value: stats.activeListings.toLocaleString(),
      change: `${((stats.activeListings / stats.totalDomains) * 100).toFixed(1)}%`,
      changeLabel: '占总数',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: '总收入',
      value: `¥${stats.totalRevenue.toLocaleString()}`,
      change: `${stats.completedTransactions}`,
      changeLabel: '笔交易',
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: '待审核',
      value: stats.pendingVerifications.toLocaleString(),
      change: stats.pendingVerifications > 5 ? '需关注' : '正常',
      changeLabel: '验证状态',
      icon: AlertTriangle,
      color: stats.pendingVerifications > 5 ? 'text-red-600' : 'text-yellow-600',
      bgColor: stats.pendingVerifications > 5 ? 'bg-red-50' : 'bg-yellow-50'
    },
    {
      title: '系统状态',
      value: '正常',
      change: '99.9%',
      changeLabel: '可用率',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">管理员仪表板</h1>
          <p className="text-gray-600">系统概览和核心指标</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchAdminStats();
              fetchRecentActivities();
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>
        </div>
      </div>

      {/* 统计卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
                    <div className="space-y-1">
                      <p className={`text-2xl font-bold ${stat.color}`}>
                        {stat.value}
                      </p>
                      <div className="flex items-center space-x-1">
                        <Badge variant="secondary" className="text-xs">
                          {stat.change}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {stat.changeLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-full`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 快速操作和近期活动 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 快速操作 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              快速操作
            </CardTitle>
            <CardDescription>
              常用的管理功能快捷入口
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => window.location.href = '/admin?tab=users'}
            >
              <Users className="h-4 w-4 mr-2" />
              用户管理
              {stats.newUsersToday > 0 && (
                <Badge className="ml-auto bg-blue-100 text-blue-800">
                  +{stats.newUsersToday}
                </Badge>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => window.location.href = '/admin?tab=domains'}
            >
              <Globe className="h-4 w-4 mr-2" />
              域名管理
              {stats.newDomainsToday > 0 && (
                <Badge className="ml-auto bg-green-100 text-green-800">
                  +{stats.newDomainsToday}
                </Badge>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => window.location.href = '/admin?tab=verifications'}
            >
              <Shield className="h-4 w-4 mr-2" />
              域名验证
              {stats.pendingVerifications > 0 && (
                <Badge className="ml-auto bg-yellow-100 text-yellow-800">
                  {stats.pendingVerifications}
                </Badge>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => window.location.href = '/admin?tab=settings'}
            >
              <Activity className="h-4 w-4 mr-2" />
              系统设置
            </Button>
          </CardContent>
        </Card>

        {/* 近期活动 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              近期活动
            </CardTitle>
            <CardDescription>
              系统中的最新操作记录
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">
                          {activity.activity_type}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      新
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无近期活动</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 系统警告和通知 */}
      {stats.pendingVerifications > 10 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              系统提醒
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700">
              当前有 {stats.pendingVerifications} 个域名验证请求待处理，建议及时审核。
            </p>
            <Button 
              className="mt-3 bg-yellow-600 hover:bg-yellow-700"
              size="sm"
              onClick={() => window.location.href = '/admin?tab=verifications'}
            >
              立即处理
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
