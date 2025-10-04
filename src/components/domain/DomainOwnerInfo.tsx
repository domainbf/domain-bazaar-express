import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Star, CheckCircle2 } from "lucide-react";
import { UserProfile } from "@/types/userProfile";

interface DomainOwnerInfoProps {
  owner: Partial<UserProfile>;
}

export const DomainOwnerInfo: React.FC<DomainOwnerInfoProps> = ({ owner }) => {
  const displayName = owner.full_name || owner.username || '匿名用户';
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          域名所有者
          {owner.seller_verified && (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              已认证
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

        {owner.seller_rating !== undefined && owner.seller_rating > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{owner.seller_rating.toFixed(1)}</span>
            <span className="text-muted-foreground">卖家评分</span>
          </div>
        )}

        {owner.contact_email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{owner.contact_email}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
