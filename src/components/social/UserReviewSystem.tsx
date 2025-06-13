
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  User, 
  MessageCircle, 
  ThumbsUp, 
  Flag,
  StarIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  transactionId?: string;
  helpful: number;
  reported: boolean;
}

interface UserReviewSystemProps {
  userId: string;
  transactionId?: string;
  canReview?: boolean;
  onReviewSubmitted?: () => void;
}

export const UserReviewSystem: React.FC<UserReviewSystemProps> = ({
  userId,
  transactionId,
  canReview = false,
  onReviewSubmitted
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    loadReviews();
  }, [userId]);

  const loadReviews = async () => {
    try {
      // 模拟加载用户评价数据
      const mockReviews: Review[] = [
        {
          id: '1',
          reviewerId: 'user1',
          reviewerName: '张先生',
          rating: 5,
          comment: '交易非常顺利，卖家很专业，域名过户很快。强烈推荐！',
          createdAt: '2024-01-15T10:30:00Z',
          transactionId: 'trans1',
          helpful: 12,
          reported: false
        },
        {
          id: '2',
          reviewerId: 'user2',
          reviewerName: '李女士',
          rating: 4,
          comment: '整体不错，价格合理，就是沟通稍微慢了一点。',
          createdAt: '2024-01-10T14:20:00Z',
          helpful: 8,
          reported: false
        },
        {
          id: '3',
          reviewerId: 'user3',
          reviewerName: '王总',
          rating: 5,
          comment: '非常满意的一次交易，域名质量很高，手续办理专业。',
          createdAt: '2024-01-05T09:15:00Z',
          helpful: 15,
          reported: false
        }
      ];
      
      setReviews(mockReviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      toast.error('加载评价失败');
    }
  };

  const submitReview = async () => {
    if (rating === 0) {
      toast.error('请选择评分');
      return;
    }

    if (!comment.trim()) {
      toast.error('请填写评价内容');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 模拟提交评价
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newReview: Review = {
        id: Date.now().toString(),
        reviewerId: 'current-user',
        reviewerName: '您',
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
        transactionId,
        helpful: 0,
        reported: false
      };
      
      setReviews(prev => [newReview, ...prev]);
      setRating(0);
      setComment('');
      setShowReviewForm(false);
      toast.success('评价提交成功');
      onReviewSubmitted?.();
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error('提交评价失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const markHelpful = async (reviewId: string) => {
    try {
      // 模拟标记有用
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, helpful: review.helpful + 1 }
          : review
      ));
      toast.success('感谢您的反馈');
    } catch (error) {
      console.error('Failed to mark helpful:', error);
      toast.error('操作失败');
    }
  };

  const reportReview = async (reviewId: string) => {
    try {
      // 模拟举报评价
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, reported: true }
          : review
      ));
      toast.success('举报已提交，我们会尽快处理');
    } catch (error) {
      console.error('Failed to report review:', error);
      toast.error('举报失败');
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map(rating => 
    reviews.filter(review => review.rating === rating).length
  );

  return (
    <div className="space-y-6">
      {/* 评价概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            用户评价 ({reviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 平均评分 */}
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(averageRating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-muted-foreground">基于 {reviews.length} 条评价</p>
            </div>

            {/* 评分分布 */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating, index) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-8">{rating}星</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: reviews.length > 0 
                          ? `${(ratingCounts[index] / reviews.length) * 100}%` 
                          : '0%'
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">
                    {ratingCounts[index]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 写评价按钮 */}
          {canReview && (
            <div className="mt-6 pt-6 border-t">
              <Button
                onClick={() => setShowReviewForm(true)}
                className="w-full"
                disabled={showReviewForm}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                写评价
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 评价表单 */}
      {showReviewForm && (
        <Card>
          <CardHeader>
            <CardTitle>撰写评价</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 评分选择 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                评分 *
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1"
                  >
                    <StarIcon
                      className={`h-6 w-6 transition-colors ${
                        star <= (hoveredRating || rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300 hover:text-yellow-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* 评价内容 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                评价内容 *
              </label>
              <Textarea
                placeholder="请分享您的交易体验..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>

            {/* 提交按钮 */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReviewForm(false);
                  setRating(0);
                  setComment('');
                }}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={submitReview}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? '提交中...' : '提交评价'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 评价列表 */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.reviewerAvatar} />
                    <AvatarFallback>
                      {review.reviewerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{review.reviewerName}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {review.transactionId && (
                  <Badge variant="outline" className="text-xs">
                    已验证交易
                  </Badge>
                )}
              </div>

              <p className="text-muted-foreground mb-4 leading-relaxed">
                {review.comment}
              </p>

              <div className="flex items-center gap-4 text-sm">
                <button
                  onClick={() => markHelpful(review.id)}
                  className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <ThumbsUp className="h-4 w-4" />
                  有用 ({review.helpful})
                </button>
                
                {!review.reported && (
                  <button
                    onClick={() => reportReview(review.id)}
                    className="flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Flag className="h-4 w-4" />
                    举报
                  </button>
                )}
                
                {review.reported && (
                  <span className="text-red-500 text-xs">已举报</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {reviews.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">暂无评价</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
