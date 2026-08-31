import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquareQuote, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ReviewRow {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
  reviewer_id: string | null;
  reviewed_user_id: string | null;
  helpful_count?: number | null;
}

const Stars = ({ value }: { value: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${i <= value ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`}
      />
    ))}
  </div>
);

const ReviewList = ({ rows, emptyText }: { rows: ReviewRow[]; emptyText: string }) => {
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
        <div key={r.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <Stars value={Number(r.rating) || 0} />
            <span className="text-xs text-muted-foreground shrink-0">
              {r.created_at
                ? formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: zhCN })
                : ''}
            </span>
          </div>
          <p className="text-sm text-foreground/90 break-words">
            {r.comment?.trim() || <span className="text-muted-foreground">（未填写评价内容）</span>}
          </p>
        </div>
      ))}
    </div>
  );
};

export const MyReviewsPanel = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['my-reviews', user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const [received, given] = await Promise.all([
        supabase
          .from('user_reviews')
          .select('id,rating,comment,created_at,reviewer_id,reviewed_user_id,helpful_count')
          .eq('reviewed_user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('user_reviews')
          .select('id,rating,comment,created_at,reviewer_id,reviewed_user_id,helpful_count')
          .eq('reviewer_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);
      return {
        received: (received.data ?? []) as ReviewRow[],
        given: (given.data ?? []) as ReviewRow[],
      };
    },
  });

  const received = data?.received ?? [];
  const given = data?.given ?? [];
  const avg = received.length
    ? received.reduce((s, r) => s + (Number(r.rating) || 0), 0) / received.length
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl skeleton-shimmer" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquareQuote className="h-4 w-4" />
            信誉概览
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
              <p className="text-muted-foreground">
                收到评价 <span className="font-semibold text-foreground">{received.length}</span> 条
              </p>
              <p className="text-muted-foreground">
                我发出的评价 <span className="font-semibold text-foreground">{given.length}</span> 条
              </p>
            </div>
            {avg >= 4.5 && received.length >= 3 && (
              <Badge className="bg-success/10 text-success border-none">优质卖家</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">收到的评价</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewList rows={received} emptyText="还没有收到评价，完成交易后买家即可评价您" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">我发出的评价</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewList rows={given} emptyText="您还没有评价过其他用户" />
        </CardContent>
      </Card>
    </div>
  );
};

export default MyReviewsPanel;
