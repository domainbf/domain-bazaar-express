
import { useState, useCallback, useEffect, useMemo } from 'react';
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

  // 使用 useMemo 优化域名过滤性能
  const filteredDomains = useMemo(() => {
    return domains
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
  }, [domains, searchQuery, activeTab]);

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
