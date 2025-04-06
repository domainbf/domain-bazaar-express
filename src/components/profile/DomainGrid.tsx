
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface Domain {
  id: string;
  name: string;
  price: number;
  status: string;
  category?: string;
  highlight?: boolean;
}

interface DomainGridProps {
  domains: Domain[];
  onSelect?: (domain: Domain) => void;
}

export const DomainGrid = ({ domains, onSelect }: DomainGridProps) => {
  if (!domains || domains.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">暂无域名</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {domains.map((domain) => (
        <div 
          key={domain.id}
          className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onSelect && onSelect(domain)}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-gray-800">{domain.name}</h3>
            {domain.highlight && <Badge className="bg-yellow-500 text-white">{React.createElement('span', {}, '精选')}</Badge>}
          </div>
          
          <div className="flex justify-between items-end">
            <span className="text-lg font-bold text-gray-900">${domain.price?.toLocaleString()}</span>
            <Badge className={domain.status === 'available' ? 'bg-green-500' : domain.status === 'sold' ? 'bg-red-500' : 'bg-yellow-400'}>
              {React.createElement('span', {}, domain.status === 'available' ? '可售' : domain.status === 'sold' ? '已售' : '预留')}
            </Badge>
          </div>
          
          {domain.category && (
            <div className="mt-2">
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">{domain.category}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
