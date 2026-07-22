import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPrice } from '@/lib/currency';
import { Inbox, Mail, Clock, CheckCircle2, XCircle, MessageSquare, RefreshCw, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface OfferRow {
  id: string;
  domain_id: string | null;
  amount: number;
  currency: string | null;
  status: string;
  message: string | null;
  created_at: string;
  updated_at: string;
  contact_email: string | null;
  transaction_id: string | null;
  domain_name?: string;
}

const STATUS_META: Record<string, { label: string; tone: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any; hint: string }> = {
  pending: { label: '待处理', tone: 'secondary', icon: Clock, hint: '邮件已发送给卖家，等待回复' },
  sent: { label: '已发送', tone: 'secondary', icon: Mail, hint: '报价邮件已成功送达卖家' },
  viewed: { label: '卖家已查看', tone: 'secondary', icon: Mail, hint: '卖家已打开邮件，等待回复' },
  countered: { label: '已还价', tone: 'default', icon: MessageSquare, hint: '卖家已回复还价，请及时查看' },
  accepted: { label: '已接受', tone: 'default', icon: CheckCircle2, hint: '卖家已接受您的报价，可以进入结算' },
  rejected: { label: '已拒绝', tone: 'destructive', icon: XCircle, hint: '卖家已拒绝此次报价' },
  expired: { label: '已过期', tone: 'outline', icon: Clock, hint: '报价超时未回复' },
  completed: { label: '已完成', tone: 'default', icon: CheckCircle2, hint: '交易已完成' },
};

function statusMeta(s: string) {
  return STATUS_META[s] || { label: s, tone: 'outline' as const, icon: Clock, hint: '状态未知' };
}

export default function MyOffers() {
  const { user } = useAuth();
  const [rows, setRows] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>('all');

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: offers, error } = await (supabase as any)
        .from('domain_offers')
        .select('id, domain_id, amount, currency, status, message, created_at, updated_at, contact_email, transaction_id')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const ids = Array.from(new Set((offers || []).map((o: any) => o.domain_id).filter(Boolean)));
      let nameMap: Record<string, string> = {};
      if (ids.length) {
        const { data: doms } = await (supabase as any).from('domains').select('id, name').in('id', ids);
        (doms || []).forEach((d: any) => { nameMap[d.id] = d.name; });
      }
      setRows((offers || []).map((o: any) => ({ ...o, domain_name: o.domain_id ? nameMap[o.domain_id] : undefined })));
    } catch (e: any) {
      console.error(e);
      toast.error('加载失败：' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  // Realtime updates on my offers
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('my-offers-' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'domain_offers', filter: `buyer_id=eq.${user.id}` }, () => {
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const stats = useMemo(() => {
    const c = (k: string[]) => rows.filter((r) => k.includes(r.status)).length;
    return {
      total: rows.length,
      pending: c(['pending', 'sent', 'viewed']),
      replied: c(['countered', 'accepted', 'rejected']),
      completed: c(['completed', 'accepted']),
    };
  }, [rows]);

  const filtered = useMemo(() => {
    if (tab === 'all') return rows;
    if (tab === 'pending') return rows.filter((r) => ['pending', 'sent', 'viewed'].includes(r.status));
    if (tab === 'replied') return rows.filter((r) => ['countered', 'accepted', 'rejected'].includes(r.status));
    if (tab === 'completed') return rows.filter((r) => ['completed'].includes(r.status));
    return rows;
  }, [rows, tab]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">请先登录查看您的报价记录。</p>
        <Link to="/auth" className="underline mt-2 inline-block">前往登录</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Inbox className="w-5 h-5" /> 我的报价
          </h1>
          <p className="text-sm text-muted-foreground mt-1">追踪您提交的每一笔报价，实时同步邮件送达、卖家回复及成交进度。</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> 刷新
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Stat label="累计报价" value={String(stats.total)} />
        <Stat label="待卖家回复" value={String(stats.pending)} icon={<Clock className="w-4 h-4" />} />
        <Stat label="已收到回复" value={String(stats.replied)} icon={<MessageSquare className="w-4 h-4" />} />
        <Stat label="已完成" value={String(stats.completed)} icon={<CheckCircle2 className="w-4 h-4" />} highlight />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="pending">待处理</TabsTrigger>
          <TabsTrigger value="replied">已回复</TabsTrigger>
          <TabsTrigger value="completed">已完成</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">报价记录 ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">加载中…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              暂无记录，<Link to="/marketplace" className="underline">前往市场</Link> 寻找心仪域名。
            </div>
          ) : (
            filtered.map((r) => {
              const meta = statusMeta(r.status);
              const Icon = meta.icon;
              return (
                <div key={r.id} className="px-4 py-3.5 flex items-center gap-3 hover:bg-muted/40 transition-colors">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {r.domain_name ? (
                        <Link to={`/domain/${r.domain_name}`} className="font-mono text-sm uppercase truncate hover:underline">
                          {r.domain_name}
                        </Link>
                      ) : (
                        <span className="font-mono text-sm text-muted-foreground">已删除域名</span>
                      )}
                      <Badge variant={meta.tone}>{meta.label}</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {meta.hint} · {new Date(r.created_at).toLocaleString('zh-CN')}
                    </div>
                    {r.message && (
                      <div className="text-[11px] text-muted-foreground mt-1 truncate italic">
                        “{r.message}”
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="tabular-nums text-sm font-semibold">
                      {formatPrice(Number(r.amount), (r.currency || 'CNY') as any)}
                    </div>
                    {r.transaction_id ? (
                      <Link to={`/order/${r.transaction_id}`} className="text-[11px] underline inline-flex items-center gap-0.5">
                        查看订单 <ArrowRight className="w-3 h-3" />
                      </Link>
                    ) : r.domain_name ? (
                      <Link to={`/domain/${r.domain_name}`} className="text-[11px] text-muted-foreground hover:underline">
                        查看域名
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, icon, highlight }: { label: string; value: string; icon?: React.ReactNode; highlight?: boolean }) {
  return (
    <Card className={highlight ? 'border-primary/40 bg-primary/5' : ''}>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">{icon}{label}</div>
        <div className="text-xl md:text-2xl font-semibold tabular-nums mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
