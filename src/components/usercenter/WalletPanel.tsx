import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, History,
  TrendingUp, DollarSign, RefreshCw, Plus, Minus,
  Eye, EyeOff, Shield, Clock
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
    balance: 0, totalDeposited: 0, totalWithdrawn: 0,
    totalEarned: 0, pendingTransactions: 0, frozenBalance: 0
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
      // Load real transactions
      const { data: transData, error: transError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      // Also load from transactions table for domain purchases
      const { data: domainTrans } = await supabase
        .from('transactions')
        .select('*')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      let totalDeposited = 0;
      let totalWithdrawn = 0;
      let totalEarned = 0;
      let pendingTransactions = 0;
      let frozenBalance = 0;

      const formattedTransactions: Transaction[] = [];

      // Process payment_transactions
      (transData || []).forEach(t => {
        const isDeposit = (t.metadata as any)?.type === 'deposit' || t.gateway === 'deposit';
        const isWithdraw = (t.metadata as any)?.type === 'withdrawal' || t.gateway === 'withdrawal';
        
        if (t.status === 'pending') {
          pendingTransactions++;
          frozenBalance += Number(t.amount);
        }

        const type: Transaction['type'] = isDeposit ? 'deposit' : isWithdraw ? 'withdrawal' : 'purchase';
        const amount = Number(t.amount);

        if (type === 'deposit' && t.status === 'completed') totalDeposited += amount;
        if (type === 'withdrawal' && t.status === 'completed') totalWithdrawn += amount;
        if (t.status === 'completed') totalEarned += amount;

        formattedTransactions.push({
          id: t.id,
          type,
          amount,
          status: t.status || 'pending',
          description: t.buyer_note || `${t.gateway} ${type === 'deposit' ? '充值' : type === 'withdrawal' ? '提现' : '支付'}`,
          created_at: t.created_at || '',
          payment_method: t.gateway
        });
      });

      // Process domain transactions
      (domainTrans || []).forEach(t => {
        if (t.status === 'pending') {
          pendingTransactions++;
          frozenBalance += Number(t.amount);
        }
        if (t.status === 'completed') totalEarned += Number(t.amount);

        formattedTransactions.push({
          id: t.id,
          type: 'purchase',
          amount: Number(t.amount),
          status: t.status,
          description: `域名交易 #${t.id.slice(0, 8)}`,
          created_at: t.created_at,
          payment_method: t.payment_method
        });
      });

      // Sort by date
      formattedTransactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Calculate balance from profile.balance (DB field) or fallback to transaction calculation
      const balance = profile?.balance ?? (totalDeposited - totalWithdrawn);

      setStats({
        balance,
        totalDeposited,
        totalWithdrawn,
        totalEarned,
        pendingTransactions,
        frozenBalance
      });
      setTransactions(formattedTransactions);
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

  // Realtime: refresh wallet when payment_transactions change for this user
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`wallet-realtime-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'payment_transactions',
        filter: `user_id=eq.${user.id}`,
      }, () => { loadWalletData(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadWalletData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadWalletData();
  };

  const handlePaymentSuccess = (transactionId: string, amount: number, method: PaymentMethod) => {
    setStats(prev => ({
      ...prev,
      balance: prev.balance + amount,
      totalDeposited: prev.totalDeposited + amount
    }));
    loadWalletData();
  };

  const handleWithdrawSuccess = (transactionId: string, amount: number, method: PaymentMethod) => {
    setStats(prev => ({
      ...prev,
      frozenBalance: prev.frozenBalance + amount,
      pendingTransactions: prev.pendingTransactions + 1
    }));
    loadWalletData();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'withdrawal': return <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'purchase': return <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'sale': return <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'refund': return <RefreshCw className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      default: return <History className="h-4 w-4 text-muted-foreground" />;
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
      case 'completed': return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 text-xs">已完成</Badge>;
      case 'pending': return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-xs">处理中</Badge>;
      case 'failed': return <Badge className="bg-destructive/10 text-destructive text-xs">失败</Badge>;
      default: return <Badge variant="secondary" className="text-xs">{status}</Badge>;
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
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
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
                <button onClick={() => setShowBalance(!showBalance)} className="hover:text-white transition-colors">
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
              className="flex-1 bg-white text-gray-900 hover:bg-white/90 font-medium"
              size={isMobile ? "default" : "lg"}
            >
              <Plus className="h-4 w-4 mr-2" />
              充值
            </Button>
            <Button 
              onClick={() => setWithdrawDialogOpen(true)}
              className="flex-1 bg-white/15 border border-white/40 text-white hover:bg-white/25 font-medium backdrop-blur-sm"
              size={isMobile ? "default" : "lg"}
            >
              <Minus className="h-4 w-4 mr-2" />
              提现
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 统计卡片 - 使用暗色兼容样式 */}
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-3 md:gap-4`}>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 dark:text-green-400">累计充值</p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-green-700 dark:text-green-300`}>
                  {showBalance ? `¥${stats.totalDeposited.toLocaleString()}` : '****'}
                </p>
              </div>
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <ArrowDownLeft className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600 dark:text-red-400">累计提现</p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-red-700 dark:text-red-300`}>
                  {showBalance ? `¥${stats.totalWithdrawn.toLocaleString()}` : '****'}
                </p>
              </div>
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400">交易收益</p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-blue-700 dark:text-blue-300`}>
                  {showBalance ? `¥${stats.totalEarned.toLocaleString()}` : '****'}
                </p>
              </div>
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 dark:text-purple-400">待处理</p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-purple-700 dark:text-purple-300`}>
                  {stats.pendingTransactions}笔
                </p>
              </div>
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
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
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">暂无交易记录</p>
              <p className="text-xs text-muted-foreground/60 mt-1">充值或进行域名交易后，记录将显示在这里</p>
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`flex items-center justify-between ${isMobile ? 'p-2' : 'p-3'} border rounded-lg hover:bg-muted/50 transition-colors`}
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-full bg-muted flex items-center justify-center`}>
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
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${isMobile ? 'text-sm' : ''} ${
                      transaction.type === 'deposit' || transaction.type === 'sale' || transaction.type === 'refund'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
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
