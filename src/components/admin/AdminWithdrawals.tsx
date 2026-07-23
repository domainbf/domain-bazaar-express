import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Wallet, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

interface Row {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  gateway: string;
  gateway_transaction_id: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

const STATUS: Record<string, { label: string; tone: any }> = {
  pending: { label: '待审核', tone: 'secondary' },
  processing: { label: '处理中', tone: 'default' },
  completed: { label: '已到账', tone: 'default' },
  failed: { label: '已拒绝', tone: 'destructive' },
  refunded: { label: '已退回', tone: 'outline' },
};

export function AdminWithdrawals() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState<Row | null>(null);
  const [note, setNote] = useState('');
  const [ref, setRef] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('gateway', 'withdrawal')
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useRealtimeSubscription(['payment_transactions'], () => load(), true);

  const filtered = filter === 'all' ? rows : rows.filter((r) => r.status === filter);

  const decide = async (action: 'approve' | 'reject') => {
    if (!selected || !user) return;
    setSaving(true);
    try {
      const isApprove = action === 'approve';
      const newStatus = isApprove ? 'completed' : 'failed';
      const nextMeta = {
        ...(selected.metadata || {}),
        admin_note: note.trim() || null,
        reviewer_id: user.id,
        reviewed_at: new Date().toISOString(),
        payout_reference: isApprove ? (ref.trim() || null) : null,
      };
      const { error } = await supabase
        .from('payment_transactions')
        .update({
          status: newStatus,
          gateway_transaction_id: isApprove && ref.trim() ? ref.trim() : selected.gateway_transaction_id,
          metadata: nextMeta,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selected.id);
      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: selected.user_id,
        title: isApprove ? '💰 提现已到账' : '❌ 提现被拒绝',
        message: isApprove
          ? `您的 ${selected.currency} ${Number(selected.amount).toLocaleString()} 提现已完成${ref.trim() ? '，凭证号 ' + ref.trim() : ''}`
          : `您的 ${selected.currency} ${Number(selected.amount).toLocaleString()} 提现被拒绝${note.trim() ? '：' + note.trim() : ''}`,
        type: 'payment',
        action_url: '/seller/earnings',
      });

      toast.success(isApprove ? '已标记为到账' : '已拒绝');
      setSelected(null);
      setNote('');
      setRef('');
      await load();
    } catch (e: any) {
      toast.error(e.message || '操作失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Wallet className="w-5 h-5" /> 提现审核
          </h2>
          <p className="text-sm text-muted-foreground mt-1">审核卖家提现申请，标记到账并附上银行凭证号，用户会自动收到通知。</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> 刷新
        </Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="pending">待审核 ({rows.filter(r => r.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="processing">处理中</TabsTrigger>
          <TabsTrigger value="completed">已到账</TabsTrigger>
          <TabsTrigger value="failed">已拒绝</TabsTrigger>
          <TabsTrigger value="all">全部</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">申请列表 ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y max-h-[560px] overflow-auto">
            {loading ? <div className="p-8 text-center text-sm text-muted-foreground">加载中…</div> :
              filtered.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">暂无记录</div> :
              filtered.map((r) => {
                const meta = STATUS[r.status] || { label: r.status, tone: 'outline' as const };
                const account = (r.metadata as any)?.account || '—';
                return (
                  <button
                    key={r.id}
                    onClick={() => { setSelected(r); setNote((r.metadata as any)?.admin_note || ''); setRef(r.gateway_transaction_id || ''); }}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors ${selected?.id === r.id ? 'bg-muted/50' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium">
                          {r.currency} {Number(r.amount).toLocaleString()}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          账户 {account}
                        </div>
                      </div>
                      <Badge variant={meta.tone}>{meta.label}</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {new Date(r.created_at).toLocaleString('zh-CN')}
                    </div>
                  </button>
                );
              })
            }
          </CardContent>
        </Card>

        <Card className="h-fit sticky top-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">审核详情</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {!selected ? (
              <div className="text-sm text-muted-foreground py-8 text-center">从左侧选择一条记录</div>
            ) : (
              <>
                <Row label="金额" value={`${selected.currency} ${Number(selected.amount).toLocaleString()}`} />
                <Row label="用户 ID" value={<code className="text-[11px]">{selected.user_id}</code>} />
                <Row label="收款账户" value={(selected.metadata as any)?.account || '—'} />
                <Row label="申请时间" value={new Date(selected.created_at).toLocaleString('zh-CN')} />
                <Row label="当前状态" value={<Badge variant={STATUS[selected.status]?.tone}>{STATUS[selected.status]?.label}</Badge>} />

                <div className="border-t pt-2 space-y-2">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">银行/平台凭证号 (可选)</div>
                    <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="例如 支付宝流水号" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">备注 (拒绝时必填原因)</div>
                    <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="拒绝时请说明原因，将同步给用户" />
                  </div>
                </div>

                {selected.status === 'pending' && (
                  <div className="flex gap-2 pt-1">
                    <Button className="flex-1" disabled={saving} onClick={() => decide('approve')}>
                      <CheckCircle2 className="w-4 h-4 mr-1.5" /> 标记到账
                    </Button>
                    <Button variant="destructive" className="flex-1" disabled={saving || !note.trim()} onClick={() => decide('reject')}>
                      <XCircle className="w-4 h-4 mr-1.5" /> 拒绝
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-right truncate">{value}</span>
    </div>
  );
}

export default AdminWithdrawals;
