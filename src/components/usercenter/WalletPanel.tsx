import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Minus
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'sale' | 'refund';
  amount: number;
  status: string;
  description: string;
  created_at: string;
}

interface WalletStats {
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalEarned: number;
  pendingTransactions: number;
}

export const WalletPanel = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<WalletStats>({
    balance: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    totalEarned: 0,
    pendingTransactions: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadWalletData = useCallback(async () => {
    if (!user) return;

    try {
      // Get profile balance
      const balance = profile?.balance || 0;

      // Get transactions
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (transError) throw transError;

      // Calculate stats from transactions
      let totalDeposited = 0;
      let totalWithdrawn = 0;
      let totalEarned = 0;
      let pendingTransactions = 0;

      const formattedTransactions: Transaction[] = (transData || []).map(t => {
        if (t.status === 'pending') pendingTransactions++;
        
        const transaction: Transaction = {
          id: t.id,
          type: t.payment_method === 'deposit' ? 'deposit' : 
                t.payment_method === 'withdrawal' ? 'withdrawal' : 'purchase',
          amount: Number(t.amount),
          status: t.status,
          description: `交易 #${t.id.slice(0, 8)}`,
          created_at: t.created_at
        };

        if (transaction.type === 'deposit') totalDeposited += transaction.amount;
        if (transaction.type === 'withdrawal') totalWithdrawn += transaction.amount;
        if (t.status === 'completed') totalEarned += transaction.amount;

        return transaction;
      });

      setStats({
        balance,
        totalDeposited,
        totalWithdrawn,
        totalEarned,
        pendingTransactions
      });
      setTransactions(formattedTransactions);
    } catch (error: any) {
      console.error('Error loading wallet data:', error);
      toast.error('加载钱包数据失败');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, profile?.balance]);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadWalletData();
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('请输入有效金额');
      return;
    }

    setIsProcessing(true);
    try {
      // In a real implementation, this would integrate with a payment gateway
      toast.info('充值功能即将上线，敬请期待！');
      setDepositDialogOpen(false);
      setAmount('');
    } catch (error: any) {
      toast.error(error.message || '充值失败');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('请输入有效金额');
      return;
    }

    if (parseFloat(amount) > stats.balance) {
      toast.error('余额不足');
      return;
    }

    setIsProcessing(true);
    try {
      // In a real implementation, this would process the withdrawal
      toast.info('提现功能即将上线，敬请期待！');
      setWithdrawDialogOpen(false);
      setAmount('');
    } catch (error: any) {
      toast.error(error.message || '提现失败');
    } finally {
      setIsProcessing(false);
    }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800">已完成</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">处理中</Badge>;
      case 'failed': return <Badge className="bg-red-100 text-red-800">失败</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

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
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-6 w-6" />
          我的钱包
        </h2>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 余额卡片 */}
      <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">账户余额</p>
              <p className="text-4xl font-bold mt-1">
                ¥{stats.balance.toLocaleString()}
              </p>
              {stats.pendingTransactions > 0 && (
                <p className="text-yellow-400 text-sm mt-2">
                  {stats.pendingTransactions} 笔交易处理中
                </p>
              )}
            </div>
            <Wallet className="h-16 w-16 text-gray-600" />
          </div>
          <div className="flex gap-3 mt-6">
            <Button 
              onClick={() => setDepositDialogOpen(true)}
              className="flex-1 bg-white text-black hover:bg-gray-100"
            >
              <Plus className="h-4 w-4 mr-2" />
              充值
            </Button>
            <Button 
              onClick={() => setWithdrawDialogOpen(true)}
              variant="outline"
              className="flex-1 border-white text-white hover:bg-white/10"
            >
              <Minus className="h-4 w-4 mr-2" />
              提现
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">累计充值</p>
                <p className="text-2xl font-bold text-green-600">
                  ¥{stats.totalDeposited.toLocaleString()}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <ArrowDownLeft className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">累计提现</p>
                <p className="text-2xl font-bold text-red-600">
                  ¥{stats.totalWithdrawn.toLocaleString()}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">交易总额</p>
                <p className="text-2xl font-bold text-blue-600">
                  ¥{stats.totalEarned.toLocaleString()}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 交易记录 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            交易记录
          </CardTitle>
          <CardDescription>最近的钱包交易记录</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-10">
              <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-muted-foreground">暂无交易记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
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

      {/* 充值对话框 */}
      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>账户充值</DialogTitle>
            <DialogDescription>
              输入充值金额，我们支持多种支付方式
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">充值金额 (CNY)</Label>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[100, 500, 1000, 5000].map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(preset.toString())}
                >
                  ¥{preset}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleDeposit} disabled={isProcessing}>
              {isProcessing ? '处理中...' : '确认充值'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 提现对话框 */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>账户提现</DialogTitle>
            <DialogDescription>
              当前可提现余额: ¥{stats.balance.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">提现金额 (CNY)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                max={stats.balance}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setAmount(stats.balance.toString())}
            >
              全部提现
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleWithdraw} disabled={isProcessing}>
              {isProcessing ? '处理中...' : '确认提现'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
