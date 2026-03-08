
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/types/userProfile";
import { 
  Globe, 
  DollarSign, 
  TrendingUp, 
  ShoppingCart,
  Eye,
  Heart,
  MessageSquare,
  Award,
  Package,
  CheckCircle,
  Shield
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface UserCenterStatsGridProps {
  profile: UserProfile | null;
  user: User;
}

interface UserStats {
  totalDomains: number;
  totalValue: number;
  totalViews: number;
  totalOffers: number;
  totalFavorites: number;
  completedTransactions: number;
  activeListings: number;
  avgRating: number;
}

export const UserCenterStatsGrid = ({ profile, user }: UserCenterStatsGridProps) => {
  const isMobile = useIsMobile();
  const [stats, setStats] = useState<UserStats>({
    totalDomains: 0,
    totalValue: 0,
    totalViews: 0,
    totalOffers: 0,
    totalFavorites: 0,
    completedTransactions: 0,
    activeListings: 0,
    avgRating: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        // 获取用户域名统计
        const { data: domains, error: domainsError } = await supabase
          .from('domain_listings')
          .select('id, price, status')
          .eq('owner_id', user.id);

        if (domainsError) throw domainsError;

        const totalDomains = domains?.length || 0;
        const activeListings = domains?.filter(d => d.status === 'available').length || 0;
        const totalValue = domains?.reduce((sum, domain) => sum + (Number(domain.price) || 0), 0) || 0;

        // 获取域名分析数据
        const { data: analytics, error: analyticsError } = await supabase
          .from('domain_analytics')
          .select('views, offers, favorites')
          .in('domain_id', domains?.map(d => d.id) || []);

        if (analyticsError) throw analyticsError;

        const totalViews = analytics?.reduce((sum, item) => sum + (item.views || 0), 0) || 0;
        const totalOffers = analytics?.reduce((sum, item) => sum + (item.offers || 0), 0) || 0;
        const totalFavorites = analytics?.reduce((sum, item) => sum + (item.favorites || 0), 0) || 0;

        // 获取交易统计
        const { data: transactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('status')
          .eq('buyer_id', user.id);

        if (transactionsError) throw transactionsError;

        const completedTransactions = transactions?.filter(t => t.status === 'completed').length || 0;

        // 获取用户评分
        const { data: reviews, error: reviewsError } = await supabase
          .from('user_reviews')
          .select('rating')
          .eq('reviewed_user_id', user.id);

        if (reviewsError) throw reviewsError;

        const avgRating = reviews?.length 
          ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length 
          : 0;

        setStats({
          totalDomains,
          totalValue,
          totalViews,
          totalOffers,
          totalFavorites,
          completedTransactions,
          activeListings,
          avgRating
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStats();
  }, [user?.id]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const statsCards = [
    {
      title: '我的域名',
      value: stats.totalDomains.toString(),
      icon: Globe,
      description: `${stats.activeListings} 个正在出售`,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: '总价值',
      value: formatCurrency(stats.totalValue),
      icon: DollarSign,
      description: '所有域名估值总和',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      title: '总浏览量',
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      description: '域名页面总访问次数',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: '收到报价',
      value: stats.totalOffers.toString(),
      icon: MessageSquare,
      description: '买家发送的报价数量',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-500/10'
    },
    {
      title: '被收藏',
      value: stats.totalFavorites.toString(),
      icon: Heart,
      description: '域名被收藏的次数',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10'
    },
    {
      title: '完成交易',
      value: stats.completedTransactions.toString(),
      icon: ShoppingCart,
      description: '成功完成的交易数量',
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-500/10'
    }
  ];

  if (isLoading) {
    return (
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'} gap-3`}>
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-14 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'} gap-3`}>
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow duration-200 border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.title}</p>
            </CardContent>
          </Card>
        );
      })}
      
      {profile?.is_seller && !isMobile && (
        <Card className="hover:shadow-md transition-shadow duration-200 border-border/60 col-span-2 md:col-span-3 lg:col-span-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-500/10 p-2 rounded-lg">
                  <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">卖家评分</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                      {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '暂无'}
                    </span>
                    {stats.avgRating > 0 && (
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < Math.round(stats.avgRating) ? 'bg-yellow-400' : 'bg-muted'}`} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {profile.seller_verified && (
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" /> 已认证卖家
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
