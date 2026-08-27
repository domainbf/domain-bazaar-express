import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ListChecks, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_LABEL: Record<string, string> = {
  pending: '待处理', sent: '已发送', viewed: '卖家已查看', countered: '已还价',
  accepted: '已接受', rejected: '已拒绝', withdrawn: '已撤回', expired: '已过期',
  cancelled: '已取消', completed: '已完成',
};

interface MyOffer {
  id: string;
  amount: number;
  currency: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  transaction_id: string | null;
}

interface EventRow {
  id: string;
  offer_id: string;
  from_status: string | null;
  to_status: string;
  actor_role: string;
  note: string | null;
  created_at: string;
}

/** 当前用户在该域名下的报价时间轴（含每次状态更新） */
export function MyOfferTimeline({ domainId }: { domainId?: string }) {
  const { user } = useAuth();
  const [offers, setOffers] = useState<MyOffer[]>([]);
  const [events, setEvents] = useState<Record<string, EventRow[]>>({});
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user || !domainId) { setOffers([]); return; }
    setLoading(true);
    try {
      const { data: rows } = await (supabase as any)
        .from('domain_offers')
        .select('id, amount, currency, status, created_at, updated_at, transaction_id')
        .eq('domain_id', domainId)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      const list = (rows || []) as MyOffer[];
      setOffers(list);
      if (list.length) {
        const { data: ev } = await (supabase as any)
          .from('offer_status_events')
          .select('id, offer_id, from_status, to_status, actor_role, note, created_at')
          .in('offer_id', list.map((o) => o.id))
          .order('created_at', { ascending: true });
        const map: Record<string, EventRow[]> = {};
        (ev || []).forEach((e: EventRow) => {
          (map[e.offer_id] ||= []).push(e);
        });
        setEvents(map);
      } else {
        setEvents({});
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, domainId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user || !domainId) return;
    const channel = (supabase as any)
      .channel(`my-offers-${domainId}-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'domain_offers', filter: `buyer_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { (supabase as any).removeChannel(channel); };
  }, [user?.id, domainId, load]);

  if (!user || !domainId) return null;

  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <ListChecks className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">我的报价</span>
        <Link to="/my-offers" className="ml-auto">
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] gap-1">
            报价中心 <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      <div className="px-3 py-2.5 space-y-3">
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
        ) : offers.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">你还没有对该域名报价</p>
        ) : (
          offers.map((o) => {
            const evs = events[o.id] || [];
            const steps = evs.length
              ? evs.map((e) => ({ label: STATUS_LABEL[e.to_status] || e.to_status, at: e.created_at, note: e.note, role: e.actor_role }))
              : [{ label: '已提交', at: o.created_at, note: null as string | null, role: 'buyer' }];
            return (
              <div key={o.id} className="rounded-md bg-muted/40 border border-border/60 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold tabular-nums">
                    {formatPrice(Number(o.amount), (o.currency || 'CNY') as any)}
                  </span>
                  <Badge variant="outline" className="text-[10px]">{STATUS_LABEL[o.status] || o.status}</Badge>
                </div>
                <ol className="mt-2 space-y-1.5">
                  {steps.map((s, i) => (
                    <li key={i} className="flex gap-2 text-[11px]">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-foreground/60 shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="font-medium text-foreground">{s.label}</span>
                        {s.note && <span className="text-muted-foreground"> · {s.note}</span>}
                        <span className="block text-muted-foreground">
                          {new Date(s.at).toLocaleString('zh-CN')}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
                {o.transaction_id && (
                  <Link to={`/order/${o.transaction_id}`} className="text-[11px] underline mt-1.5 inline-flex items-center gap-0.5">
                    查看订单 <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
