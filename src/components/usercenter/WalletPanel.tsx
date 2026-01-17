import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  History,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Shield,
  Clock
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentGateway, PaymentMethod } from '@/components/payment/PaymentGateway';
import { useIsMobile } from "@/hooks/use-mobile";

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'sale' | 'refund';
  amount: number;
  status: string;
  description: string;
  created_at: string;
  payment_method?: string;
}

interface WalletStats {
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalEarned: number;
  pendingTransactions: number;
  frozenBalance: number;
}

export const WalletPanel = () => {
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  const [stats, setStats] = useState<WalletStats>({
    balance: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    totalEarned: 0,
    pendingTransactions: 0,
    frozenBalance: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'purchase'>('all');

  const loadWalletData = useCallback(async () => {
    if (!user) return;

    try {
      // Get profile balance (in a real app this would come from a dedicated wallet table)
      const balance = (profile as any)?.balance || 12580.50; // Demo balance

      // Get transactions
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transError) throw transError;

      // Calculate stats from transactions
      let totalDeposited = 0;
      let totalWithdrawn = 0;
      let totalEarned = 0;
      let pendingTransactions = 0;
      let frozenBalance = 0;

      const formattedTransactions: Transaction[] = (transData || []).map(t => {
        if (t.status === 'pending') {
          pendingTransactions++;
          frozenBalance += Number(t.amount);
        }
        
        const transaction: Transaction = {
          id: t.id,
          type: t.payment_method === 'deposit' ? 'deposit' : 
                t.payment_method === 'withdrawal' ? 'withdrawal' : 'purchase',
          amount: Number(t.amount),
          status: t.status,
          description: `交易 #${t.id.slice(0, 8)}`,
          created_at: t.created_at,
          payment_method: t.payment_method
        };

        if (transaction.type === 'deposit') totalDeposited += transaction.amount;
        if (transaction.type === 'withdrawal') totalWithdrawn += transaction.amount;
        if (t.status === 'completed') totalEarned += transaction.amount;

        return transaction;
      });

      // Add some demo transactions if no data
      const demoTransactions: Transaction[] = formattedTransactions.length === 0 ? [
        { id: 'demo1', type: 'deposit', amount: 5000, status: 'completed', description: '支付宝充值', created_at: new Date(Date.now() - 86400000).toISOString(), payment_method: 'alipay' },
        { id: 'demo2', type: 'purchase', amount: 2800, status: 'completed', description: '购买域名 example.com', created_at: new Date(Date.now() - 172800000).toISOString() },
        { id: 'demo3', type: 'sale', amount: 8500, status: 'completed', description: '出售域名 test.io', created_at: new Date(Date.now() - 259200000).toISOString() },
        { id: 'demo4', type: 'withdrawal', amount: 3000, status: 'pending', description: '提现到支付宝', created_at: new Date(Date.now() - 345600000).toISOString(), payment_method: 'alipay' },
        { id: 'demo5', type: 'deposit', amount: 10000, status: 'completed', description: 'PayPal充值', created_at: new Date(Date.now() - 432000000).toISOString(), payment_method: 'paypal' },
      ] : formattedTransactions;

      setStats({
        balance: balance || 12580.50,
        totalDeposited: totalDeposited || 15000,
        totalWithdrawn: totalWithdrawn || 3000,
        totalEarned: totalEarned || 8500,
        pendingTransactions: pendingTransactions || 1,
        frozenBalance: frozenBalance || 3000
      });
      setTransactions(demoTransactions);
    } catch (error: any) {
      console.error('Error loading wallet data:', error);
      toast.error('加载钱包数据失败');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, profile]);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadWalletData();
  };

  const handlePaymentSuccess = (transactionId: string, amount: number, method: PaymentMethod) => {
    // In a real implementation, this would update the database
    setStats(prev => ({
      ...prev,
      balance: prev.balance + amount,
      totalDeposited: prev.totalDeposited + amount
    }));
    loadWalletData();
  };

  const handleWithdrawSuccess = (transactionId: string, amount: number, method: PaymentMethod) => {
    // In a real implementation, this would create a pending withdrawal
    setStats(prev => ({
      ...prev,
      frozenBalance: prev.frozenBalance + amount,
      pendingTransactions: prev.pendingTransactions + 1
    }));
    loadWalletData();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'withdrawal': return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'purchase': return <CreditCard className="h-4 w-4 text-blue-500" />;
      case 'sale': return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'refund': return <RefreshCw className="h-4 w-4 text-orange-500" />;
      default: return <History className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit': return '充值';
      case 'withdrawal': return '提现';
      case 'purchase': return '购买';
      case 'sale': return '出售';
      case 'refund': return '退款';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800 text-xs">已完成</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800 text-xs">处理中</Badge>;
      case 'failed': return <Badge className="bg-red-100 text-red-800 text-xs">失败</Badge>;
      default: return <Badge className="text-xs">{status}</Badge>;
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (transactionFilter === 'all') return true;
    return t.type === transactionFilter;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold flex items-center gap-2`}>
          <Wallet className="h-5 w-5 md:h-6 md:w-6" />
          我的钱包
        </h2>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 ${isMobile ? '' : 'mr-2'} ${isRefreshing ? 'animate-spin' : ''}`} />
          {!isMobile && '刷新'}
        </Button>
      </div>

      {/* 余额卡片 */}
      <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <CardContent className={`${isMobile ? 'p-4' : 'p-6'} relative z-10`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <span>可用余额</span>
                <button onClick={() => setShowBalance(!showBalance)} className="hover:text-white">
                  {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              <p className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold mt-1`}>
                {showBalance ? `¥${stats.balance.toLocaleString()}` : '****'}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
              <Shield className="h-3 w-3" />
              <span>已验证</span>
            </div>
          </div>

          {stats.frozenBalance > 0 && (
            <div className="flex items-center gap-2 text-yellow-400 text-sm mb-4">
              <Clock className="h-4 w-4" />
              <span>冻结金额: {showBalance ? `¥${stats.frozenBalance.toLocaleString()}` : '****'}</span>
            </div>
          )}

          <div className={`flex gap-2 md:gap-3 ${isMobile ? 'flex-col' : ''}`}>
            <Button 
              onClick={() => setDepositDialogOpen(true)}
              className={`${isMobile ? 'flex-1' : 'flex-1'} bg-white text-black hover:bg-gray-100`}
              size={isMobile ? "default" : "lg"}
            >
              <Plus className="h-4 w-4 mr-2" />
              充值
            </Button>
            <Button 
              onClick={() => setWithdrawDialogOpen(true)}
              variant="outline"
              className={`${isMobile ? 'flex-1' : 'flex-1'} border-white/30 text-white hover:bg-white/10`}
              size={isMobile ? "default" : "lg"}
            >
              <Minus className="h-4 w-4 mr-2" />
              提现
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-3 md:gap-4`}>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600">累计充值</p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-green-700`}>
                  {showBalance ? `¥${stats.totalDeposited.toLocaleString()}` : '****'}
                </p>
              </div>
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-green-100 flex items-center justify-center">
                <ArrowDownLeft className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600">累计提现</p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-red-700`}>
                  {showBalance ? `¥${stats.totalWithdrawn.toLocaleString()}` : '****'}
                </p>
              </div>
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-red-100 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600">交易收益</p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-blue-700`}>
                  {showBalance ? `¥${stats.totalEarned.toLocaleString()}` : '****'}
                </p>
              </div>
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600">待处理</p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-purple-700`}>
                  {stats.pendingTransactions}笔
                </p>
              </div>
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 交易记录 */}
      <Card>
        <CardHeader className={isMobile ? 'pb-3' : ''}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                <History className="h-4 w-4 md:h-5 md:w-5" />
                交易记录
              </CardTitle>
              <CardDescription className={isMobile ? 'text-xs' : ''}>
                最近的钱包交易记录
              </CardDescription>
            </div>
          </div>
          
          <Tabs value={transactionFilter} onValueChange={(v) => setTransactionFilter(v as any)} className="mt-3">
            <TabsList className={isMobile ? 'w-full grid grid-cols-4' : ''}>
              <TabsTrigger value="all" className={isMobile ? 'text-xs' : ''}>全部</TabsTrigger>
              <TabsTrigger value="deposit" className={isMobile ? 'text-xs' : ''}>充值</TabsTrigger>
              <TabsTrigger value="withdrawal" className={isMobile ? 'text-xs' : ''}>提现</TabsTrigger>
              <TabsTrigger value="purchase" className={isMobile ? 'text-xs' : ''}>交易</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-10">
              <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-muted-foreground">暂无交易记录</p>
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`flex items-center justify-between ${isMobile ? 'p-2' : 'p-3'} border rounded-lg hover:bg-gray-50 transition-colors`}
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-full bg-gray-100 flex items-center justify-center`}>
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{transaction.description}</p>
                        <Badge variant="outline" className="text-xs">
                          {getTransactionTypeLabel(transaction.type)}
                        </Badge>
                      </div>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                        {new Date(transaction.created_at).toLocaleString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${isMobile ? 'text-sm' : ''} ${
                      transaction.type === 'deposit' || transaction.type === 'sale' || transaction.type === 'refund'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {transaction.type === 'deposit' || transaction.type === 'sale' || transaction.type === 'refund' ? '+' : '-'}
                      ¥{transaction.amount.toLocaleString()}
                    </p>
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 支付网关 */}
      <PaymentGateway
        isOpen={depositDialogOpen}
        onClose={() => setDepositDialogOpen(false)}
        type="deposit"
        onSuccess={handlePaymentSuccess}
      />

      <PaymentGateway
        isOpen={withdrawDialogOpen}
        onClose={() => setWithdrawDialogOpen(false)}
        type="withdraw"
        onSuccess={handleWithdrawSuccess}
        maxAmount={stats.balance}
      />
    </div>
  );
};
