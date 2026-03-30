import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { DomainActions } from '../DomainActions';
import { DomainStatusManager } from '../DomainStatusManager';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, ExternalLink, DollarSign, Tag, Shield, Star, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const categoryMap: Record<string, string> = {
  premium: '精品',
  standard: '普通',
  short: '短域名',
  brandable: '品牌',
  dev: '开发',
  numeric: '数字',
  business: '商业',
  keyword: '关键词',
};

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
  highlight?: boolean;
  verification_status?: string;
}

interface DomainTableMobileProps {
  domains: Domain[];
  onDomainUpdate: () => void;
  currentUserId?: string;
}

export const DomainTableMobile = ({ domains, onDomainUpdate }: DomainTableMobileProps) => {
  const navigate = useNavigate();
  
  const renderDomainStatus = (status?: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 text-xs">可售</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 text-xs">暂不出售</Badge>;
      case 'sold':
        return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-xs">已售</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">未知</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      {domains.map((domain) => (
        <Card key={domain.id} className="overflow-hidden border-border">
          <CardContent className="p-4">
            {/* 域名标题和验证状态 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {domain.highlight && (
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                  )}
                  <h3 className="font-semibold text-base truncate">{domain.name}</h3>
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {domain.is_verified ? (
                    <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400 text-xs gap-1">
                      <Shield className="w-3 h-3" />
                      已验证
                    </Badge>
                  ) : domain.verification_status === 'pending' ? (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400 text-xs">
                      验证中
                    </Badge>
                  ) : null}
                  {renderDomainStatus(domain.status)}
                </div>
              </div>
            </div>

            {/* 域名信息 */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
              <div className="flex items-center text-foreground">
                <DollarSign className="w-4 h-4 mr-1.5 text-muted-foreground" />
                <span className="font-semibold">
                  {domain.currency === 'CNY' ? '¥' : '$'}{domain.price.toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center text-muted-foreground">
                <Tag className="w-4 h-4 mr-1.5" />
                <span>{categoryMap[domain.category || 'standard'] || domain.category || '普通'}</span>
              </div>
              
              <div className="flex items-center text-muted-foreground">
                <Eye className="w-4 h-4 mr-1.5" />
                <span>{domain.views || 0} 次浏览</span>
              </div>

              <div className="flex items-center text-muted-foreground">
                <Calendar className="w-4 h-4 mr-1.5" />
                <span className="text-xs">
                  {domain.created_at 
                    ? formatDistanceToNow(new Date(domain.created_at), { addSuffix: true, locale: zhCN })
                    : '-'}
                </span>
              </div>
            </div>

            {/* 描述 */}
            {domain.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {domain.description}
              </p>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
              {!domain.is_verified && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/domain-verification/${domain.id}`)}
                  className="flex-1"
                >
                  <Shield className="w-4 h-4 mr-1" />
                  验证
                </Button>
              )}
              <Link to={`/domain/${domain.name}`} target="_blank" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  查看
                </Button>
              </Link>
              <DomainStatusManager domain={domain} onStatusChange={onDomainUpdate} />
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
