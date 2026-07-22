import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Mail, ChevronRight, RefreshCw, ExternalLink, ScrollText, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const STAGES = [
  { key: 'submitted', label: '订单提交' },
  { key: 'paid', label: '支付确认' },
  { key: 'activated', label: '域名激活' },
  { key: 'transferred', label: '过户完成' },
];

interface Txn {
  id: string;
  order_number: string | null;
  amount: number;
  currency: string;
  status: string;
  progress_stage: string;
  payment_method: string | null;
  receipt_sent_at: string | null;
  created_at: string;
  buyer_id: string;
  domain_id: string | null;
}

interface OpLog {
  id: string;
  transaction_id: string;
  operator_email: string | null;
  operation: string;
  from_stage: string | null;
  to_stage: string | null;
  status: string;
  error: string | null;
  created_at: string;
  metadata: any;
}

interface ReceiptLog {
  id: string;
  transaction_id: string;
  attempt: number;
  status: string;
  error: string | null;
  recipient: string | null;
  duration_ms: number | null;
  triggered_by: string | null;
  created_at: string;
}

const OP_LABELS: Record<string, string> = {
  resend_receipt: '重发收据',
  retry_receipt: '重试收据',
  advance_stage: '推进阶段',
};

const stageLabel = (k?: string | null) => STAGES.find((s) => s.key === k)?.label || k || '—';

export function AdminOrderOperations() {
  const [txns, setTxns] = useState<Txn[]>([]);
  const [ops, setOps] = useState<OpLog[]>([]);
  const [receipts, setReceipts] = useState<ReceiptLog[]>([]);
  const [selected, setSelected] = useState<Txn | null>(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [targetStage, setTargetStage] = useState<string>('paid');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('transactions')
      .select('id, order_number, amount, currency, status, progress_stage, payment_method, receipt_sent_at, created_at, buyer_id, domain_id')
      .order('created_at', { ascending: false })
      .limit(100);
    setTxns((data as any) || []);
    setLoading(false);
  };

  const loadDetails = async (t: Txn) => {
    setSelected(t);
    const [opsRes, recRes] = await Promise.all([
      supabase.from('order_operations_log').select('*').eq('transaction_id', t.id).order('created_at', { ascending: false }),
      supabase.from('receipt_delivery_log').select('*').eq('transaction_id', t.id).order('created_at', { ascending: false }),
    ]);
    setOps((opsRes.data as any) || []);
    setReceipts((recRes.data as any) || []);
    const idx = STAGES.findIndex((s) => s.key === t.progress_stage);
    setTargetStage(STAGES[Math.min(idx + 1, STAGES.length - 1)]?.key || 'paid');
  };

  useEffect(() => {
    load();
  }, []);

  const invoke = async (action: string, extra: any = {}) => {
    if (!selected) return;
    setBusy(action);
    try {
      const { data, error } = await supabase.functions.invoke('admin-order-operations', {
        body: { action, transaction_id: selected.id, ...extra },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(action === 'advance_stage' ? '阶段已推进' : '收据已重发');
      await load();
      const fresh = txns.find((x) => x.id === selected.id);
      if (fresh) await loadDetails(fresh);
      else await loadDetails(selected);
    } catch (e: any) {
      toast.error('操作失败：' + (e?.message || '未知错误'));
    } finally {
      setBusy(null);
    }
  };

  const filtered = txns.filter((t) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (t.order_number || '').toLowerCase().includes(s) || t.id.includes(s) || (t.payment_method || '').toLowerCase().includes(s);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">订单运维</h2>
          <p className="text-sm text-muted-foreground">手动重发收据、推进订单阶段，并查看每次操作记录。</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> 刷新
        </Button>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Search className="w-4 h-4" /> 订单列表
            </CardTitle>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索订单号 / 支付流水" />
          </CardHeader>
          <CardContent className="p-0 max-h-[560px] overflow-y-auto divide-y">
            {filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => loadDetails(t)}
                className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors ${selected?.id === t.id ? 'bg-muted' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono text-xs truncate">{t.order_number || t.id.slice(0, 12)}</div>
                  <Badge variant="secondary" className="text-[10px]">{stageLabel(t.progress_stage)}</Badge>
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
                  <span>{t.payment_method || '—'} · {t.currency} {Number(t.amount).toFixed(0)}</span>
                  <span>{new Date(t.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && !loading && (
              <div className="p-6 text-sm text-muted-foreground text-center">暂无订单</div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          {!selected ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                请选择左侧订单以查看详情与执行运维操作。
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm">{selected.order_number || selected.id}</CardTitle>
                      <div className="text-xs text-muted-foreground mt-1">
                        当前阶段：<b>{stageLabel(selected.progress_stage)}</b> · 收据：
                        {selected.receipt_sent_at ? (
                          <span className="text-success">已发送 {new Date(selected.receipt_sent_at).toLocaleString('zh-CN')}</span>
                        ) : (
                          <span className="text-warning">未发送</span>
                        )}
                      </div>
                    </div>
                    <Link to={`/order/${selected.id}`} target="_blank">
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> 打开详情
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm" onClick={() => invoke('resend_receipt')} disabled={busy !== null}>
                      <Mail className="w-4 h-4 mr-1.5" /> {busy === 'resend_receipt' ? '发送中...' : '重发收据'}
                    </Button>
                    <div className="flex items-center gap-2">
                      <Select value={targetStage} onValueChange={setTargetStage}>
                        <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STAGES.map((s) => (
                            <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="secondary" onClick={() => invoke('advance_stage', { to_stage: targetStage })} disabled={busy !== null}>
                        <ChevronRight className="w-4 h-4 mr-1" /> 推进到此阶段
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ScrollText className="w-4 h-4" /> 操作记录
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-64 overflow-y-auto">
                    {ops.length === 0 ? (
                      <div className="p-6 text-sm text-muted-foreground text-center">暂无操作记录</div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="bg-muted/40 sticky top-0">
                          <tr>
                            <th className="text-left px-3 py-2">时间</th>
                            <th className="text-left px-3 py-2">操作者</th>
                            <th className="text-left px-3 py-2">动作</th>
                            <th className="text-left px-3 py-2">变更</th>
                            <th className="text-left px-3 py-2">结果</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ops.map((o) => (
                            <tr key={o.id} className="border-t border-border">
                              <td className="px-3 py-2 whitespace-nowrap tabular-nums">{new Date(o.created_at).toLocaleString('zh-CN')}</td>
                              <td className="px-3 py-2">{o.operator_email || '—'}</td>
                              <td className="px-3 py-2">{OP_LABELS[o.operation] || o.operation}</td>
                              <td className="px-3 py-2">{o.from_stage ? `${stageLabel(o.from_stage)} → ${stageLabel(o.to_stage)}` : '—'}</td>
                              <td className="px-3 py-2">
                                {o.status === 'success' ? (
                                  <Badge variant="default" className="text-[10px]">成功</Badge>
                                ) : (
                                  <span className="text-destructive text-[11px]" title={o.error || ''}>失败：{o.error?.slice(0, 40)}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4" /> 收据投递日志
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-64 overflow-y-auto">
                    {receipts.length === 0 ? (
                      <div className="p-6 text-sm text-muted-foreground text-center">暂无投递记录</div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="bg-muted/40 sticky top-0">
                          <tr>
                            <th className="text-left px-3 py-2">时间</th>
                            <th className="text-left px-3 py-2">尝试</th>
                            <th className="text-left px-3 py-2">收件人</th>
                            <th className="text-left px-3 py-2">来源</th>
                            <th className="text-left px-3 py-2">耗时</th>
                            <th className="text-left px-3 py-2">结果</th>
                          </tr>
                        </thead>
                        <tbody>
                          {receipts.map((r) => (
                            <tr key={r.id} className="border-t border-border">
                              <td className="px-3 py-2 whitespace-nowrap tabular-nums">{new Date(r.created_at).toLocaleString('zh-CN')}</td>
                              <td className="px-3 py-2">#{r.attempt}</td>
                              <td className="px-3 py-2 truncate max-w-[160px]">{r.recipient || '—'}</td>
                              <td className="px-3 py-2 text-muted-foreground">{r.triggered_by || 'system'}</td>
                              <td className="px-3 py-2 tabular-nums">{r.duration_ms ? `${r.duration_ms}ms` : '—'}</td>
                              <td className="px-3 py-2">
                                {r.status === 'success' ? (
                                  <Badge variant="default" className="text-[10px]">成功</Badge>
                                ) : r.status === 'retrying' ? (
                                  <Badge variant="secondary" className="text-[10px]">重试中</Badge>
                                ) : (
                                  <span className="text-destructive text-[11px]" title={r.error || ''}>失败</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminOrderOperations;
