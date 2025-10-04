
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DomainOffer } from '@/types/domain';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { ReceivedOffersTable } from '@/components/dashboard/ReceivedOffersTable';
import { SentOffersTable } from '@/components/dashboard/SentOffersTable';

interface TransactionStats {
  totalReceived: number;
  totalSent: number;
  totalValue: number;
  averageOffer: number;
  acceptanceRate: number;
  monthlyGrowth: number;
}

export const TransactionHistory = () => {
  const [receivedOffers, setReceivedOffers] = useState<DomainOffer[]>([]);
  const [sentOffers, setSentOffers] = useState<DomainOffer[]>([]);
  const [stats, setStats] = useState<TransactionStats>({
    totalReceived: 0,
    totalSent: 0,
    totalValue: 0,
    averageOffer: 0,
    acceptanceRate: 0,
    monthlyGrowth: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 实时监听发出的报价状态变化
  useEffect(() => {
    const channel = supabase
      .channel('sent-offers-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'domain_offers'
        },
        (payload) => {
          console.log('Sent offer updated:', payload);
          loadTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadTransactions = async () => {
    const refreshing = !isLoading;
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('用户未登录');

      // Load received offers with domain names - 使用单次查询优化
      const { data: received, error: receivedError } = await supabase
        .from('domain_offers')
        .select(`
          *,
          domain_listings (
            name,
            id
          )
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      
      if (receivedError) throw receivedError;
      
      const receivedWithDomains = (received || []).map(offer => ({
        ...offer,
        domain_name: offer.domain_listings?.name || '未知域名'
      }));
      
      setReceivedOffers(receivedWithDomains);

      // Load sent offers with domain names - 使用单次查询优化
      const { data: sent, error: sentError } = await supabase
        .from('domain_offers')
        .select(`
          *,
          domain_listings (
            name,
            id
          )
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (sentError) throw sentError;
      
      const sentWithDomains = (sent || []).map(offer => ({
        ...offer,
        domain_name: offer.domain_listings?.name || '未知域名'
      }));
      
      setSentOffers(sentWithDomains);

      // Calculate statistics
      calculateStats(receivedWithDomains, sentWithDomains);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      toast.error(error.message || '加载交易记录失败');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const calculateStats = (received: DomainOffer[], sent: DomainOffer[]) => {
    const totalReceived = received.length;
    const totalSent = sent.length;
    
    const totalReceivedValue = received.reduce((sum, offer) => sum + Number(offer.amount), 0);
    const totalSentValue = sent.reduce((sum, offer) => sum + Number(offer.amount), 0);
    const totalValue = totalReceivedValue + totalSentValue;
    
    const averageOffer = totalValue > 0 ? totalValue / (totalReceived + totalSent) : 0;
    
    const acceptedOffers = received.filter(offer => offer.status === 'accepted').length;
    const acceptanceRate = totalReceived > 0 ? (acceptedOffers / totalReceived) * 100 : 0;
    
    // Calculate monthly growth (simplified)
    const currentMonth = new Date().getMonth();
    const currentMonthOffers = [...received, ...sent].filter(offer => 
      new Date(offer.created_at).getMonth() === currentMonth
    ).length;
    const lastMonthOffers = [...received, ...sent].filter(offer => 
      new Date(offer.created_at).getMonth() === currentMonth - 1
    ).length;
    const monthlyGrowth = lastMonthOffers > 0 ? 
      ((currentMonthOffers - lastMonthOffers) / lastMonthOffers) * 100 : 0;

    setStats({
      totalReceived,
      totalSent,
      totalValue,
      averageOffer,
      acceptanceRate,
      monthlyGrowth
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* 头部带刷新按钮 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">交易记录</h2>
        <Button
          onClick={loadTransactions}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 统计概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">收到报价</p>
                <p className="text-3xl font-bold mt-1">{stats.totalReceived}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <ArrowDownRight className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-3">
              总计收到的域名报价数量
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">发出报价</p>
                <p className="text-3xl font-bold mt-1">{stats.totalSent}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-3">
              总计发出的域名报价数量
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总交易额</p>
                <p className="text-3xl font-bold mt-1">¥{stats.totalValue.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-3">
              所有交易的总金额
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">接受率</p>
                <p className="text-3xl font-bold mt-1">{stats.acceptanceRate.toFixed(1)}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-3">
              报价接受成功率
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细统计分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            交易分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">平均报价金额</div>
              <div className="text-xl font-bold text-blue-600">
                ¥{stats.averageOffer.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">月度增长</div>
              <div className="text-xl font-bold text-green-600">
                {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth.toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">活跃度评分</div>
              <div className="text-xl font-bold text-purple-600">
                {Math.min(100, Math.round((stats.totalReceived + stats.totalSent) * 2))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 交易记录表格 */}
      <Tabs defaultValue="received" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="received" className="data-[state=active]:bg-black data-[state=active]:text-white">
            收到的报价 ({stats.totalReceived})
          </TabsTrigger>
          <TabsTrigger value="sent" className="data-[state=active]:bg-black data-[state=active]:text-white">
            发出的报价 ({stats.totalSent})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          <ReceivedOffersTable offers={receivedOffers} onRefresh={loadTransactions} />
        </TabsContent>

        <TabsContent value="sent">
          <SentOffersTable offers={sentOffers} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
