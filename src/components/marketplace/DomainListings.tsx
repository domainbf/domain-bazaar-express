
import { DomainCard } from '@/components/DomainCard';
import { Domain } from '@/types/domain';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Link } from 'react-router-dom';

interface DomainListingsProps {
  isLoading: boolean;
  domains: Domain[];
}

export const DomainListings = ({ isLoading, domains }: DomainListingsProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (domains.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-2xl font-medium text-gray-600 mb-4">未找到域名 (No domains found)</h3>
        <p className="text-gray-500 mb-4">尝试调整您的筛选条件或搜索查询 (Try adjusting your filters or search query)</p>
        <div className="max-w-md mx-auto px-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600">
              您也可以在<Link to="/user-center" className="text-blue-600 hover:underline">用户中心</Link>添加您自己的域名出售
              <br />(You can also add your own domains for sale in the <Link to="/user-center" className="text-blue-600 hover:underline">User Center</Link>)
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {domains.map((domain) => (
        <DomainCard
          key={domain.id || domain.name}
          domain={domain.name || ''}
          price={domain.price || 0}
          highlight={domain.highlight || false}
          domainId={domain.id || ''}
          sellerId={domain.owner_id || ''}
          category={domain.category || ''}
          description={domain.description || ''}
        />
      ))}
    </div>
  );
};
