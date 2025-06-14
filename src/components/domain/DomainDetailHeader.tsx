
import React, { Suspense } from "react";
import { Shield, Eye, Heart, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
const DomainShareButtons = React.lazy(() =>
  import("@/components/domain/DomainShareButtons").then(mod => ({ default: mod.DomainShareButtons }))
);

interface DomainDetailHeaderProps {
  domain: {
    name: string;
    is_verified: boolean;
    category: string;
    views: number;
    status: string;
    price: number;
  };
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

export const DomainDetailHeader: React.FC<DomainDetailHeaderProps> = ({
  domain,
  isFavorited,
  onToggleFavorite,
}) => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{domain.name}</h1>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center">
          <Shield className="h-3 w-3 mr-1" />
          {domain.is_verified ? (
            <span className="text-green-600">已验证</span>
          ) : (
            <span className="text-gray-500">待验证</span>
          )}
        </span>
        <span className="px-2 py-1 rounded border border-primary text-primary text-xs">
          {domain.category}
        </span>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {domain.views || 0} 次浏览
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            0 次收藏
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            0 次报价
          </span>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleFavorite}
        className={isFavorited ? "text-red-500" : ""}
      >
        <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
      </Button>
      <Suspense fallback={<div />}>
        <DomainShareButtons domainName={domain.name} />
      </Suspense>
      <div className="text-right">
        <div className="text-3xl font-bold text-primary">¥{domain.price.toLocaleString()}</div>
        <div className="text-sm text-muted-foreground">一口价</div>
      </div>
    </div>
  </div>
);
