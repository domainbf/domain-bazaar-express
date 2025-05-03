
import { useState } from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DomainActions } from './DomainActions';
import { DomainFilters } from './domain/DomainFilters';
import { DomainTable } from './domain/DomainTable';
import { EmptyDomainState } from './domain/EmptyDomainState';
import { useDomainsData } from './domain/useDomainsData';

export const DomainManagement = () => {
  const { domains, isLoading, loadDomains } = useDomainsData();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Filter domains
  const filteredDomains = domains
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
        <DomainActions mode="add" onSuccess={loadDomains} />
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
