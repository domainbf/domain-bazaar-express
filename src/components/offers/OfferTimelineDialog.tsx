import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/currency';
import {
  Clock, ArrowRight, ExternalLink, RefreshCw, ShieldCheck, User as UserIcon,
} from 'lucide-react';

export interface OfferTimelineDialogProps {
  offerId: string | null;
  domainName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EventRow {
  id: string;
  from_status: string | null;
  to_status: string;
  actor_id: string | null;
  actor_role: string;
  note: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: '待处理', sent: '已发送', viewed: '卖家已查看', countered: '已还价',
  accepted: '已接受', rejected: '已拒绝', withdrawn: '已撤回', expired: '已过期',
  cancelled: '已取消', completed: '已完成',
};

const ROLE_LABEL: Record<string, string> = {
  buyer: '买家', seller: '卖家', admin: '管理员', system: '系统',
};

const STAGE_LABEL: Record<string, string> = {
  created: '订单创建', submitted: '已提交', paid: '已支付', confirmed: '已确认',
  transferring: '过户中', transferred: '已推送过户', completed: '已完成',
};

export const OfferTimelineDialog = ({ offerId, domainName, open, onOpenChange }: OfferTimelineDialogProps) => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [offer, setOffer] = useState<any>(null);
  const [orderStages, setOrderStages] = useState<{ stage: string; at: string }[]>([]);

  const load = useCallback(async () => {
    if (!offerId) return;
    setLoading(true);
    try {
      const [{ data: o }, { data: ev }] = await Promise.all([
        (supabase as any).from('domain_offers')
          .select('id, amount, currency, status, message, created_at, updated_at, transaction_id, reviewed_by, reviewed_at, review_note')
          .eq('id', offerId).maybeSingle(),
        (supabase as any).from('offer_status_events')
          .select('id, from_status, to_status, actor_id, actor_role, note, created_at')
          .eq('offer_id', offerId).order('created_at', { ascending: true }),
      ]);
      setOffer(o || null);
      setEvents((ev || []) as EventRow[]);

      if (o?.transaction_id) {
        const { data: tx } = await (supabase as any).from('transactions')
          .select('progress_stage, stage_history, created_at, completed_at')
          .eq('id', o.transaction_id).maybeSingle();
        const hist = (tx?.stage_history || {}) as Record<string, string>;
        const stages = Object.entries(hist)
          .map(([stage, at]) => ({ stage, at: String(at) }))
          .sort((a, b) => +new Date(a.at) - +new Date(b.at));
        if (tx?.created_at) stages.unshift({ stage: 'created', at: tx.created_at });
        setOrderStages(stages);
      } else {
        setOrderStages([]);
      }
    } catch (e) {
      console.error('加载时间线失败', e);
    } finally {
      setLoading(false);
    }
  }, [offerId]);

  useEffect(() => { if (open) load(); }, [open, load]);

  // 实时刷新时间线
  useEffect(() => {
    if (!open || !offerId) return;
    const channel = supabase
      .channel('offer-timeline-' + offerId)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'offer_status_events', filter: `offer_id=eq.${offerId}`,
      }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [open, offerId, load]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4" /> 报价操作时间线
          </DialogTitle>
          <DialogDescription className="break-all">
            {domainName ? <span className="font-mono uppercase">{domainName}</span> : '报价'}
            {offer && <> · {formatPrice(Number(offer.amount), (offer.currency || 'CNY') as any)}</>}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{STATUS_LABEL[offer?.status] || offer?.status || '—'}</Badge>
              <Button variant="ghost" size="sm" onClick={load}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> 刷新
              </Button>
            </div>

            {offer?.reviewed_at && (
              <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-1">
                <p className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> 最近一次人工审核
                </p>
                <p className="text-muted-foreground">
                  处理时间：{new Date(offer.reviewed_at).toLocaleString('zh-CN')}
                </p>
                <p className="text-muted-foreground break-all">
                  处理人 ID：{offer.reviewed_by || '—'}
                </p>
                {offer.review_note && <p className="text-muted-foreground">备注：{offer.review_note}</p>}
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">报价状态</p>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无状态记录。</p>
              ) : (
                <ol className="relative border-l border-border pl-4 space-y-4">
                  {events.map((e) => (
                    <li key={e.id} className="relative">
                      <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary" />
                      <div className="text-sm font-medium">
                        {e.from_status ? `${STATUS_LABEL[e.from_status] || e.from_status} → ` : ''}
                        {STATUS_LABEL[e.to_status] || e.to_status}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <UserIcon className="w-3 h-3" />
                        {ROLE_LABEL[e.actor_role] || e.actor_role}
                        · {new Date(e.created_at).toLocaleString('zh-CN')}
                      </div>
                      {e.note && <p className="text-xs text-muted-foreground mt-1">{e.note}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {offer?.transaction_id && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">关联订单</p>
                <ol className="relative border-l border-border pl-4 space-y-3">
                  {orderStages.map((s, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-success" />
                      <div className="text-sm">{STAGE_LABEL[s.stage] || s.stage}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(s.at).toLocaleString('zh-CN')}
                      </div>
                    </li>
                  ))}
                  {orderStages.length === 0 && (
                    <li className="text-sm text-muted-foreground">订单已创建，暂无阶段记录。</li>
                  )}
                </ol>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link to={`/order/${offer.transaction_id}`}>
                    查看订单详情 <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            )}

            {domainName && (
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/domain/${domainName}`}>
                  查看域名 <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
