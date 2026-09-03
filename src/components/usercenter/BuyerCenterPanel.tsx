import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';
import {
  ShoppingBag, CreditCard, Star, RefreshCw, ArrowRight, ShieldCheck, Globe,
} from 'lucide-react';

interface OrderRow {
  id: string;
  amount: number;
  currency: string | null;
  status: string;
  progress_stage: string | null;
  created_at: string;
  completed_at: string | null;
  domain_id: string;
  domain_name?: string;
}

interface PaymentRow {
  id: string;
  amount: number;
  currency: string | null;
  gateway: string;
  status: string | null;
  created_at: string | null;
}

const STAGE_LABEL: Record<string, string> = {
  submitted: '已提交',
  confirmed: '已确认',
  paid: '已付款',
  activated: '已激活',
  transferred: '过户中',
  completed: '已完成',
};

/** 买家中心：成交订单、支付记录与买家信誉 */
export const BuyerCenterPanel = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [reputation, setReputation] = useState<{ buyer_rating: number; buyer_review_count: number } | null>(null);
  const [kycStatus, setKycStatus] = useState<string>('none');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [txRes, payRes, profRes, kycRes] = await Promise.all([
        (supabase as any)
          .from('transactions')
          .select('id, amount, currency, status, progress_stage, created_at, completed_at, domain_id, domains:domain_id ( name )')
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100),
        (supabase as any)
          .from('payment_transactions')
          .select('id, amount, currency, gateway, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        (supabase as any)
          .from('profiles')
          .select('buyer_rating, buyer_review_count')
          .eq('id', user.id)
          .maybeSingle(),
        (supabase as any)
          .from('seller_kyc')
          .select('status')
          .eq('user_id', user.id)
          .eq('kyc_type', 'buyer')
          .maybeSingle(),
      ]);

      setOrders((txRes.data || []).map((t: any) => ({ ...t, domain_name: t.domains?.name })));
      setPayments(payRes.data || []);
      setReputation({
        buyer_rating: Number(profRes.data?.buyer_rating ?? 0),
        buyer_review_count: Number(profRes.data?.buyer_review_count ?? 0),
      });
      setKycStatus(kycRes.data?.status || 'none');
    } catch (e: any) {
      console.error(e);
      toast.error('买家数据加载失败');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`buyer-center-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `buyer_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, load]);

  const stats = useMemo(() => {
    const completed = orders.filter(o => o.status === 'completed');
    const spent = completed.reduce((s, o) => s + Number(o.amount || 0), 0);
    return {
      total: orders.length,
      completed: completed.length,
      ongoing: orders.filter(o => !['completed', 'cancelled', 'refunded'].includes(o.status)).length,
      spent,
    };
  }, [orders]);

  if (loading) return <div className="flex justify-center py-10"><LoadingSpinner /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />买家中心
        </h3>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-1.5" />刷新
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="累计订单" value={String(stats.total)} />
        <StatCard label="已成交" value={String(stats.completed)} />
        <StatCard label="进行中" value={String(stats.ongoing)} />
        <StatCard label="累计支出" value={formatPrice(stats.spent, 'CNY')} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4" />买家信誉
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div>
              <p className="text-3xl font-bold tabular-nums">
                {reputation?.buyer_rating ? reputation.buyer_rating.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                共 {reputation?.buyer_review_count ?? 0} 条卖家评价
              </p>
            </div>
            <div className="ml-auto text-right">
              <Badge variant={kycStatus === 'approved' ? 'default' : 'outline'} className="gap-1">
                <ShieldCheck className="h-3 w-3" />
                {kycStatus === 'approved' ? '买家已实名' : kycStatus === 'pending' ? '实名审核中' : '未实名'}
              </Badge>
              <div className="mt-2">
                <Link
                  to="/user-center?tab=profile-settings&sub=kycbuyer"
                  className="text-xs underline text-muted-foreground hover:text-foreground"
                >
                  查看买家实名认证
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />支付记录
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y max-h-64 overflow-auto">
            {payments.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">暂无支付记录</p>
            ) : payments.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-medium truncate">{p.gateway?.toUpperCase()}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {p.created_at ? new Date(p.created_at).toLocaleString('zh-CN') : '—'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="tabular-nums font-semibold">{formatPrice(Number(p.amount), p.currency || 'CNY')}</p>
                  <Badge variant="outline" className="text-[10px] mt-0.5">{p.status || 'unknown'}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />我的成交订单
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {orders.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">暂无订单，去市场挑选心仪的域名吧</p>
          ) : orders.map(o => (
            <div key={o.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{o.domain_name || '未知域名'}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(o.created_at).toLocaleString('zh-CN')}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant={o.status === 'completed' ? 'default' : 'secondary'}>
                  {STAGE_LABEL[o.progress_stage || ''] || o.status}
                </Badge>
                <span className="tabular-nums font-semibold text-sm">
                  {formatPrice(Number(o.amount), o.currency || 'CNY')}
                </span>
                <Button asChild size="sm" variant="ghost">
                  <Link to={`/order/${o.id}`}>详情<ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-3 text-center">
        <p className="text-xl font-bold tabular-nums truncate">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

export default BuyerCenterPanel;
