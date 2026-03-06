import { Link } from 'react-router-dom';
import { Domain } from '@/types/domain';
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ArrowRight, Shield } from 'lucide-react';

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
        <h3 className="text-2xl font-bold text-foreground mb-2">没有找到域名</h3>
        <p className="text-muted-foreground">尝试调整筛选条件或搜索不同的关键词</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          可用域名 ({domains.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {domains.map((domain) => (
          <Link 
            key={domain.id} 
            to={`/domain/${encodeURIComponent(domain.name)}`}
            className="group block"
          >
            <div className="border border-border bg-card rounded-xl p-6 hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center relative">
              {domain.is_verified && (
                <Badge className="absolute top-3 right-3 bg-green-600 text-white text-[10px] px-2 py-0.5 gap-0.5">
                  <Shield className="h-2.5 w-2.5" />已验证
                </Badge>
              )}
              {domain.highlight && (
                <Badge className="absolute top-3 left-3 bg-foreground text-background text-[10px] px-2 py-0.5">精选</Badge>
              )}
              <h3 className="text-3xl sm:text-4xl font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors leading-none mt-2">
                {domain.name}
              </h3>
              {domain.category && (
                <Badge variant="secondary" className="text-[11px] mt-3 px-3">
                  {domain.category}
                </Badge>
              )}
              <span className="text-sm text-muted-foreground mt-2 font-medium">
                ${domain.price?.toLocaleString()}
              </span>
              <div className="mt-4 flex items-center gap-1 text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                查看详情 <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
