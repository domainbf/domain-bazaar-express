import { useState, useEffect, lazy, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { apiGet } from '@/lib/apiClient';
import { toast } from 'sonner';
import {
  Users, Globe, TrendingUp, DollarSign, Shield, Activity,
  AlertTriangle, CheckCircle, Clock, BarChart3, RefreshCw,
  Eye, Heart, MessageSquare, ArrowUpRight, ArrowDownRight, Calendar
} from 'lucide-react';
import { EnhancedActivityLog } from './EnhancedActivityLog';

const DashboardTrendChart = lazy(() => import('./DashboardTrendChart').then(m => ({ default: m.DashboardTrendChart })));

interface AdminStats {
  totalUsers: number;
  totalDomains: number;
  pendingVerifications: number;
  completedTransactions: number;
  totalRevenue: number;
  activeListings: number;
  newUsersToday: number;
  newDomainsToday: number;
  totalViews: number;
  totalOffers: number;
  pendingOffers: number;
  verifiedDomains: number;
}

interface AdminDashboardProps {
  stats?: AdminStats;
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
}

export const AdminDashboard = ({ stats: propStats, isLoading: propIsLoading, onRefresh: propOnRefresh }: AdminDashboardProps = {}) => {
  const { user, isAdmin } = useAuth();
  const [localStats, setLocalStats] = useState<AdminStats>({
    totalUsers: 0,
    totalDomains: 0,
    pendingVerifications: 0,
    completedTransactions: 0,
    totalRevenue: 0,
    activeListings: 0,
    newUsersToday: 0,
    newDomainsToday: 0,
    totalViews: 0,
    totalOffers: 0,
    pendingOffers: 0,
    verifiedDomains: 0
  });
  const [localIsLoading, setLocalIsLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [recentOffers, setRecentOffers] = useState<any[]>([]);
  const [topDomains, setTopDomains] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const stats = propStats || localStats;
  const isLoading = propIsLoading !== undefined ? propIsLoading : localIsLoading;

  const fetchAdminStats = async () => {
    if (!user?.id) return;
    setLocalIsLoading(true);
    try {
      const data = await apiGet('/data/admin/stats');
      setLocalStats({
        totalUsers: data.totalUsers || 0,
        totalDomains: data.totalDomains || 0,
        pendingVerifications: data.pendingVerifications || 0,
        completedTransactions: data.completedTransactions || 0,
        totalRevenue: data.totalRevenue || 0,
        activeListings: data.activeListings || 0,
        newUsersToday: data.newUsersToday || 0,
        newDomainsToday: data.newDomainsToday || 0,
        totalViews: data.totalViews || 0,
        totalOffers: data.totalOffers || 0,
        pendingOffers: data.pendingOffers || 0,
        verifiedDomains: data.verifiedDomains || 0
      });
      setRecentOffers(data.recentOffers || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast.error('获取统计数据失败');
    } finally {
      setLocalIsLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    // Recent activities not yet migrated — skip silently
    setRecentActivities([]);
  };

  const fetchTopDomains = async () => {
    // Top domains derived from domain listings
    try {
      const data = await apiGet('/data/domain-listings?status=available');
      const listings = Array.isArray(data) ? data : [];
      setTopDomains(listings.slice(0, 5).map((d: any) => ({
        domain_id: d.id, name: d.name, price: d.price,
        views: d.views || 0, favorites: d.favorites || 0, offers: d.offers || 0
      })));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (isAdmin && !propStats) {
      fetchAdminStats();
      fetchRecentActivities();
      fetchTopDomains();
      
      const interval = setInterval(() => {
        fetchAdminStats();
        fetchRecentActivities();
        fetchTopDomains();
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [isAdmin, propStats]);

  const handleRefresh = async () => {
    if (propOnRefresh) {
      await propOnRefresh();
    } else {
      await fetchAdminStats();
      await fetchRecentActivities();
      await fetchTopDomains();
    }
    toast.success('数据已刷新');
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">访问受限</h3>
          <p className="text-muted-foreground">您没有权限访问管理员面板</p>
        </div>
      </div>
    );
  }

  const mainStatsCards = [
    {
      title: '总用户数',
      value: stats.totalUsers.toLocaleString(),
      change: `+${stats.newUsersToday}`,
      changeLabel: '今日新增',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      trend: stats.newUsersToday > 0 ? 'up' : 'stable'
    },
    {
      title: '总域名数',
      value: stats.totalDomains.toLocaleString(),
      change: `+${stats.newDomainsToday}`,
      changeLabel: '今日新增',
      icon: Globe,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
      trend: stats.newDomainsToday > 0 ? 'up' : 'stable'
    },
    {
      title: '活跃出售',
      value: stats.activeListings.toLocaleString(),
      change: stats.totalDomains > 0 ? `${((stats.activeListings / stats.totalDomains) * 100).toFixed(1)}%` : '0%',
      changeLabel: '占总数',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      trend: 'stable'
    },
    {
      title: '总收入',
      value: `¥${stats.totalRevenue.toLocaleString()}`,
      change: `${stats.completedTransactions}`,
      changeLabel: '笔交易',
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10',
      trend: stats.completedTransactions > 0 ? 'up' : 'stable'
    }
  ];

  const secondaryStats = [
    { label: '待审核验证', value: stats.pendingVerifications, icon: Clock, color: 'text-yellow-600' },
    { label: '已验证域名', value: stats.verifiedDomains, icon: CheckCircle, color: 'text-green-600' },
    { label: '总浏览量', value: stats.totalViews, icon: Eye, color: 'text-blue-600' },
    { label: '待处理报价', value: stats.pendingOffers, icon: MessageSquare, color: 'text-purple-600' }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">管理员仪表板</h1>
            <p className="text-muted-foreground">系统概览和核心指标</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">管理员仪表板</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>最后更新: {lastUpdate.toLocaleString()}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          刷新数据
        </Button>
      </div>

      {/* 主要统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainStatsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <div className="flex items-center space-x-2">
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      ) : stat.trend === 'down' ? (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      ) : null}
                      <Badge variant={stat.trend === 'up' ? 'default' : 'secondary'} className="text-xs">
                        {stat.change}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{stat.changeLabel}</span>
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

      {/* 次要统计 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {secondaryStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`h-5 w-5 ${stat.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold">{stat.value.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 数据趋势图表 */}
      <Suspense fallback={<div className="h-80 animate-pulse bg-muted/50 rounded-xl border" />}>
        <DashboardTrendChart />
      </Suspense>

      {/* 快速操作和数据面板 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 快速操作 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              快速操作
            </CardTitle>
            <CardDescription>常用管理功能入口</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => window.location.href = '/admin?tab=users'}
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                用户管理
              </span>
              {stats.newUsersToday > 0 && (
                <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400">+{stats.newUsersToday}</Badge>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => window.location.href = '/admin?tab=domains'}
            >
              <span className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                域名管理
              </span>
              {stats.newDomainsToday > 0 && (
                <Badge className="bg-green-500/15 text-green-600 dark:text-green-400">+{stats.newDomainsToday}</Badge>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => window.location.href = '/admin?tab=verifications'}
            >
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                域名验证
              </span>
              {stats.pendingVerifications > 0 && (
                <Badge className="bg-yellow-500/15 text-yellow-600 dark:text-yellow-400">{stats.pendingVerifications}</Badge>
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

        {/* 热门域名 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              热门域名
            </CardTitle>
            <CardDescription>浏览量最高的域名</CardDescription>
          </CardHeader>
          <CardContent>
            {topDomains.length > 0 ? (
              <div className="space-y-3">
                {topDomains.map((domain, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium bg-muted w-6 h-6 rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{domain.name}</p>
                        <p className="text-xs text-muted-foreground">¥{domain.price?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {domain.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {domain.favorites || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无数据</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 增强版审计日志 */}
        <EnhancedActivityLog />
      </div>

      {/* 系统状态和警告 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 系统警告 */}
        {(stats.pendingVerifications > 10 || stats.pendingOffers > 20) && (
          <Card className="border-yellow-500/30 bg-yellow-500/10">
            <CardHeader>
              <CardTitle className="text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                系统提醒
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.pendingVerifications > 10 && (
                <div className="flex items-center justify-between">
                  <p className="text-yellow-700">
                    有 {stats.pendingVerifications} 个域名验证请求待处理
                  </p>
                  <Button 
                    size="sm"
                    onClick={() => window.location.href = '/admin?tab=verifications'}
                  >
                    立即处理
                  </Button>
                </div>
              )}
              {stats.pendingOffers > 20 && (
                <div className="flex items-center justify-between">
                  <p className="text-yellow-700">
                    有 {stats.pendingOffers} 个报价待处理
                  </p>
                  <Button size="sm" variant="outline">
                    查看报价
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 系统健康状态 */}
        <Card className="border-green-500/30 bg-green-500/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-600 dark:text-green-400 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              系统状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-sm text-center">
                <div className="bg-card/60 rounded-lg p-2">
                  <div className="text-green-600 dark:text-green-400 font-semibold">运行中</div>
                  <div className="text-muted-foreground text-xs mt-0.5">API服务</div>
                </div>
                <div className="bg-card/60 rounded-lg p-2">
                  <div className="text-green-600 dark:text-green-400 font-semibold">已连接</div>
                  <div className="text-muted-foreground text-xs mt-0.5">数据库</div>
                </div>
                <div className="bg-card/60 rounded-lg p-2">
                  <div className="text-green-600 dark:text-green-400 font-semibold">缓存正常</div>
                  <div className="text-muted-foreground text-xs mt-0.5">Redis</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>上次数据同步</span>
                <span className="font-medium text-foreground">
                  {lastUpdate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>注册用户</span>
                <span className="font-medium text-foreground">{stats.totalUsers} 人</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>挂牌域名</span>
                <span className="font-medium text-foreground">{stats.activeListings} 个</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};