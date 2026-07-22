import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Download, Mail, RefreshCw } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { OrderProgressTracker } from '@/components/order/OrderProgressTracker';
import { toast } from 'sonner';

interface Txn {
  id: string;
  order_number: string | null;
  amount: number;
  currency: string;
  payment_method: string | null;
  payment_id: string | null;
  status: string;
  progress_stage: string;
  stage_history: Record<string, string>;
  receipt_sent_at: string | null;
  receipt_summary: any;
  domain_id: string | null;
  created_at: string;
}

const fmt = (v: number, cur = 'CNY') => {
  const sym = cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '¥';
  return `${sym}${Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
};

export default function OrderDetailPage() {
  const { id = '' } = useParams();
  const [txn, setTxn] = useState<Txn | null>(null);
  const [domainName, setDomainName] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .or(`id.eq.${id},order_number.eq.${id}`)
      .maybeSingle();
    if (data) {
      setTxn(data as any);
      if ((data as any).domain_id) {
        const { data: d } = await supabase
          .from('domains')
          .select('name')
          .eq('id', (data as any).domain_id)
          .maybeSingle();
        setDomainName((d as any)?.name || '');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const copy = () => {
    if (!txn) return;
    navigator.clipboard.writeText(txn.order_number || txn.id).then(() => toast.success('订单号已复制'));
  };

  const resend = async () => {
    if (!txn) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-order-receipt', {
        body: { transaction_id: txn.id, force: true },
      });
      if (error) throw error;
      toast.success('电子收据已重新发送');
      load();
    } catch (e: any) {
      toast.error('发送失败：' + (e?.message || '未知错误'));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-16 text-sm text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!txn) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
          <h1 className="text-2xl font-bold mb-2">订单不存在</h1>
          <p className="text-sm text-muted-foreground mb-6">该订单号无效或已被删除。</p>
          <Link to="/user-center?tab=transactions">
            <Button variant="outline">返回我的订单</Button>
          </Link>
        </div>
      </div>
    );
  }

  const summary = (txn.receipt_summary || {}) as any;
  const dns = Array.isArray(summary?.dns) ? summary.dns : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/user-center?tab=transactions" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> 我的订单
          </Link>
          <Badge variant={txn.status === 'completed' ? 'default' : 'secondary'}>
            {txn.status === 'completed' ? '已完成' : txn.status}
          </Badge>
        </div>

        <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-2xl border border-border bg-card overflow-hidden mb-5">
          <div className="px-6 py-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">订单号</div>
              <div className="font-mono font-semibold mt-0.5">{txn.order_number || txn.id}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(txn.created_at).toLocaleString('zh-CN')} · {txn.payment_method || '—'}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={copy}>
                <Copy className="w-3.5 h-3.5 mr-1.5" /> 复制
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.print()}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> 打印
              </Button>
              <Button variant="ghost" size="sm" onClick={resend} disabled={sending}>
                {sending ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Mail className="w-3.5 h-3.5 mr-1.5" />}
                {txn.receipt_sent_at ? '重发收据' : '发送收据'}
              </Button>
            </div>
          </div>

          <div className="p-6 flex items-baseline justify-between border-b border-border">
            <div>
              <div className="text-xs text-muted-foreground">域名</div>
              <div className="text-lg font-mono font-semibold">{domainName || '—'}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">实付金额</div>
              <div className="text-3xl font-bold gradient-text tabular-nums">{fmt(txn.amount, txn.currency)}</div>
            </div>
          </div>

          {txn.payment_id && (
            <div className="px-6 py-3 bg-muted/30 text-xs text-muted-foreground border-b border-border">
              支付流水：<span className="font-mono text-foreground">{txn.payment_id}</span>
            </div>
          )}
        </motion.div>

        <OrderProgressTracker orderId={txn.id} initialStage={txn.progress_stage as any} initialHistory={txn.stage_history || {}} />

        {(dns.length > 0 || summary.email_forwarding || summary.url_redirect || summary.expires_at) && (
          <div className="mt-5 rounded-2xl border border-border bg-card p-5">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">配置摘要</div>
            <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">邮箱转发</div>
                <div>{summary.email_forwarding || <span className="text-muted-foreground">未配置</span>}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">URL 重定向</div>
                <div className="break-all">{summary.url_redirect || <span className="text-muted-foreground">未配置</span>}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">到期日</div>
                <div>{summary.expires_at ? new Date(summary.expires_at).toLocaleDateString('zh-CN') : <span className="text-muted-foreground">激活后确定</span>}</div>
              </div>
            </div>
            {dns.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">类型</th>
                      <th className="text-left px-3 py-2 font-medium">主机记录</th>
                      <th className="text-left px-3 py-2 font-medium">值</th>
                      <th className="text-left px-3 py-2 font-medium">TTL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dns.map((r: any, i: number) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2 font-mono">{r.type}</td>
                        <td className="px-3 py-2 font-mono">{r.name || '@'}</td>
                        <td className="px-3 py-2 font-mono break-all">{r.value}</td>
                        <td className="px-3 py-2 text-muted-foreground">{r.ttl ?? 3600}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
