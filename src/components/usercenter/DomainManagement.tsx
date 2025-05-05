
import { useState, useCallback } from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DomainActions } from './DomainActions';
import { DomainFilters } from './domain/DomainFilters';
import { DomainTable } from './domain/DomainTable';
import { EmptyDomainState } from './domain/EmptyDomainState';
import { useDomainsData } from './domain/useDomainsData';
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';

export const DomainManagement = () => {
  const { domains, isLoading, isRefreshing, loadDomains, refreshDomains } = useDomainsData();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // 使用useCallback优化过滤函数以避免不必要的重新渲染
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

  // 预先计算过滤后的域名列表
  const filteredDomains = filterDomains();

  // 处理刷新动作
  const handleRefresh = () => {
    refreshDomains();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">我的域名</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "刷新中..." : "刷新"}
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
        />
      )}
    </div>
  );
};
