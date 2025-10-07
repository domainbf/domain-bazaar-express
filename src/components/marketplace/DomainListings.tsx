
import { Link } from 'react-router-dom';
import { Domain } from '@/types/domain';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, TrendingUp } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export interface DomainListingsProps {
  domains: Domain[];
  isLoading: boolean;
  isMobile?: boolean;
}

export const DomainListings = ({ domains, isLoading, isMobile }: DomainListingsProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (domains.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-2xl font-bold text-gray-700 mb-2">没有找到域名</h3>
        <p className="text-gray-500">尝试调整筛选条件或搜索不同的关键词</p>
      </div>
    );
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'premium':
        return 'Premium域名';
      case 'short':
        return 'Short域名';
      case 'standard':
        return 'Standard域名';
      default:
        return 'Standard域名';
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          可用域名 ({domains.length})
        </h2>
      </div>

      <div className="space-y-4">
        {domains.map((domain) => (
          <Link 
            key={domain.id} 
            to={`/domain/${domain.id}`}
            className="group block"
          >
            <Card className="border border-border bg-card hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                {/* 域名名称 */}
                <div className="mb-3">
                  <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                    {domain.name}
                  </h3>
                  
                  {/* 类别标签 */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{getCategoryLabel(domain.category || 'standard')}</span>
                    {domain.is_verified && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          已验证
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* 描述 */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
                  {domain.description || `${domain.name}是一个优质域名。`}
                </p>

                {/* 底部：价格和查看详情 */}
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">售价</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${domain.price?.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-primary group-hover:translate-x-1 transition-transform font-medium flex items-center gap-1">
                    查看详情 →
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
