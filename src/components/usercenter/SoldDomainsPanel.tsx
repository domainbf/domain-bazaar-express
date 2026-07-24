import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import {
  RefreshCw, ArrowRight, Copy, CheckCircle2, Clock,
  Globe, Package, User as UserIcon, Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface SoldRow {
  id: string;
  order_number: string | null;
  amount: number;
  currency: string | null;
  status: string;
  progress_stage: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  buyer_id: string | null;
  domain_id: string;
  domain_name: string;
  buyer_email: string | null;
  buyer_name: string | null;
}

const STAGE_STYLE: Record<string, { label: string; className: string }> = {
  payment_pending: { label: '待付款', className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
  paid:            { label: '已付款', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  in_escrow:       { label: '资金托管中', className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400' },
  transferred:     { label: '已过户', className: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' },
  activation:      { label: '激活中', className: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400' },
  completed:       { label: '交易完成', className: 'bg-green-500/10 text-green-700 dark:text-green-400' },
};

export const SoldDomainsPanel = () => {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const dfLocale = i18n.language?.startsWith('zh') ? zhCN : enUS;
  const [rows, setRows] = useState<SoldRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id, order_number, amount, currency, status, progress_stage,
          created_at, updated_at, completed_at, buyer_id, domain_id,
          domains:domain_id ( name ),
          buyer:profiles!transactions_buyer_id_fkey ( email, full_name, username )
        `)
        .eq('seller_id', user.id)
        .or('progress_stage.in.(transferred,completed),status.in.(completed,domain_transferred,buyer_confirmed)')
        .order('updated_at', { ascending: false });

      if (error) {
        // Fallback if the FK alias isn't inferable — retry without buyer join
        const { data: data2, error: err2 } = await supabase
          .from('transactions')
          .select(`id, order_number, amount, currency, status, progress_stage,
            created_at, updated_at, completed_at, buyer_id, domain_id,
            domains:domain_id ( name )`)
          .eq('seller_id', user.id)
          .or('progress_stage.in.(transferred,completed),status.in.(completed,domain_transferred,buyer_confirmed)')
          .order('updated_at', { ascending: false });
        if (err2) throw err2;

        const buyerIds = Array.from(new Set((data2 || []).map((r: any) => r.buyer_id).filter(Boolean)));
        let buyerMap: Record<string, any> = {};
        if (buyerIds.length) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id,email,full_name,username')
            .in('id', buyerIds);
          buyerMap = Object.fromEntries((profs || []).map((p: any) => [p.id, p]));
        }
        setRows((data2 || []).map((t: any) => ({
          id: t.id,
          order_number: t.order_number,
          amount: Number(t.amount ?? 0),
          currency: t.currency,
          status: t.status,
          progress_stage: t.progress_stage,
          created_at: t.created_at,
          updated_at: t.updated_at,
          completed_at: t.completed_at,
          buyer_id: t.buyer_id,
          domain_id: t.domain_id,
          domain_name: t.domains?.name ?? '—',
          buyer_email: buyerMap[t.buyer_id]?.email ?? null,
          buyer_name: buyerMap[t.buyer_id]?.full_name ?? buyerMap[t.buyer_id]?.username ?? null,
        })));
      } else {
        setRows((data || []).map((t: any) => ({
          id: t.id,
          order_number: t.order_number,
          amount: Number(t.amount ?? 0),
          currency: t.currency,
          status: t.status,
          progress_stage: t.progress_stage,
          created_at: t.created_at,
          updated_at: t.updated_at,
          completed_at: t.completed_at,
          buyer_id: t.buyer_id,
          domain_id: t.domain_id,
          domain_name: t.domains?.name ?? '—',
          buyer_email: t.buyer?.email ?? null,
          buyer_name: t.buyer?.full_name ?? t.buyer?.username ?? null,
        })));
      }
    } catch (e: any) {
      console.error('[SoldDomainsPanel] load failed', e);
      toast.error('加载已售域名失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Realtime: refresh on any transaction update for this seller
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel('sold-domains-' + user.id)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `seller_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  const refresh = () => { setRefreshing(true); load(); };

  const shortOrder = (r: SoldRow) => r.order_number || ('#' + r.id.slice(0, 8).toUpperCase());
  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); toast.success(`${label}已复制`); }
    catch { toast.error('复制失败'); }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">暂无已售域名</p>
          <p className="text-xs mt-1 opacity-70">当您的域名成交后将出现在这里</p>
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = rows.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="space-y-4">
      {/* 汇总栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs text-muted-foreground">已售域名</p>
            <p className="text-2xl font-bold">{rows.length}</p>
          </div>
          <div className="h-8 w-px bg-border hidden sm:block" />
          <div>
            <p className="text-xs text-muted-foreground">累计成交额</p>
            <p className="text-2xl font-bold text-green-600">
              {formatPrice(totalRevenue, rows[0]?.currency || "CNY")}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 列表 */}
      <div className="space-y-3">
        {rows.map(r => {
          const stage = STAGE_STYLE[r.progress_stage || ''] || STAGE_STYLE[r.status] || { label: r.progress_stage || r.status || '—', className: 'bg-muted text-muted-foreground' };
          const settledAt = r.completed_at || r.updated_at;
          return (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* 主体信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <Globe className="h-4 w-4 text-primary shrink-0" />
                      <Link
                        to={`/domain/${r.domain_name}`}
                        className="font-mono font-semibold text-base hover:underline truncate"
                        title={r.domain_name}
                      >
                        {r.domain_name}
                      </Link>
                      <Badge variant="outline" className={stage.className}>
                        {r.progress_stage === 'completed' || r.status === 'completed'
                          ? <CheckCircle2 className="h-3 w-3 mr-1" />
                          : <Clock className="h-3 w-3 mr-1" />}
                        {stage.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-0.5">订单号</p>
                        <button
                          onClick={() => copy(shortOrder(r).replace(/^#/, ''), '订单号')}
                          className="font-mono hover:text-primary inline-flex items-center gap-1"
                          title="点击复制"
                        >
                          {shortOrder(r)}
                          <Copy className="h-3 w-3 opacity-40" />
                        </button>
                      </div>
                      <div className="min-w-0">
                        <p className="text-muted-foreground mb-0.5 flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />买家
                        </p>
                        <p className="truncate" title={r.buyer_name || r.buyer_email || ''}>
                          {r.buyer_name || r.buyer_email?.split('@')[0] || '匿名'}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-muted-foreground mb-0.5 flex items-center gap-1">
                          <Mail className="h-3 w-3" />联系邮箱
                        </p>
                        {r.buyer_email ? (
                          <a href={`mailto:${r.buyer_email}`} className="truncate block hover:text-primary" title={r.buyer_email}>
                            {r.buyer_email}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">成交金额</p>
                        <p className="font-semibold text-green-600">
                          {formatPrice(r.amount, r.currency || "CNY")}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      <span>创建于 {new Date(r.created_at).toLocaleDateString()}</span>
                      <span>
                        最后更新 {formatDistanceToNow(new Date(settledAt), { addSuffix: true, locale: dfLocale })}
                      </span>
                      {r.completed_at && (
                        <span className="text-green-600">
                          完成于 {new Date(r.completed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 操作 */}
                  <div className="flex md:flex-col gap-2 md:w-32 shrink-0">
                    <Button asChild size="sm" className="flex-1 md:flex-none">
                      <Link to={`/order/${r.id}`}>
                        查看订单 <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
