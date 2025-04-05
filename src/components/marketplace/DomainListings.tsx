
import { Domain } from '@/types/domain';
import { DomainCard } from '@/components/DomainCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

interface DomainListingsProps {
  domains: Domain[];
  isLoading: boolean;
}

export const DomainListings = ({ domains, isLoading }: DomainListingsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={`skeleton-${i}`} className="border rounded-lg p-6">
            <Skeleton className="h-8 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-6 w-1/4 mx-auto mb-6" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (domains.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">没有找到符合条件的域名</h3>
        <p className="text-gray-500 mb-6">请尝试不同的过滤条件或查询</p>
        <Link 
          to="/marketplace" 
          className="text-blue-600 hover:text-blue-800 underline"
        >
          查看所有域名
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {domains.map((domain) => (
        <DomainCard
          key={domain.id}
          domain={domain.name || ''}
          price={domain.price || 0}
          highlight={domain.highlight || false}
          domainId={domain.id}
          sellerId={domain.owner_id}
          category={domain.category || ''}
          description={domain.description || ''}
        />
      ))}
    </div>
  );
};
