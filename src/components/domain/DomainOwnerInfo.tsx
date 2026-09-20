import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle2, MessageSquare, ShieldCheck } from "lucide-react";
import { UserProfile } from "@/types/userProfile";
import { supabase } from "@/integrations/supabase/client";

interface DomainOwnerInfoProps {
  owner: Partial<UserProfile> & {
    seller_review_count?: number;
    buyer_verified?: boolean;
    total_sales?: number;
  };
}

export const DomainOwnerInfo: React.FC<DomainOwnerInfoProps> = ({ owner }) => {
  const displayName = owner.full_name || owner.username || '匿名用户';
  const initials = displayName.substring(0, 2).toUpperCase();

  /** 订单成交后信誉分实时更新 */
  const [live, setLive] = useState<{
    seller_rating?: number; seller_review_count?: number;
    seller_verified?: boolean; total_sales?: number;
  }>({});

  useEffect(() => {
    if (!owner.id) return;
    const channel = supabase
      .channel(`owner-reputation-${owner.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${owner.id}` },
        (payload) => {
          const row = payload.new as any;
          setLive({
            seller_rating: Number(row.seller_rating ?? 0),
            seller_review_count: Number(row.seller_review_count ?? 0),
            seller_verified: Boolean(row.seller_verified),
            total_sales: Number(row.total_sales ?? 0),
          });
        }
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [owner.id]);

  const rating = live.seller_rating ?? owner.seller_rating ?? 0;
  const reviewCount = live.seller_review_count ?? owner.seller_review_count ?? 0;
  const verified = live.seller_verified ?? owner.seller_verified;
  const totalSales = live.total_sales ?? owner.total_sales ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
          域名所有者
          {verified && (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              卖家已实名
            </Badge>
          )}
          {owner.buyer_verified && (
            <Badge variant="outline" className="gap-1">
              <ShieldCheck className="h-3 w-3" />
              买家已实名
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-16 w-16">
            <AvatarImage src={owner.avatar_url} alt={displayName} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{displayName}</h3>
            {owner.username && owner.username !== owner.full_name && (
              <p className="text-sm text-muted-foreground">@{owner.username}</p>
            )}
          </div>
        </div>

        {owner.bio && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {owner.bio}
          </p>
        )}

        {rating > 0 && (
          <div className="flex items-center gap-2 text-sm" data-testid="text-seller-rating">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="font-medium">{rating.toFixed(1)}</span>
            <span className="text-muted-foreground">卖家评分 · {reviewCount} 条评价</span>
          </div>
        )}

        {totalSales > 0 && (
          <p className="text-sm text-muted-foreground">累计成交 {totalSales} 笔</p>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4 shrink-0" />
          <span>通过平台报价与卖家联系</span>
        </div>
      </CardContent>
    </Card>
  );
};
