import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageCircle, ThumbsUp, Flag, StarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Review {
  id: string;
  reviewer_id: string | null;
  reviewer_name: string;
  reviewer_avatar?: string | null;
  rating: number;
  comment: string;
  created_at: string;
  transaction_id?: string | null;
  helpful_count: number;
  reported: boolean;
}

interface UserReviewSystemProps {
  userId: string;               // reviewed user id
  transactionId?: string;
  canReview?: boolean;
  onReviewSubmitted?: () => void;
}

export const UserReviewSystem: React.FC<UserReviewSystemProps> = ({
  userId,
  transactionId,
  canReview = false,
  onReviewSubmitted,
}) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const loadReviews = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('user_reviews')
        .select('*')
        .eq('reviewed_user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Join reviewer profiles in a separate query (RLS-safe)
      const reviewerIds = Array.from(
        new Set((data || []).map((r: any) => r.reviewer_id).filter(Boolean)),
      ) as string[];
      let profileMap = new Map<string, { name: string; avatar?: string | null }>();
      if (reviewerIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', reviewerIds);
        profileMap = new Map(
          (profiles || []).map((p: any) => [p.id, { name: p.full_name || '匿名用户', avatar: p.avatar_url }]),
        );
      }

      setReviews(
        (data || []).map((r: any) => ({
          id: r.id,
          reviewer_id: r.reviewer_id,
          reviewer_name: profileMap.get(r.reviewer_id)?.name || '匿名用户',
          reviewer_avatar: profileMap.get(r.reviewer_id)?.avatar,
          rating: r.rating || 0,
          comment: r.comment || '',
          created_at: r.created_at || new Date().toISOString(),
          transaction_id: r.transaction_id,
          helpful_count: r.helpful_count || 0,
          reported: r.reported || false,
        })),
      );
    } catch (error: any) {
      console.error('Failed to load reviews:', error);
      toast.error('加载评价失败');
    }
  }, [userId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const submitReview = async () => {
    if (!user) return toast.error('请先登录');
    if (rating === 0) return toast.error('请选择评分');
    if (!comment.trim()) return toast.error('请填写评价内容');

    setIsSubmitting(true);
    try {
      const { error } = await (supabase as any).from('user_reviews').insert({
        reviewer_id: user.id,
        reviewed_user_id: userId,
        transaction_id: transactionId || null,
        rating,
        comment: comment.trim(),
      });
      if (error) throw error;
      setRating(0); setComment(''); setShowReviewForm(false);
      toast.success('评价提交成功');
      await loadReviews();
      onReviewSubmitted?.();
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      toast.error(error.message || '提交评价失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const markHelpful = async (reviewId: string) => {
    if (!user) return toast.error('请先登录');
    const target = reviews.find((r) => r.id === reviewId);
    if (!target) return;
    try {
      const { error } = await (supabase as any)
        .from('user_reviews')
        .update({ helpful_count: (target.helpful_count || 0) + 1 })
        .eq('id', reviewId);
      if (error) throw error;
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r)));
      toast.success('感谢您的反馈');
    } catch (error: any) {
      console.error(error);
      toast.error('操作失败');
    }
  };

  const reportReview = async (reviewId: string) => {
    if (!user) return toast.error('请先登录');
    try {
      const { error } = await (supabase as any)
        .from('user_reviews')
        .update({ reported: true })
        .eq('id', reviewId);
      if (error) throw error;
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, reported: true } : r)));
      toast.success('举报已提交，我们会尽快处理');
    } catch (error: any) {
      console.error(error);
      toast.error('举报失败');
    }
  };

  const averageRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map((rt) => reviews.filter((r) => r.rating === rt).length);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" /> 用户评价 ({reviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{averageRating.toFixed(1)}</div>
              <div className="flex justify-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon key={star} className={`h-5 w-5 ${star <= Math.round(averageRating) ? 'text-yellow-400 fill-current' : 'text-muted-foreground/40'}`} />
                ))}
              </div>
              <p className="text-muted-foreground">基于 {reviews.length} 条评价</p>
            </div>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rt, i) => (
                <div key={rt} className="flex items-center gap-2">
                  <span className="text-sm w-8">{rt}星</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: reviews.length ? `${(ratingCounts[i] / reviews.length) * 100}%` : '0%' }} />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{ratingCounts[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {canReview && user && user.id !== userId && (
            <div className="mt-6 pt-6 border-t">
              <Button onClick={() => setShowReviewForm(true)} className="w-full" disabled={showReviewForm}>
                <MessageCircle className="h-4 w-4 mr-2" /> 写评价
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {showReviewForm && (
        <Card>
          <CardHeader><CardTitle>撰写评价</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">评分 *</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)} onMouseLeave={() => setHoveredRating(0)} className="p-1">
                    <StarIcon className={`h-6 w-6 transition-colors ${star <= (hoveredRating || rating) ? 'text-yellow-400 fill-current' : 'text-muted-foreground/40 hover:text-yellow-200'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">评价内容 *</label>
              <Textarea placeholder="请分享您的交易体验..." value={comment} onChange={(e) => setComment(e.target.value)} rows={4} maxLength={500} />
              <div className="text-xs text-muted-foreground text-right mt-1">{comment.length}/500</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setShowReviewForm(false); setRating(0); setComment(''); }} className="flex-1">取消</Button>
              <Button onClick={submitReview} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? '提交中...' : '提交评价'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {reviews.length === 0 && (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">暂无评价</CardContent></Card>
        )}
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    {review.reviewer_avatar && <AvatarImage src={review.reviewer_avatar} />}
                    <AvatarFallback>{review.reviewer_name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{review.reviewer_name}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon key={star} className={`h-3.5 w-3.5 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-muted-foreground/30'}`} />
                        ))}
                      </div>
                      <span>·</span>
                      <span>{new Date(review.created_at).toLocaleDateString('zh-CN')}</span>
                      {review.reported && <Badge variant="outline" className="text-xs">已举报</Badge>}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap">{review.comment}</p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => markHelpful(review.id)}>
                  <ThumbsUp className="h-3.5 w-3.5 mr-1" /> 有用 ({review.helpful_count})
                </Button>
                {!review.reported && (
                  <Button size="sm" variant="ghost" onClick={() => reportReview(review.id)}>
                    <Flag className="h-3.5 w-3.5 mr-1" /> 举报
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserReviewSystem;
