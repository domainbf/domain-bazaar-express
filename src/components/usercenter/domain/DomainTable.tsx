
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { DomainActions } from '../DomainActions';
import { Link } from 'react-router-dom';
import { Eye, ExternalLink } from 'lucide-react';

interface Domain {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  status?: string;
  is_verified?: boolean;
  created_at?: string;
  views?: number;
}

interface DomainTableProps {
  domains: Domain[];
  onDomainUpdate: () => void;
  currentUserId?: string;
}

export const DomainTable = ({ domains, onDomainUpdate, currentUserId }: DomainTableProps) => {
  const renderDomainStatus = (status?: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500">可售</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">审核中</Badge>;
      case 'sold':
        return <Badge className="bg-blue-500">已售</Badge>;
      default:
        return <Badge className="bg-gray-500">未知</Badge>;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4">域名</th>
            <th className="text-left py-3 px-4">价格</th>
            <th className="text-left py-3 px-4">分类</th>
            <th className="text-left py-3 px-4">状态</th>
            <th className="text-left py-3 px-4">统计</th>
            <th className="text-left py-3 px-4">操作</th>
          </tr>
        </thead>
        <tbody>
          {domains.map((domain) => (
            <tr key={domain.id} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="flex items-center">
                  <span className="font-medium">{domain.name}</span>
                  {domain.is_verified && (
                    <Badge variant="outline" className="ml-2 border-green-500 text-green-500">
                      已验证
                    </Badge>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">${domain.price.toLocaleString()}</td>
              <td className="py-3 px-4 capitalize">{domain.category || 'standard'}</td>
              <td className="py-3 px-4">{renderDomainStatus(domain.status)}</td>
              <td className="py-3 px-4">
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-1 text-gray-500" />
                  <span>{domain.views || 0}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Link to={`/domain/${domain.id}`} target="_blank">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                  <DomainActions 
                    domain={domain} 
                    mode="edit" 
                    onSuccess={onDomainUpdate} 
                  />
                  <DomainActions 
                    domain={domain} 
                    mode="delete" 
                    onSuccess={onDomainUpdate} 
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
