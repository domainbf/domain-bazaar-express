
import { useState, useMemo } from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DomainActions } from './DomainActions';
import { DomainFilters } from './domain/DomainFilters';
import { DomainTable } from './domain/DomainTable';
import { EmptyDomainState } from './domain/EmptyDomainState';
import { useDomainsData } from './domain/useDomainsData';
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from "@/components/ui/alert";

export const DomainManagement = () => {
  const { t } = useTranslation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { domains, isLoading, isRefreshing, loadDomains, refreshDomains } = useDomainsData();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState('all');
  const [category, setCategory] = useState('all');

  // 使用 useMemo 优化域名过滤性能
  const filteredDomains = useMemo(() => {
    let result = domains
      .filter(domain => 
        domain.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (domain.description && domain.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .filter(domain => {
        if (activeTab === 'all') return true;
        if (activeTab === 'available') return domain.status === 'available';
        if (activeTab === 'pending') return domain.status === 'pending';
        if (activeTab === 'sold') return domain.status === 'sold';
        return true;
      });

    // 价格筛选
    if (priceRange !== 'all') {
      result = result.filter(domain => {
        const price = domain.price || 0;
        switch (priceRange) {
          case '0-1000': return price >= 0 && price <= 1000;
          case '1000-5000': return price > 1000 && price <= 5000;
          case '5000-10000': return price > 5000 && price <= 10000;
          case '10000+': return price > 10000;
          default: return true;
        }
      });
    }

    // 分类筛选
    if (category !== 'all') {
      result = result.filter(domain => domain.category === category);
    }

    // 排序
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'oldest':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        default:
          return 0;
      }
    });

    return result;
  }, [domains, searchQuery, activeTab, sortBy, priceRange, category]);

  // 认证检查
  if (isAuthLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">正在验证用户权限...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center py-10">
        <Alert className="mb-4">
          <AlertDescription>
            请登录后查看域名管理
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => window.location.href = '/auth'}>
          前往登录
        </Button>
      </div>
    );
  }

  // 初始加载状态
  if (isLoading && domains.length === 0) {
    return (
      <div className="flex flex-col items-center py-10">
        <LoadingSpinner />
        <div className="mt-4 text-gray-600 text-center">
          <div>正在加载域名数据...</div>
          <div className="text-sm text-gray-500 mt-2">数据已缓存，后续加载会更快</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">{t('userCenter.myDomains', '我的域名')}</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshDomains}
            disabled={isRefreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? '刷新中...' : '刷新'}
          </Button>
          <DomainActions mode="add" onSuccess={loadDomains} />
        </div>
      </div>
      
      <DomainFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sortBy={sortBy}
        setSortBy={setSortBy}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        category={category}
        setCategory={setCategory}
        totalCount={filteredDomains.length}
      />

      {domains.length === 0 ? (
        <EmptyDomainState 
          onDomainAdded={loadDomains} 
          isEmpty={true}
          isFiltered={false}
        />
      ) : filteredDomains.length === 0 ? (
        <EmptyDomainState 
          onDomainAdded={loadDomains} 
          isEmpty={false}
          isFiltered={true}
        />
      ) : (
        <DomainTable 
          domains={filteredDomains} 
          onDomainUpdate={loadDomains}
          currentUserId={user.id}
        />
      )}
    </div>
  );
};
