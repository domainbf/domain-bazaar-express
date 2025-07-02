
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
  Award
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
      description: `其中 ${stats.activeListings} 个正在出售`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: '总价值',
      value: formatCurrency(stats.totalValue),
      icon: DollarSign,
      description: '所有域名估值总和',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: '总浏览量',
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      description: '域名页面总访问次数',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: '收到报价',
      value: stats.totalOffers.toString(),
      icon: MessageSquare,
      description: '买家发送的报价数量',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: '被收藏',
      value: stats.totalFavorites.toString(),
      icon: Heart,
      description: '域名被收藏的次数',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: '完成交易',
      value: stats.completedTransactions.toString(),
      icon: ShoppingCart,
      description: '成功完成的交易数量',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
                    {profile?.is_seller && index < 2 && (
                      <Badge variant="secondary" className="text-xs">
                        卖家
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stat.description}
                    </p>
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
      
      {/* 用户评分卡片 */}
      {profile?.is_seller && (
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-medium text-gray-600">卖家评分</h3>
                  {profile.seller_verified && (
                    <Badge className="text-xs bg-green-100 text-green-800">
                      已认证
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '暂无'}
                    </p>
                    {stats.avgRating > 0 && (
                      <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full ${
                              i < Math.round(stats.avgRating) 
                                ? 'bg-yellow-400' 
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    基于买家评价的平均分数
                  </p>
                </div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-full">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
