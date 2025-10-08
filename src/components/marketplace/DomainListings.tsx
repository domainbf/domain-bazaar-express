
import { Link } from 'react-router-dom';
import { Domain } from '@/types/domain';
import { Card, CardContent } from "@/components/ui/card";


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
            to={`/domain/${encodeURIComponent(domain.name)}`}
            className="group block"
          >
            <Card className="border border-border bg-card hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center gap-2">
                  <h3 className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {domain.name}
                  </h3>
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-1">售价</p>
                    <p className="text-3xl font-extrabold text-foreground">
                      ${domain.price?.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="pt-4 text-center text-primary group-hover:translate-x-0 transition-transform font-medium">
                  查看详情 →
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
