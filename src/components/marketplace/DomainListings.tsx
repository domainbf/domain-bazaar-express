
import { Link } from 'react-router-dom';
import { Domain } from '@/types/domain';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      <div className={isMobile ? '' : 'mb-6 flex justify-between items-center'}>
        <h2 className={`${isMobile ? 'text-xl mb-4' : 'text-2xl'} font-bold`}>
          可用域名 ({domains.length})
        </h2>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}`}>
        {domains.map((domain) => (
          <Link key={domain.id} to={`/domains/${domain.name}`}>
            <Card className="h-full border hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-blue-600`}>
                    {domain.name}
                  </CardTitle>
                  {domain.is_verified && (
                    <Badge variant="outline" className="border-green-500 text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      已验证
                    </Badge>
                  )}
                </div>
                <CardDescription className={isMobile ? 'text-xs' : 'text-sm'}>
                  {domain.category ? domain.category.charAt(0).toUpperCase() + domain.category.slice(1) : '标准'}域名
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className={`${isMobile ? 'text-sm' : ''} text-gray-600 h-12 overflow-hidden`}>
                  {domain.description || `${domain.name}是一个很好的域名选择。`}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between items-center pt-2">
                <span className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold`}>
                  ${domain.price?.toLocaleString()}
                </span>
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  详情 
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
