
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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          可用域名 ({domains.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {domains.map((domain) => (
          <Link 
            key={domain.id} 
            to={`/domains/${domain.name}`}
            className="group block h-full"
          >
            <Card className="h-full border border-border bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300 flex flex-col">
              <CardHeader className="pb-3 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-xl font-bold text-primary group-hover:text-primary/80 transition-colors line-clamp-1">
                    {domain.name}
                  </CardTitle>
                  {domain.is_verified && (
                    <Badge variant="outline" className="border-green-500 text-green-600 shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      已验证
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm text-muted-foreground">
                  {domain.category === 'premium' && (
                    <span className="inline-flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Premium域名
                    </span>
                  )}
                  {domain.category && domain.category !== 'premium' && (
                    <span>{domain.category.charAt(0).toUpperCase() + domain.category.slice(1)}域名</span>
                  )}
                  {!domain.category && <span>标准域名</span>}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 pb-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {domain.description || `${domain.name}是一个很好的域名选择。`}
                </p>
              </CardContent>
              
              <CardFooter className="pt-4 border-t border-border flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">售价</span>
                  <span className="text-2xl font-bold text-foreground">
                    ${domain.price?.toLocaleString()}
                  </span>
                </div>
                <div className="text-primary group-hover:translate-x-1 transition-transform text-sm font-medium">
                  查看详情 →
                </div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
