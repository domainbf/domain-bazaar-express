
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { DomainActions } from '../DomainActions';
import { DomainStatusManager } from '../DomainStatusManager';
import { CreateAuctionDialog } from '@/components/auction/CreateAuctionDialog';
import { Link } from 'react-router-dom';
import { Eye, ExternalLink, Shield, Calendar, Star } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";
import { DomainTableMobile } from './DomainTableMobile';
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

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

interface DomainTableProps {
  domains: Domain[];
  onDomainUpdate: () => void;
  currentUserId?: string;
}

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

export const DomainTable = ({ domains, onDomainUpdate, currentUserId }: DomainTableProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  const renderDomainStatus = (status?: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30 dark:border-green-800">可售</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 dark:border-yellow-800">暂不出售</Badge>;
      case 'sold':
        return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 dark:border-blue-800">已售</Badge>;
      case 'reserved':
        return <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30 dark:border-purple-800">保留</Badge>;
      default:
        return <Badge variant="secondary">未知</Badge>;
    }
  };

  const renderVerificationStatus = (domain: Domain) => {
    if (domain.is_verified) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400 gap-1">
                <Shield className="w-3 h-3" />
                已验证
              </Badge>
            </TooltipTrigger>
            <TooltipContent>域名所有权已验证</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    if (domain.verification_status === 'pending') {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400 gap-1 text-xs">
          验证中
        </Badge>
      );
    }
    return null;
  };

  if (isMobile) {
    return <DomainTableMobile domains={domains} onDomainUpdate={onDomainUpdate} currentUserId={currentUserId} />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">域名</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">价格</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">分类</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">状态</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">统计</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">添加时间</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">操作</th>
          </tr>
        </thead>
        <tbody>
          {domains.map((domain) => (
            <tr key={domain.id} className="border-b border-border hover:bg-muted/30 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  {domain.highlight && (
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                  )}
                  <div>
                    <span className="font-medium text-foreground">{domain.name}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {renderVerificationStatus(domain)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="font-semibold text-foreground">
                  {domain.currency === 'CNY' ? '¥' : '$'}{domain.price.toLocaleString()}
                </span>
              </td>
              <td className="py-3 px-4">
                <Badge variant="secondary" className="text-xs">
                  {categoryMap[domain.category || 'standard'] || domain.category || '普通'}
                </Badge>
              </td>
              <td className="py-3 px-4">{renderDomainStatus(domain.status)}</td>
              <td className="py-3 px-4">
                <div className="flex items-center text-muted-foreground text-sm">
                  <Eye className="w-4 h-4 mr-1" />
                  <span>{domain.views || 0}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-muted-foreground">
                  {domain.created_at 
                    ? formatDistanceToNow(new Date(domain.created_at), { addSuffix: true, locale: zhCN })
                    : '-'}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  {!domain.is_verified && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/domain-verification/${domain.id}`)}
                            className="text-primary hover:text-primary/80"
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>验证域名所有权</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link to={`/domain/${domain.name}`} target="_blank">
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>查看域名详情页</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <CreateAuctionDialog
                            domainId={domain.id}
                            domainName={domain.name}
                            currentPrice={domain.price}
                            onCreated={onDomainUpdate}
                          />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>发起拍卖</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
