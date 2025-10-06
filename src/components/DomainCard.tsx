
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from './ui/badge';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface DomainCardProps {
  domain: string;
  price?: number | string;
  highlight?: boolean;
  isSold?: boolean;
  domainId: string;
  sellerId?: string;
  category?: string;
  description?: string;
  isVerified?: boolean;
}

export const DomainCard = ({ 
  domain, 
  price, 
  highlight, 
  isSold = false, 
  domainId, 
  category,
  description,
  isVerified = false
}: DomainCardProps) => {
  const getCategoryLabel = (cat?: string) => {
    switch (cat) {
      case 'premium': return 'Premium域名';
      case 'short': return 'Short域名';
      case 'standard': return 'Standard域名';
      default: return 'Standard域名';
    }
  };

  return (
    <Link to={`/domain/${domainId}`} className="block group">
      <Card className={`border ${highlight ? 'border-primary border-2' : 'border-border'} bg-card hover:shadow-lg transition-all duration-200 relative overflow-hidden`}>
        {highlight && (
          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-primary text-primary-foreground">
              精选
            </Badge>
          </div>
        )}
        
        <CardContent className="p-6">
          {/* 域名名称 - 最突出 */}
          <h3 className="text-3xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
            {domain}
          </h3>
          
          {/* 类别标签和验证状态 */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <span>{getCategoryLabel(category)}</span>
            {isVerified && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  已验证
                </span>
              </>
            )}
          </div>
          
          {/* 描述 */}
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
              {description}
            </p>
          )}
          
          {/* 底部：价格和查看详情 */}
          <div className="flex justify-between items-center pt-4 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground mb-1">售价</p>
              <p className="text-2xl font-bold text-foreground">
                {typeof price === 'number' ? `$${price.toLocaleString()}` : price}
              </p>
            </div>
            <div className="flex items-center gap-1 text-primary group-hover:translate-x-1 transition-transform font-medium">
              查看详情 <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
