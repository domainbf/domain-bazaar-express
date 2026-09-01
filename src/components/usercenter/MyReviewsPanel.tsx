import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Star, MessageSquareQuote, Inbox, Pencil, ExternalLink, Clock, CheckCircle2, ThumbsUp, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface ReviewRow {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
  updated_at?: string | null;
  reviewer_id: string | null;
  reviewed_user_id: string | null;
  transaction_id: string | null;
  helpful_count?: number | null;
  reported?: boolean | null;
  status?: string | null;
}

interface TxRow {
  id: string;
  order_number: string | null;
  amount: number | null;
  currency: string | null;
  completed_at: string | null;
  buyer_id: string | null;
  seller_id: string | null;
}

const Stars = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => {
      const filled = i <= value;
      const cls = `h-4 w-4 ${filled ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`;
      return onChange ? (
        <button key={i} type="button" onClick={() => onChange(i)} aria-label={`${i} 星`} className="p-0.5">
          <Star className={cls} />
        </button>
      ) : (
        <Star key={i} className={cls} />
      );
    })}
  </div>
);

const ReviewStatusBadge = ({ r }: { r: ReviewRow }) => {
  if (r.reported) return <Badge variant="destructive" className="text-[10px]"><Clock className="h-3 w-3 mr-1" />审核中</Badge>;
  if ((r.helpful_count ?? 0) > 0) {
    return <Badge className="bg-success/10 text-success border-none text-[10px]"><ThumbsUp className="h-3 w-3 mr-1" />已采纳 {r.helpful_count}</Badge>;
  }
  if ((r.status ?? 'published') !== 'published') {
    return <Badge variant="secondary" className="text-[10px]"><Clock className="h-3 w-3 mr-1" />审核中</Badge>;
  }
  return <Badge variant="outline" className="text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />已发布</Badge>;
};

export const MyReviewsPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<{ review?: ReviewRow; tx?: TxRow } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['my-reviews', user?.id],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async () => {
      const cols = 'id,rating,comment,created_at,updated_at,reviewer_id,reviewed_user_id,transaction_id,helpful_count,reported,status';
      const [received, given, txs] = await Promise.all([
        supabase.from('user_reviews').select(cols).eq('reviewed_user_id', user!.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('user_reviews').select(cols).eq('reviewer_id', user!.id).order('created_at', { ascending: false }).limit(50),
        supabase
          .from('transactions')
          .select('id,order_number,amount,currency,completed_at,buyer_id,seller_id')
          .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(50),
      ]);
      return {
        received: (received.data ?? []) as ReviewRow[],
        given: (given.data ?? []) as ReviewRow[],
        txs: (txs.data ?? []) as TxRow[],
      };
    },
  });

  const received = data?.received ?? [];
  const given = data?.given ?? [];
  const txs = data?.txs ?? [];
  const txMap = new Map(txs.map(t => [t.id, t]));
  const reviewedTxIds = new Set(given.map(g => g.transaction_id).filter(Boolean) as string[]);
  const pendingTxs = txs.filter(t => !reviewedTxIds.has(t.id));

  const avg = received.length
    ? received.reduce((s, r) => s + (Number(r.rating) || 0), 0) / received.length
    : 0;

  const openEditor = (payload: { review?: ReviewRow; tx?: TxRow }) => {
    setEditing(payload);
    setRating(Number(payload.review?.rating) || 5);
    setComment(payload.review?.comment || '');
  };

  const submit = async () => {
    if (!user || !editing) return;
    if (!comment.trim()) return toast.error('请填写评价内容');
    setSaving(true);
    try {
      if (editing.review) {
        const { error } = await supabase
          .from('user_reviews')
          .update({ rating, comment: comment.trim() })
          .eq('id', editing.review.id);
        if (error) throw error;
        toast.success('评价已更新');
      } else if (editing.tx) {
        const counterparty = editing.tx.buyer_id === user.id ? editing.tx.seller_id : editing.tx.buyer_id;
        if (!counterparty) throw new Error('无法确定交易对方');
        const { error } = await supabase.from('user_reviews').insert({
          reviewer_id: user.id,
          reviewed_user_id: counterparty,
          transaction_id: editing.tx.id,
          rating,
          comment: comment.trim(),
        });
        if (error) throw error;
        toast.success('评价已提交');
      }
      setEditing(null);
      await qc.invalidateQueries({ queryKey: ['my-reviews', user.id] });
    } catch (e: any) {
      toast.error(e.message || '提交失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const OrderLink = ({ txId }: { txId: string | null }) => {
    if (!txId) return null;
    const tx = txMap.get(txId);
    return (
      <button
        onClick={() => navigate(`/transaction/${txId}`)}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <ExternalLink className="h-3 w-3" />
        订单 {tx?.order_number || txId.slice(0, 8)}
      </button>
    );
  };

  const ReviewList = ({ rows, emptyText, editable }: { rows: ReviewRow[]; emptyText: string; editable?: boolean }) => {
    if (!rows.length) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        </div>
      );
    }
    return (
      <div className="divide-y divide-border">
        {rows.map(r => (
          <div key={r.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Stars value={Number(r.rating) || 0} />
                <ReviewStatusBadge r={r} />
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {r.created_at ? formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: zhCN }) : ''}
              </span>
            </div>
            <p className="text-sm text-foreground/90 break-words">
              {r.comment?.trim() || <span className="text-muted-foreground">（未填写评价内容）</span>}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <OrderLink txId={r.transaction_id} />
              {editable && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openEditor({ review: r })}>
                  <Pencil className="h-3 w-3 mr-1" />修改评价
                </Button>
              )}
              {r.updated_at && r.created_at && r.updated_at !== r.created_at && (
                <span className="text-[11px] text-muted-foreground">已编辑</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl skeleton-shimmer" />)}</div>;
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquareQuote className="h-4 w-4" />信誉概览
          </CardTitle>
          <CardDescription>买卖双方在交易完成后互相评价，影响您的成交转化率</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-3xl font-bold tabular-nums">{avg ? avg.toFixed(1) : '—'}</div>
              <div className="mt-1"><Stars value={Math.round(avg)} /></div>
            </div>
            <div className="text-sm space-y-1">
              <p className="text-muted-foreground">收到评价 <span className="font-semibold text-foreground">{received.length}</span> 条</p>
              <p className="text-muted-foreground">我发出的评价 <span className="font-semibold text-foreground">{given.length}</span> 条</p>
              <p className="text-muted-foreground">待评价订单 <span className="font-semibold text-foreground">{pendingTxs.length}</span> 个</p>
            </div>
            {avg >= 4.5 && received.length >= 3 && (
              <Badge className="bg-success/10 text-success border-none">优质卖家</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {pendingTxs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">待评价订单</CardTitle>
            <CardDescription>完成的交易可以补充评价，帮助其他用户判断信誉</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {pendingTxs.map(t => (
              <div key={t.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">订单 {t.order_number || t.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.completed_at ? new Date(t.completed_at).toLocaleDateString('zh-CN') : '已完成'}
                    {t.amount != null && ` · ${t.currency || 'CNY'} ${Number(t.amount).toLocaleString()}`}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="shrink-0" onClick={() => openEditor({ tx: t })}>
                  去评价
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">收到的评价</CardTitle></CardHeader>
        <CardContent>
          <ReviewList rows={received} emptyText="还没有收到评价，完成交易后买家即可评价您" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">我发出的评价</CardTitle></CardHeader>
        <CardContent>
          <ReviewList rows={given} emptyText="您还没有评价过其他用户" editable />
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.review ? '修改评价' : '发表评价'}</DialogTitle>
            <DialogDescription>
              {editing?.review
                ? '修改后将重新展示在对方的信誉页面'
                : `针对订单 ${editing?.tx?.order_number || editing?.tx?.id?.slice(0, 8) || ''} 的交易体验评价`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">评分</span>
              <Stars value={rating} onChange={setRating} />
              <span className="text-sm font-medium tabular-nums">{rating}.0</span>
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="描述一下沟通、过户速度与整体体验…"
              className="min-h-[110px]"
              maxLength={500}
            />
            <p className="text-[11px] text-muted-foreground text-right">{comment.length}/500</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>取消</Button>
            <Button onClick={submit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editing?.review ? '保存修改' : '提交评价'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyReviewsPanel;
