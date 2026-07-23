import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { useNotifications } from '@/hooks/useNotifications';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import { Wallet, TrendingUp, ArrowUpRight, RefreshCw, Download, Lock, ChevronLeft } from 'lucide-react';
import KycForm from '@/components/seller/KycForm';

interface Settlement {
  id: string;
  order_number: string | null;
  amount: number;
  currency: string;
  status: string;
  progress_stage: string | null;
  created_at: string;
  domain_id: string | null;
}

const PLATFORM_FEE_RATE = 0.05; // 5% 平台费率

export default function SellerEarnings() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [items, setItems] = useState<Settlement[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState<string>('none');
  const kycApproved = kycStatus === 'approved';

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 卖出订单 = 我是卖家 (通过 domain_listings.owner_id 查找)
      const { data: myDomains } = await (supabase as any)
        .from('domain_listings')
        .select('id')
        .eq('owner_id', user.id);
      const ids = (myDomains || []).map((d: any) => d.id);

      let txs: Settlement[] = [];
      if (ids.length > 0) {
        const { data } = await (supabase as any)
          .from('transactions')
          .select('id, order_number, amount, currency, status, progress_stage, created_at, domain_id')
          .in('domain_id', ids)
          .order('created_at', { ascending: false });
        txs = (data || []) as Settlement[];
      }
      setItems(txs);

      const { data: wds } = await (supabase as any)
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('gateway', 'withdrawal')
        .order('created_at', { ascending: false });
      setWithdrawals(wds || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const stats = useMemo(() => {
    const completed = items.filter((i) => i.status === 'completed');
    const gross = completed.reduce((s, i) => s + Number(i.amount || 0), 0);
    const fees = gross * PLATFORM_FEE_RATE;
    const net = gross - fees;
    const withdrawn = withdrawals
      .filter((w) => w.status === 'completed')
      .reduce((s, w) => s + Number(w.amount || 0), 0);
    const pending = withdrawals
      .filter((w) => ['pending', 'processing'].includes(w.status))
      .reduce((s, w) => s + Number(w.amount || 0), 0);
    const available = Math.max(0, net - withdrawn - pending);
    return { gross, fees, net, withdrawn, pending, available, count: completed.length };
  }, [items, withdrawals]);

  const submitWithdrawal = async () => {
    if (!kycApproved) return toast.error('请先完成实名认证与收款资料审核');
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return toast.error('请输入有效金额');
    if (n > stats.available) return toast.error('超出可提现余额');
    if (!account.trim()) return toast.error('请填写收款账户');
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from('payment_transactions').insert({
        user_id: user!.id,
        gateway: 'withdrawal',
        amount: n,
        currency: 'CNY',
        status: 'pending',
        buyer_note: `提现申请 · 账户: ${account.trim()}`,
        metadata: { type: 'withdrawal', account: account.trim() },
      });
      if (error) throw error;
      toast.success('提现申请已提交，审核 1-3 个工作日');
      setAmount('');
      setAccount('');
      await load();
    } catch (e: any) {
      toast.error(e.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const exportCsv = () => {
    const rows = [
      ['订单号', '金额', '币种', '状态', '阶段', '创建时间'],
      ...items.map((i) => [
        i.order_number || i.id,
        String(i.amount),
        i.currency,
        i.status,
        i.progress_stage || '',
        i.created_at,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settlements-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar unreadCount={unreadCount} />
      <div className={`flex-1 max-w-5xl mx-auto w-full px-4 py-6 space-y-6 ${isMobile ? 'pb-24' : ''}`}>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
            返回
          </Button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Wallet className="h-5 w-5 text-foreground shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">卖家收入结算</h1>
              <p className="text-[11px] text-muted-foreground">
                平台费率 {(PLATFORM_FEE_RATE * 100).toFixed(0)}% · 结算币种 CNY
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="w-4 h-4 mr-1.5" /> 刷新
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={items.length === 0}>
              <Download className="w-4 h-4 mr-1.5" /> 导出 CSV
            </Button>
          </div>
        </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard label="累计成交" value={formatPrice(stats.gross, 'CNY')} sub={`${stats.count} 笔`} />
        <StatCard label="平台扣费" value={formatPrice(stats.fees, 'CNY')} sub={`${(PLATFORM_FEE_RATE * 100).toFixed(0)}%`} />
        <StatCard label="已提现" value={formatPrice(stats.withdrawn, 'CNY')} sub={`审核中 ${formatPrice(stats.pending, 'CNY')}`} />
        <StatCard label="可提现余额" value={formatPrice(stats.available, 'CNY')} highlight sub="申请后 1-3 个工作日" />
      </div>

      <KycForm onStatusChange={setKycStatus} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className={!kycApproved ? 'opacity-70' : ''}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4" /> 申请提现
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>金额 (CNY)</Label>
              <Input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`最多 ${formatPrice(stats.available, 'CNY')}`}
              />
              <div className="flex gap-1 mt-1.5">
                {[0.25, 0.5, 1].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setAmount((stats.available * r).toFixed(2))}
                    className="text-[11px] px-2 py-0.5 rounded-full border hover:bg-muted transition-colors"
                  >
                    {r === 1 ? '全部' : `${r * 100}%`}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>收款账户 (支付宝 / 微信 / 银行卡号)</Label>
              <Input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="必填" />
            </div>
            <Button
              className="w-full"
              disabled={submitting || stats.available <= 0 || !kycApproved}
              onClick={submitWithdrawal}
            >
              {!kycApproved && <Lock className="w-4 h-4 mr-1.5" />}
              {submitting ? '提交中…' : !kycApproved ? '需先通过实名审核' : '提交提现申请'}
            </Button>
          </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> 提现记录
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y max-h-[320px] overflow-auto">
            {withdrawals.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">暂无提现记录</div>
            ) : (
              withdrawals.map((w) => (
                <div key={w.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <div className="tabular-nums font-medium">{formatPrice(w.amount, (w.currency || 'CNY') as any)}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(w.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <Badge variant={w.status === 'completed' ? 'default' : w.status === 'failed' ? 'destructive' : 'secondary'}>
                    {w.status === 'completed' ? '已到账' : w.status === 'failed' ? '已拒绝' : '审核中'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">结算明细</CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">加载中…</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              暂无成交订单，
              <Link to="/sell" className="underline">前往上架</Link>
            </div>
          ) : (
            items.map((i) => {
              const fee = Number(i.amount) * PLATFORM_FEE_RATE;
              return (
                <Link
                  to={`/order/${i.id}`}
                  key={i.id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-sm truncate">{i.order_number || i.id.slice(0, 8)}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(i.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="tabular-nums text-sm">
                      {formatPrice(Number(i.amount) - fee, (i.currency || 'CNY') as any)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      毛 {formatPrice(Number(i.amount), (i.currency || 'CNY') as any)} · 扣 {formatPrice(fee, (i.currency || 'CNY') as any)}
                    </div>
                  </div>
                  <Badge className="ml-3" variant={i.status === 'completed' ? 'default' : 'secondary'}>
                    {i.status}
                  </Badge>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? 'border-primary/40 bg-primary/5' : ''}>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl md:text-2xl font-semibold tabular-nums mt-1">{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}
