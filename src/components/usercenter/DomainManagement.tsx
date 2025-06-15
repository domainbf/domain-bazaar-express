
import { useState, useCallback, useEffect } from 'react';
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
import { Alert } from "@/components/ui/alert";

export const DomainManagement = () => {
  const { t } = useTranslation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { domains, isLoading, isRefreshing, loadDomains, refreshDomains } = useDomainsData();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState<string | null>(null);

  // 正确用 useEffect 做超时
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if ((isAuthLoading || isLoading) && !error) {
      timer = setTimeout(() => {
        setError('加载超时，请刷新重试。如多次失败请检查网络或账号状态。');
      }, 12000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isAuthLoading, isLoading, error]);

  if (error) {
    return (
      <div className="flex flex-col items-center py-10">
        <Alert variant="destructive" className="mb-4">
          <div className="text-red-700">{error}</div>
        </Alert>
        <Button variant="outline" onClick={() => window.location.reload()}>
          刷新页面
        </Button>
      </div>
    );
  }

  if (isAuthLoading || !user) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  const filterDomains = useCallback(() => {
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

  const filteredDomains = filterDomains();

  const handleRefresh = () => {
    setError(null);
    refreshDomains();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-10">
        <LoadingSpinner />
        <div className="mt-2 text-gray-600 text-sm">正在加载域名数据…请稍候</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">{t('userCenter.myDomains')}</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? t('domains.refreshing') : t('common.refresh')}
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
