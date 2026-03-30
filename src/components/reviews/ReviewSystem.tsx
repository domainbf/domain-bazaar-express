import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/apiClient';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Star } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ReviewSystemProps {
  transactionId: string;
  reviewedUserId: string;
  onDone?: () => void;
}

interface Review {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
  reviewer_id: string | null;
  reviewer?: {
    full_name: string | null;
    username: string | null;
  };
}

export const ReviewSystem = ({ transactionId, reviewedUserId, onDone }: ReviewSystemProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    checkExistingReview();
  }, []);

  const checkExistingReview = async () => {
    const { data } = await supabase
      .from('user_reviews')
      .select('id')
      .eq('transaction_id', transactionId)
      .eq('reviewer_id', user?.id)
      .maybeSingle();
    if (data) setHasReviewed(true);
  };

  const submitReview = async () => {
    if (rating === 0) { toast.error('请选择评分'); return; }
    if (!comment.trim()) { toast.error('请填写评价内容'); return; }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('user_reviews').insert({
        transaction_id: transactionId,
        reviewer_id: user?.id,
        reviewed_user_id: reviewedUserId,
        rating,
        comment: comment.trim(),
      });
      if (error) throw error;

      const { data: reviews } = await supabase
        .from('user_reviews')
        .select('rating')
        .eq('reviewed_user_id', reviewedUserId);
      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length;
        await supabase.from('profiles').update({ seller_rating: Math.round(avg * 10) / 10 }).eq('id', reviewedUserId);
      }

      await supabase.from('notifications').insert({
        user_id: reviewedUserId,
        type: 'review_received',
        title: '收到新评价',
        message: `您收到了一条 ${rating} 星评价`,
        data: { transaction_id: transactionId },
      });

      toast.success('评价提交成功！');
      setHasReviewed(true);
      onDone?.();
    } catch {
      toast.error('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasReviewed) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Star className="w-10 h-10 mx-auto mb-2 text-yellow-400 fill-yellow-400" />
        <p className="font-medium">已提交评价</p>
        <p className="text-sm mt-1">感谢您的反馈</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-1">
      <div>
        <p className="text-sm font-medium mb-2">评分</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              data-testid={`star-${star}`}
            >
              <Star className={`w-8 h-8 transition-colors ${
                star <= (hoverRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
              }`} />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-muted-foreground self-center">
              {['', '很差', '较差', '一般', '满意', '非常满意'][rating]}
            </span>
          )}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-1">评价内容</p>
        <Textarea
          placeholder="分享您的交易体验，帮助其他用户做出更好的决策..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={4}
          data-testid="input-review-comment"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onDone}>取消</Button>
        <Button onClick={submitReview} disabled={isSubmitting || rating === 0} data-testid="button-submit-review">
          {isSubmitting ? <LoadingSpinner size="sm" /> : '提交评价'}
        </Button>
      </div>
    </div>
  );
};

// Public reviews display component
export const UserReviews = ({ userId }: { userId: string }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [userId]);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_reviews')
        .select('*, reviewer:profiles!reviewer_id(full_name, username)')
        .eq('reviewed_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      const reviewData = (data ?? []) as unknown as Review[];
      setReviews(reviewData);
      if (reviewData.length > 0) {
        const avg = reviewData.reduce((s, r) => s + (r.rating ?? 0), 0) / reviewData.length;
        setAvgRating(Math.round(avg * 10) / 10);
      }
    } catch {
      toast.error('加载评价失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-4"><LoadingSpinner /></div>;

  return (
    <div className="space-y-4">
      {reviews.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-muted/40 rounded-lg">
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-500">{avgRating}</p>
            <div className="flex gap-0.5 justify-center mt-1">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-3 h-3 ${s <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">综合评分</p>
            <p className="text-sm font-medium">{reviews.length} 条评价</p>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Star className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">暂无评价</p>
        </div>
      ) : (
        reviews.map(review => (
          <div key={review.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">
                    {(review.reviewer?.full_name ?? review.reviewer?.username ?? '?')[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {review.reviewer?.full_name ?? review.reviewer?.username ?? '匿名用户'}
                </span>
              </div>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-3.5 h-3.5 ${s <= (review.rating ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                ))}
              </div>
            </div>
            {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
            {review.created_at && (
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: zhCN })}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
};
