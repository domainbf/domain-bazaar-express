
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DomainOffer } from '@/types/domain';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3
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

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      // Load received offers (for domains user owns)
      const { data: received, error: receivedError } = await supabase
        .from('domain_offers')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      
      if (receivedError) throw receivedError;
      
      // Get domain names for received offers
      const receivedWithDomains = await Promise.all(
        (received || []).map(async (offer) => {
          const { data: domain } = await supabase
            .from('domain_listings')
            .select('name')
            .eq('id', offer.domain_id)
            .single();
          
          return {
            ...offer,
            domain_name: domain?.name || 'Unknown domain'
          };
        })
      );
      
      setReceivedOffers(receivedWithDomains);

      // Load sent offers
      const { data: sent, error: sentError } = await supabase
        .from('domain_offers')
        .select('*')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (sentError) throw sentError;
      
      // Get domain names for sent offers
      const sentWithDomains = await Promise.all(
        (sent || []).map(async (offer) => {
          const { data: domain } = await supabase
            .from('domain_listings')
            .select('name')
            .eq('id', offer.domain_id)
            .single();
          
          return {
            ...offer,
            domain_name: domain?.name || 'Unknown domain'
          };
        })
      );
      
      setSentOffers(sentWithDomains);

      // Calculate statistics
      calculateStats(receivedWithDomains, sentWithDomains);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      toast.error(error.message || 'Failed to load transaction history');
    } finally {
      setIsLoading(false);
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
      {/* 统计概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">收到报价</p>
                <p className="text-2xl font-bold">{stats.totalReceived}</p>
              </div>
              <ArrowDownRight className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              总计收到的域名报价数量
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">发出报价</p>
                <p className="text-2xl font-bold">{stats.totalSent}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              总计发出的域名报价数量
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总交易额</p>
                <p className="text-2xl font-bold">¥{stats.totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              所有交易的总金额
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">接受率</p>
                <p className="text-2xl font-bold">{stats.acceptanceRate.toFixed(1)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
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
