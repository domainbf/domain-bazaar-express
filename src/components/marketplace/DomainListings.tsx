import { Link } from 'react-router-dom';
import { Domain } from '@/types/domain';
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Shield, ArrowUpRight } from 'lucide-react';

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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          共 <span className="font-semibold text-foreground">{domains.length}</span> 个域名
        </p>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'} gap-3`}>
        {domains.map((domain) => (
          <Link 
            key={domain.id} 
            to={`/domain/${encodeURIComponent(domain.name)}`}
            className="group block"
          >
            <div className="border border-border bg-card rounded-lg px-5 py-6 hover:border-foreground/30 hover:shadow-sm transition-all duration-200 relative">
              {/* Top badges */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  {domain.highlight && (
                    <Badge className="bg-foreground text-background text-[10px] px-2 py-0 h-5">精选</Badge>
                  )}
                  {domain.is_verified && (
                    <Badge className="bg-green-600 text-white text-[10px] px-2 py-0 h-5 gap-0.5">
                      <Shield className="h-2.5 w-2.5" />已验证
                    </Badge>
                  )}
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Domain name - hero element */}
              <h3 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors leading-none break-all">
                {domain.name}
              </h3>

              {/* Meta row */}
              <div className="flex items-center gap-2 mt-3">
                {domain.category && (
                  <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {domain.category}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  ${domain.price?.toLocaleString()}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
