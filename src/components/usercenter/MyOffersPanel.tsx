import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatPrice } from '@/lib/currency';
import {
  Search, RefreshCw, Clock, Mail, MessageSquare, CheckCircle2, XCircle,
  ArrowRight, ChevronLeft, ChevronRight, Copy, Inbox, History,
} from 'lucide-react';
import { toast } from 'sonner';
import { OfferTimelineDialog } from '@/components/offers/OfferTimelineDialog';

interface OfferRow {
  id: string;
  domain_id: string | null;
  amount: number;
  currency: string | null;
  status: string;
  message: string | null;
  created_at: string;
  updated_at: string;
  transaction_id: string | null;
  domain_name?: string;
}

const STATUS_META: Record<string, { label: string; tone: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any; hint: string }> = {
  pending:   { label: '待处理',      tone: 'secondary',   icon: Clock,          hint: '邮件已发送给卖家，等待回复' },
  sent:      { label: '已发送',      tone: 'secondary',   icon: Mail,           hint: '报价邮件已成功送达卖家' },
  viewed:    { label: '卖家已查看',  tone: 'secondary',   icon: Mail,           hint: '卖家已打开邮件，等待回复' },
  countered: { label: '已还价',      tone: 'default',     icon: MessageSquare,  hint: '卖家已回复还价，请及时查看' },
  accepted:  { label: '已接受',      tone: 'default',     icon: CheckCircle2,   hint: '卖家已接受您的报价，可进入结算' },
  rejected:  { label: '已拒绝',      tone: 'destructive', icon: XCircle,        hint: '卖家已拒绝此次报价' },
  withdrawn: { label: '已撤回',      tone: 'outline',     icon: XCircle,        hint: '您已撤回此次报价' },
  expired:   { label: '已过期',      tone: 'outline',     icon: Clock,          hint: '报价超时未回复' },
  completed: { label: '已完成',      tone: 'default',     icon: CheckCircle2,   hint: '交易已完成' },
};

const statusMeta = (s: string) =>
  STATUS_META[s] || { label: s, tone: 'outline' as const, icon: Clock, hint: '状态未知' };

const GROUPS: Record<string, string[] | null> = {
  all: null,
  pending: ['pending', 'sent', 'viewed'],
  replied: ['countered', 'accepted', 'rejected'],
  closed: ['completed', 'withdrawn', 'expired'],
};

const PAGE_SIZE = 10;

export const MyOffersPanel = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<OfferRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 350);
  const [group, setGroup] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [search, group, sortBy]);

  const load = useCallback(async () => {
    if (!user) { setRows([]); setTotal(0); setLoading(false); return; }
    try {
      // Resolve domain ids first when searching by domain name
      let domainIds: string[] | null = null;
      const term = search.trim().replace(/[%,()]/g, '');
      if (term) {
        const [{ data: a }, { data: b }] = await Promise.all([
          (supabase as any).from('domains').select('id, name').ilike('name', `%${term}%`).limit(100),
          (supabase as any).from('domain_listings').select('id, name').ilike('name', `%${term}%`).limit(100),
        ]);
        domainIds = Array.from(new Set([...(a || []), ...(b || [])].map((d: any) => d.id)));
        if (domainIds.length === 0) { setRows([]); setTotal(0); setLoading(false); setRefreshing(false); return; }
      }

      let q = (supabase as any)
        .from('domain_offers')
        .select('id, domain_id, amount, currency, status, message, created_at, updated_at, transaction_id', { count: 'exact' })
        .eq('buyer_id', user.id);

      const statuses = GROUPS[group];
      if (statuses) q = q.in('status', statuses);
      if (domainIds) q = q.in('domain_id', domainIds);

      switch (sortBy) {
        case 'oldest': q = q.order('created_at', { ascending: true }); break;
        case 'amount-high': q = q.order('amount', { ascending: false }); break;
        case 'amount-low': q = q.order('amount', { ascending: true }); break;
        default: q = q.order('created_at', { ascending: false });
      }

      const from = (page - 1) * PAGE_SIZE;
      const { data, error, count } = await q.range(from, from + PAGE_SIZE - 1);
      if (error) throw error;

      const offers = (data || []) as OfferRow[];
      const ids = Array.from(new Set(offers.map((o) => o.domain_id).filter(Boolean))) as string[];
      const nameMap: Record<string, string> = {};
      if (ids.length) {
        const [{ data: d1 }, { data: d2 }] = await Promise.all([
          (supabase as any).from('domains').select('id, name').in('id', ids),
          (supabase as any).from('domain_listings').select('id, name').in('id', ids),
        ]);
        [...(d1 || []), ...(d2 || [])].forEach((d: any) => { nameMap[d.id] = d.name; });
      }
      setRows(offers.map((o) => ({ ...o, domain_name: o.domain_id ? nameMap[o.domain_id] : undefined })));
      setTotal(count ?? 0);
    } catch (e: any) {
      console.error(e);
      toast.error('加载报价记录失败：' + (e.message || ''));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, search, group, sortBy, page]);

  useEffect(() => { load(); }, [load]);

  // Realtime sync
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('usercenter-my-offers-' + user.id)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'domain_offers', filter: `buyer_id=eq.${user.id}`,
      }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, load]);

  const withdraw = async (id: string) => {
    try {
      const { error } = await (supabase as any).from('domain_offers').update({ status: 'withdrawn' }).eq('id', id);
      if (error) throw error;
      toast.success('已撤回报价');
      load();
    } catch (e: any) { toast.error(e.message || '撤回失败'); }
  };

  const resend = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-offer-notification', { body: { offerId: id, resend: true } });
      if (error) throw error;
      toast.success('已重新发送邮件通知');
    } catch (e: any) { toast.error(e.message || '重发失败'); }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (!user) {
    return <p className="text-sm text-muted-foreground py-8 text-center">请先登录查看您的报价记录。</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Inbox className="w-4 h-4" /> 我提交的报价
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">共 {total} 条记录 · 状态实时同步</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => { setRefreshing(true); load(); }}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} /> 刷新
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/my-offers">完整页面 <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 h-9"
            placeholder="按域名搜索报价…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select value={group} onValueChange={setGroup}>
          <SelectTrigger className="w-full md:w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待回复</SelectItem>
            <SelectItem value="replied">已回复</SelectItem>
            <SelectItem value="closed">已结束</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">最新提交</SelectItem>
            <SelectItem value="oldest">最早提交</SelectItem>
            <SelectItem value="amount-high">金额高到低</SelectItem>
            <SelectItem value="amount-low">金额低到高</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 divide-y">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              暂无报价记录，<Link to="/marketplace" className="underline">前往市场</Link> 寻找心仪域名。
            </div>
          ) : rows.map((r) => {
            const meta = statusMeta(r.status);
            const Icon = meta.icon;
            return (
              <div key={r.id} className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-muted/40 transition-colors">
                <div className="shrink-0 w-9 h-9 rounded-full bg-muted hidden sm:flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.domain_name ? (
                      <Link to={`/domain/${r.domain_name}`} className="font-mono text-sm uppercase break-all hover:underline">
                        {r.domain_name}
                      </Link>
                    ) : (
                      <span className="font-mono text-sm text-muted-foreground">已下架域名</span>
                    )}
                    <Badge variant={meta.tone}>{meta.label}</Badge>
                    {r.domain_name && (
                      <button
                        type="button"
                        title="复制域名"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => { navigator.clipboard.writeText(r.domain_name!); toast.success('已复制'); }}
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {meta.hint} · {new Date(r.created_at).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div className="sm:text-right shrink-0 space-y-1">
                  <div className="tabular-nums text-sm font-semibold">
                    {formatPrice(Number(r.amount), (r.currency || 'CNY') as any)}
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end text-[11px]">
                    {r.transaction_id && (
                      <Link to={`/order/${r.transaction_id}`} className="underline inline-flex items-center gap-0.5">
                        查看订单 <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                    {r.status === 'accepted' && !r.transaction_id && r.domain_name && (
                      <Link to={`/checkout?domain=${encodeURIComponent(r.domain_name)}`} className="underline">去结算</Link>
                    )}
                    {['pending', 'sent', 'viewed', 'countered'].includes(r.status) && (
                      <>
                        <button className="text-muted-foreground hover:text-foreground underline" onClick={() => withdraw(r.id)}>撤回</button>
                        <button className="text-muted-foreground hover:text-foreground underline" onClick={() => resend(r.id)}>重发邮件</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">第 {page} / {totalPages} 页</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="w-4 h-4" /> 上一页
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
              下一页 <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
