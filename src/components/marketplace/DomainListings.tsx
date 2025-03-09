
import { DomainCard } from '@/components/DomainCard';
import { Domain } from '@/types/domain';

interface DomainListingsProps {
  isLoading: boolean;
  domains: Domain[];
}

export const DomainListings = ({ isLoading, domains }: DomainListingsProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (domains.length === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-2xl font-medium text-gray-600 mb-4">No domains found</h3>
        <p className="text-gray-500">Try adjusting your filters or search query</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {domains.map((domain) => (
        <DomainCard
          key={domain.id}
          domain={domain.name}
          price={domain.price}
          highlight={domain.highlight}
          domainId={domain.id}
          sellerId={domain.owner_id}
        />
      ))}
    </div>
  );
};
