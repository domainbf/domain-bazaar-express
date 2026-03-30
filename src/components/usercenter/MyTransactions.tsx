import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Clock, CheckCircle2, XCircle, RefreshCw,
  ShoppingBag, Store, Globe, DollarSign, AlertTriangle
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface TransactionRecord {
  id: string;
  amount: number;
  status: string;
  seller_amount: number | null;
  commission_amount: number | null;
  commission_rate: number | null;
  created_at: string;
  completed_at: string | null;
  transfer_confirmed_seller: boolean | null;
  transfer_confirmed_buyer: boolean | null;
  buyer_id: string | null;
  seller_id: string | null;
  domain_name?: string;
  domain_id: string;
  offer_id: string | null;
  payment_method: string;
  role: 'buyer' | 'seller';
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock; progress: number }> = {
  payment_pending: { label: '等待付款', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400', icon: Clock, progress: 20 },
  pending: { label: '等待付款', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400', icon: Clock, progress: 20 },
  paid: { label: '已付款', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400', icon: CheckCircle2, progress: 40 },
  escrow_funded: { label: '资金托管中', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400', icon: Clock, progress: 55 },
  in_escrow: { label: '资金托管中', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400', icon: Clock, progress: 55 },
  domain_transferred: { label: '域名已转移', color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400', icon: Globe, progress: 80 },
  buyer_confirmed: { label: '买家已确认', color: 'bg-teal-500/10 text-teal-700 dark:text-teal-400', icon: CheckCircle2, progress: 90 },
  completed: { label: '已完成', color: 'bg-green-500/10 text-green-700 dark:text-green-400', icon: CheckCircle2, progress: 100 },
  cancelled: { label: '已取消', color: 'bg-muted text-muted-foreground', icon: XCircle, progress: 0 },
  disputed: { label: '纠纷中', color: 'bg-red-500/10 text-red-700 dark:text-red-400', icon: AlertTriangle, progress: 50 },
  refunded: { label: '已退款', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400', icon: RefreshCw, progress: 0 },
};

export const MyTransactions = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'buyer' | 'seller'>('all');

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id, amount, status, seller_amount, commission_amount, commission_rate,
          created_at, completed_at, transfer_confirmed_seller, transfer_confirmed_buyer,
          buyer_id, seller_id, domain_id, offer_id, payment_method,
          domain_listings:domain_id ( name )
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: TransactionRecord[] = (data || []).map((t: any) => ({
        ...t,
        domain_name: t.domain_listings?.name ?? '未知域名',
        role: t.buyer_id === user.id ? 'buyer' : 'seller',
      }));

      setTransactions(mapped);
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      toast.error('加载交易记录失败');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadTransactions();

    const channel = supabase
      .channel('my-transactions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        loadTransactions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadTransactions]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTransactions();
  };

  const filtered = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.role === filter;
  });

  const stats = {
    total: transactions.length,
    completed: transactions.filter(t => t.status === 'completed').length,
    pending: transactions.filter(t => !['completed', 'cancelled', 'refunded'].includes(t.status)).length,
    asBuyer: transactions.filter(t => t.role === 'buyer').length,
    asSeller: transactions.filter(t => t.role === 'seller').length,
  };

  if (isLoading) {
    return <div className="flex justify-center py-10"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className={`font-bold flex items-center gap-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
          <ShoppingBag className="h-5 w-5" />
          我的交易
        </h3>
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''} ${isMobile ? '' : 'mr-2'}`} />
          {!isMobile && '刷新'}
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-3`}>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-1">全部交易</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.completed}</p>
            <p className="text-xs text-muted-foreground mt-1">已完成</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pending}</p>
            <p className="text-xs text-muted-foreground mt-1">进行中</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.asSeller}</p>
            <p className="text-xs text-muted-foreground mt-1">作为卖家</p>
          </CardContent>
        </Card>
      </div>

      {/* 角色过滤 */}
      <div className="flex gap-2">
        {(['all', 'buyer', 'seller'] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === 'all' && '全部'}
            {f === 'buyer' && <><ShoppingBag className="h-3.5 w-3.5 mr-1.5" />作为买家</>}
            {f === 'seller' && <><Store className="h-3.5 w-3.5 mr-1.5" />作为卖家</>}
          </Button>
        ))}
      </div>

      {/* 交易列表 */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold mb-2">暂无交易记录</h3>
            <p className="text-muted-foreground text-sm">接受或发送报价后，交易记录将在这里展示</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(tx => {
            const statusInfo = STATUS_MAP[tx.status] ?? STATUS_MAP.pending;
            const StatusIcon = statusInfo.icon;
            const isBuyer = tx.role === 'buyer';

            return (
              <Card key={tx.id} className="hover:shadow-md transition-shadow">
                <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
                  <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between gap-4'}`}>
                    {/* 左侧：域名 + 角色 + 状态 */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="bg-primary/10 p-2.5 rounded-lg shrink-0">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-base truncate">{tx.domain_name}</span>
                          <Badge variant="outline" className={`text-xs shrink-0 ${isBuyer ? 'border-blue-500/40 text-blue-600 dark:text-blue-400' : 'border-green-500/40 text-green-600 dark:text-green-400'}`}>
                            {isBuyer ? '买家' : '卖家'}
                          </Badge>
                          <Badge className={`text-xs shrink-0 ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </div>

                        {/* 进度条 */}
                        {tx.status !== 'cancelled' && tx.status !== 'refunded' && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>交易进度</span>
                              <span>{statusInfo.progress}%</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-500 rounded-full"
                                style={{ width: `${statusInfo.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground mt-1.5">
                          {new Date(tx.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* 右侧：金额 + 操作 */}
                    <div className={`flex items-center ${isMobile ? 'justify-between' : 'flex-col items-end gap-2'}`}>
                      <div className={`${isMobile ? '' : 'text-right'}`}>
                        <p className="text-xl font-bold text-primary">¥{Number(tx.amount).toLocaleString()}</p>
                        {!isBuyer && tx.seller_amount !== null && tx.commission_amount !== null && (
                          <div className="text-xs text-muted-foreground">
                            <span className="text-green-600 dark:text-green-400">到手 ¥{Number(tx.seller_amount).toLocaleString()}</span>
                            <span className="mx-1">·</span>
                            <span>手续费 ¥{Number(tx.commission_amount).toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      <Link to={`/transaction/${tx.id}`}>
                        <Button size="sm" variant={tx.status === 'completed' ? 'outline' : 'default'} className="gap-1.5 shrink-0">
                          {tx.status === 'completed' ? '查看详情' : '进入交易'}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
