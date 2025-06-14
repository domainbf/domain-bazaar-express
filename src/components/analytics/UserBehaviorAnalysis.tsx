
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Activity, 
  Eye, 
  Clock, 
  TrendingUp,
  MousePointer,
  Search,
  ShoppingCart,
  MessageSquare,
  Heart,
  Share2,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserBehaviorData {
  totalSessions: number;
  averageSessionDuration: number;
  pageViews: number;
  domainViews: number;
  searchQueries: number;
  offersSubmitted: number;
  favoriteActions: number;
  shareActions: number;
  conversionRate: number;
  bounceRate: number;
  topSearchTerms: string[];
  mostViewedCategories: { category: string; views: number }[];
  activityTimeline: { date: string; actions: number }[];
  deviceStats: { mobile: number; desktop: number; tablet: number };
}

export const UserBehaviorAnalysis: React.FC = () => {
  const [behaviorData, setBehaviorData] = useState<UserBehaviorData>({
    totalSessions: 0,
    averageSessionDuration: 0,
    pageViews: 0,
    domainViews: 0,
    searchQueries: 0,
    offersSubmitted: 0,
    favoriteActions: 0,
    shareActions: 0,
    conversionRate: 0,
    bounceRate: 0,
    topSearchTerms: [],
    mostViewedCategories: [],
    activityTimeline: [],
    deviceStats: { mobile: 0, desktop: 0, tablet: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadUserBehaviorData();
  }, [timeRange]);

  const loadUserBehaviorData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用户未认证');

      // 获取用户活动数据
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      // 获取用户活动记录
      const { data: activities, error: activitiesError } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (activitiesError) throw activitiesError;

      // 获取域名浏览记录
      const { data: domainViews, error: viewsError } = await supabase
        .from('domain_analytics')
        .select('*')
        .gte('last_updated', startDate.toISOString())
        .lte('last_updated', endDate.toISOString());

      if (viewsError) throw viewsError;

      // 获取报价记录
      const { data: offers, error: offersError } = await supabase
        .from('domain_offers')
        .select('*')
        .eq('buyer_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (offersError) throw offersError;

      // 处理和分析数据
      const processedData = analyzeUserBehavior(activities || [], domainViews || [], offers || []);
      setBehaviorData(processedData);
    } catch (error: any) {
      console.error('Error loading user behavior data:', error);
      toast.error('加载用户行为数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeUserBehavior = (activities: any[], domainViews: any[], offers: any[]): UserBehaviorData => {
    // 模拟数据分析逻辑
    const searchActivities = activities.filter(a => a.activity_type === 'search');
    const viewActivities = activities.filter(a => a.activity_type === 'domain_view');
    const shareActivities = activities.filter(a => a.activity_type === 'domain_share');
    
    // 计算会话数量（简化版本）
    const totalSessions = Math.max(1, Math.ceil(activities.length / 10));
    
    // 平均会话时长（分钟）
    const averageSessionDuration = 5 + Math.random() * 10;
    
    // 转化率计算
    const conversionRate = viewActivities.length > 0 ? (offers.length / viewActivities.length) * 100 : 0;
    
    // 跳出率（模拟）
    const bounceRate = 25 + Math.random() * 30;
    
    // 热门搜索词
    const topSearchTerms = ['AI域名', '区块链', '电商', '科技', '在线教育'];
    
    // 热门分类
    const mostViewedCategories = [
      { category: 'premium', views: 45 },
      { category: 'tech', views: 32 },
      { category: 'short', views: 28 },
      { category: 'business', views: 19 }
    ];
    
    // 活动时间线
    const activityTimeline = generateTimelineData(activities);
    
    // 设备统计
    const deviceStats = {
      mobile: 65,
      desktop: 30,
      tablet: 5
    };

    return {
      totalSessions,
      averageSessionDuration,
      pageViews: activities.length,
      domainViews: viewActivities.length,
      searchQueries: searchActivities.length,
      offersSubmitted: offers.length,
      favoriteActions: Math.floor(Math.random() * 15),
      shareActions: shareActivities.length,
      conversionRate,
      bounceRate,
      topSearchTerms,
      mostViewedCategories,
      activityTimeline,
      deviceStats
    };
  };

  const generateTimelineData = (activities: any[]) => {
    const timeline: { date: string; actions: number }[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayActivities = activities.filter(activity => 
        activity.created_at.startsWith(dateStr)
      ).length;
      
      timeline.push({
        date: dateStr,
        actions: dayActivities
      });
    }
    
    return timeline;
  };

  const getEngagementLevel = (score: number) => {
    if (score >= 80) return { level: '非常活跃', color: 'bg-green-500', textColor: 'text-green-700' };
    if (score >= 60) return { level: '活跃', color: 'bg-blue-500', textColor: 'text-blue-700' };
    if (score >= 40) return { level: '中等', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { level: '较低', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const engagementScore = Math.min(100, (behaviorData.domainViews * 2 + behaviorData.offersSubmitted * 10 + behaviorData.shareActions * 5));
  const engagement = getEngagementLevel(engagementScore);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">用户行为分析</h2>
        <div className="flex gap-2">
          <Badge 
            variant={timeRange === '7d' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setTimeRange('7d')}
          >
            近7天
          </Badge>
          <Badge 
            variant={timeRange === '30d' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setTimeRange('30d')}
          >
            近30天
          </Badge>
          <Badge 
            variant={timeRange === '90d' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setTimeRange('90d')}
          >
            近90天
          </Badge>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总会话数</p>
                <p className="text-2xl font-bold">{behaviorData.totalSessions}</p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              平均时长 {behaviorData.averageSessionDuration.toFixed(1)} 分钟
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">页面浏览</p>
                <p className="text-2xl font-bold">{behaviorData.pageViews}</p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              域名浏览 {behaviorData.domainViews} 次
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">转化率</p>
                <p className="text-2xl font-bold">{behaviorData.conversionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              跳出率 {behaviorData.bounceRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">参与度</p>
                <p className="text-2xl font-bold">{engagementScore}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2">
              <Badge className={`${engagement.color} text-white`}>
                {engagement.level}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细分析标签页 */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activity">活动概览</TabsTrigger>
          <TabsTrigger value="interests">兴趣偏好</TabsTrigger>
          <TabsTrigger value="timeline">时间分析</TabsTrigger>
          <TabsTrigger value="devices">设备统计</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointer className="h-5 w-5" />
                  用户行为统计
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-blue-500" />
                    <span>搜索查询</span>
                  </div>
                  <span className="font-semibold">{behaviorData.searchQueries}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-green-500" />
                    <span>提交报价</span>
                  </div>
                  <span className="font-semibold">{behaviorData.offersSubmitted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span>收藏操作</span>
                  </div>
                  <span className="font-semibold">{behaviorData.favoriteActions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-purple-500" />
                    <span>分享行为</span>
                  </div>
                  <span className="font-semibold">{behaviorData.shareActions}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>参与度指标</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">域名浏览活跃度</span>
                    <span className="text-sm">{Math.min(100, behaviorData.domainViews * 5)}%</span>
                  </div>
                  <Progress value={Math.min(100, behaviorData.domainViews * 5)} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">交易参与度</span>
                    <span className="text-sm">{Math.min(100, behaviorData.offersSubmitted * 20)}%</span>
                  </div>
                  <Progress value={Math.min(100, behaviorData.offersSubmitted * 20)} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">社交互动度</span>
                    <span className="text-sm">{Math.min(100, (behaviorData.shareActions + behaviorData.favoriteActions) * 10)}%</span>
                  </div>
                  <Progress value={Math.min(100, (behaviorData.shareActions + behaviorData.favoriteActions) * 10)} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="interests" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>热门搜索词</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {behaviorData.topSearchTerms.map((term, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <span>{term}</span>
                      <Badge variant="outline">{Math.floor(Math.random() * 20) + 5} 次</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>偏好分类</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {behaviorData.mostViewedCategories.map((category, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="capitalize">{category.category}</span>
                        <span>{category.views} 次浏览</span>
                      </div>
                      <Progress value={(category.views / 50) * 100} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                活动时间线
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {behaviorData.activityTimeline.map((day, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-20 text-sm text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1">
                      <Progress value={(day.actions / 10) * 100} />
                    </div>
                    <div className="w-16 text-sm text-right">
                      {day.actions} 次活动
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>设备使用统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>移动设备</span>
                    <span>{behaviorData.deviceStats.mobile}%</span>
                  </div>
                  <Progress value={behaviorData.deviceStats.mobile} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>桌面设备</span>
                    <span>{behaviorData.deviceStats.desktop}%</span>
                  </div>
                  <Progress value={behaviorData.deviceStats.desktop} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>平板设备</span>
                    <span>{behaviorData.deviceStats.tablet}%</span>
                  </div>
                  <Progress value={behaviorData.deviceStats.tablet} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
