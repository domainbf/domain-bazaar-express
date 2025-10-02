import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { DomainActions } from '../DomainActions';
import { Link } from 'react-router-dom';
import { Eye, ExternalLink, DollarSign, Tag, Shield } from 'lucide-react';

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
  currency?: string;
}

interface DomainTableMobileProps {
  domains: Domain[];
  onDomainUpdate: () => void;
  currentUserId?: string;
}

export const DomainTableMobile = ({ domains, onDomainUpdate }: DomainTableMobileProps) => {
  const renderDomainStatus = (status?: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500 text-xs">可售</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-xs">审核中</Badge>;
      case 'sold':
        return <Badge className="bg-blue-500 text-xs">已售</Badge>;
      default:
        return <Badge className="bg-gray-500 text-xs">未知</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {domains.map((domain) => (
        <Card key={domain.id} className="overflow-hidden">
          <CardContent className="p-4">
            {/* 域名标题和验证状态 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{domain.name}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {domain.is_verified && (
                    <Badge variant="outline" className="border-green-500 text-green-500 text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      已验证
                    </Badge>
                  )}
                  {renderDomainStatus(domain.status)}
                </div>
              </div>
            </div>

            {/* 域名信息 */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center text-sm">
                <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-medium">
                  {domain.currency === 'CNY' ? '¥' : '$'}{domain.price.toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Tag className="w-4 h-4 mr-2 text-gray-500" />
                <span className="capitalize">{domain.category || 'standard'}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Eye className="w-4 h-4 mr-2 text-gray-500" />
                <span>{domain.views || 0} 次浏览</span>
              </div>
            </div>

            {/* 描述 */}
            {domain.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {domain.description}
              </p>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center gap-2 pt-3 border-t">
              <Link to={`/domains/${domain.name}`} target="_blank" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  查看
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
