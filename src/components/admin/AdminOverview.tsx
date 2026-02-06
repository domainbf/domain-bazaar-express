import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  Eye,
  Heart,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Zap,
  Target,
  BarChart3
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
  totalViews: number;
  totalOffers: number;
  pendingOffers: number;
  verifiedDomains: number;
}

interface AdminOverviewProps {
  stats: AdminStats;
  isLoading?: boolean;
}

export const AdminOverview = ({ stats, isLoading }: AdminOverviewProps) => {
  const mainStatsCards = [
    {
      title: '总用户数',
      value: stats.totalUsers.toLocaleString(),
      change: `+${stats.newUsersToday}`,
      changeLabel: '今日新增',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      trend: stats.newUsersToday > 0 ? 'up' : 'stable'
    },
    {
      title: '总域名数',
      value: stats.totalDomains.toLocaleString(),
      change: `+${stats.newDomainsToday}`,
      changeLabel: '今日新增',
      icon: Globe,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      trend: stats.newDomainsToday > 0 ? 'up' : 'stable'
    },
    {
      title: '活跃出售',
      value: stats.activeListings.toLocaleString(),
      change: stats.totalDomains > 0 ? `${((stats.activeListings / stats.totalDomains) * 100).toFixed(1)}%` : '0%',
      changeLabel: '占总数',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      trend: 'stable'
    },
    {
      title: '总收入',
      value: `¥${stats.totalRevenue.toLocaleString()}`,
      change: `${stats.completedTransactions}`,
      changeLabel: '笔交易',
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      trend: stats.completedTransactions > 0 ? 'up' : 'stable'
    }
  ];

  const performanceMetrics = [
    {
      label: '域名验证率',
      value: stats.totalDomains > 0 ? Math.round((stats.verifiedDomains / stats.totalDomains) * 100) : 0,
      target: 80,
      color: 'bg-green-500'
    },
    {
      label: '报价处理率',
      value: stats.totalOffers > 0 ? Math.round(((stats.totalOffers - stats.pendingOffers) / stats.totalOffers) * 100) : 0,
      target: 90,
      color: 'bg-blue-500'
    },
    {
      label: '用户活跃度',
      value: stats.totalUsers > 0 ? Math.min(Math.round((stats.totalViews / (stats.totalUsers * 10)) * 100), 100) : 0,
      target: 70,
      color: 'bg-purple-500'
    }
  ];

  const quickStats = [
    { label: '待审核验证', value: stats.pendingVerifications, icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { label: '已验证域名', value: stats.verifiedDomains, icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: '总浏览量', value: stats.totalViews, icon: Eye, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: '待处理报价', value: stats.pendingOffers, icon: MessageSquare, color: 'text-purple-600', bgColor: 'bg-purple-50' }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 主要统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainStatsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-l-4 ${stat.borderColor}`}>
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

      {/* 快速统计和性能指标 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 快速统计 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              实时概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {quickStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-lg font-bold">{stat.value.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 性能指标 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              关键绩效指标
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{metric.label}</span>
                  <span className={metric.value >= metric.target ? 'text-green-600' : 'text-yellow-600'}>
                    {metric.value}% / {metric.target}%
                  </span>
                </div>
                <div className="relative">
                  <Progress value={metric.value} className="h-2" />
                  <div 
                    className="absolute top-0 h-2 w-0.5 bg-gray-400"
                    style={{ left: `${metric.target}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 系统状态 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            系统状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="text-sm font-medium">数据库</p>
                <p className="text-xs text-muted-foreground">运行正常</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="text-sm font-medium">Edge Functions</p>
                <p className="text-xs text-muted-foreground">运行正常</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="text-sm font-medium">邮件服务</p>
                <p className="text-xs text-muted-foreground">运行正常</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="text-sm font-medium">存储服务</p>
                <p className="text-xs text-muted-foreground">运行正常</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
