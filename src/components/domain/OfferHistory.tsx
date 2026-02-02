import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, DollarSign, Calendar, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface OfferHistoryProps {
  domainId: string;
  currentPrice: number;
}

interface Offer {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  message?: string;
}

export const OfferHistory: React.FC<OfferHistoryProps> = ({ domainId, currentPrice }) => {
  const { data: offers, isLoading } = useQuery({
    queryKey: ['offerHistory', domainId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('domain_offers')
        .select('id, amount, status, created_at, message')
        .eq('domain_id', domainId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as Offer[];
    },
    enabled: !!domainId,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-500/10 text-green-600 border-green-200 text-xs">已接受</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-600 border-red-200 text-xs">已拒绝</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200 text-xs">待处理</Badge>;
      case 'expired':
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-200 text-xs">已过期</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const getPriceComparison = (offerAmount: number) => {
    const diff = ((offerAmount - currentPrice) / currentPrice) * 100;
    if (diff > 0) {
      return (
        <span className="flex items-center text-green-600 text-xs">
          <TrendingUp className="h-3 w-3 mr-0.5" />
          +{diff.toFixed(0)}%
        </span>
      );
    } else if (diff < 0) {
      return (
        <span className="flex items-center text-red-600 text-xs">
          <TrendingDown className="h-3 w-3 mr-0.5" />
          {diff.toFixed(0)}%
        </span>
      );
    }
    return (
      <span className="flex items-center text-muted-foreground text-xs">
        <Minus className="h-3 w-3 mr-0.5" />
        0%
      </span>
    );
  };

  // 计算统计数据
  const stats = React.useMemo(() => {
    if (!offers || offers.length === 0) return null;
    
    const amounts = offers.map(o => o.amount);
    const highest = Math.max(...amounts);
    const lowest = Math.min(...amounts);
    const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const pendingCount = offers.filter(o => o.status === 'pending').length;
    
    return { highest, lowest, average, total: offers.length, pendingCount };
  }, [offers]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground">暂无出价记录</p>
        <p className="text-sm text-muted-foreground mt-1">成为第一个出价的人吧！</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计摘要 */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">最高出价</p>
            <p className="font-bold text-green-600 text-sm">¥{stats.highest.toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">最低出价</p>
            <p className="font-bold text-red-600 text-sm">¥{stats.lowest.toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">平均出价</p>
            <p className="font-bold text-primary text-sm">¥{Math.round(stats.average).toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">待处理</p>
            <p className="font-bold text-yellow-600 text-sm">{stats.pendingCount}</p>
          </div>
        </div>
      )}

      {/* 出价列表 */}
      <div className="space-y-2">
        {offers.map((offer, index) => (
          <div 
            key={offer.id} 
            className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-primary font-medium text-sm shrink-0">
                {index + 1}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base sm:text-lg">¥{offer.amount.toLocaleString()}</span>
                  {getPriceComparison(offer.amount)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <Calendar className="h-3 w-3" />
                  {formatDistanceToNow(new Date(offer.created_at), { 
                    addSuffix: true, 
                    locale: zhCN 
                  })}
                </div>
              </div>
            </div>
            <div className="shrink-0 ml-2">
              {getStatusBadge(offer.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
