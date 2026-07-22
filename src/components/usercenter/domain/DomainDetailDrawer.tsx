import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import { ExternalLink, Eye, Shield, Star, Calendar, Tag, DollarSign, Copy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { getDomainDetailPath } from '@/lib/domainRouting';
import { DomainActions } from '../DomainActions';
import { DomainStatusManager } from '../DomainStatusManager';
import { CreateAuctionDialog } from '@/components/auction/CreateAuctionDialog';
import { toast } from 'sonner';

interface DomainDetailDrawerProps {
  domain: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const statusMap: Record<string, { label: string; className: string }> = {
  available: { label: '可售', className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30' },
  pending: { label: '暂不出售', className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30' },
  sold: { label: '已售', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30' },
  reserved: { label: '保留', className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30' },
};

export const DomainDetailDrawer = ({ domain, open, onOpenChange, onUpdate }: DomainDetailDrawerProps) => {
  if (!domain) return null;

  const status = statusMap[domain.status || 'available'] || statusMap.available;
  const symbol = domain.currency === 'CNY' ? '¥' : '$';

  const copyName = () => {
    navigator.clipboard.writeText(domain.name);
    toast.success('域名已复制');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            {domain.highlight && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
            <SheetTitle className="text-xl break-all">{domain.name}</SheetTitle>
          </div>
          <SheetDescription className="flex items-center gap-2 flex-wrap">
            <Badge className={status.className}>{status.label}</Badge>
            {domain.is_verified && (
              <Badge variant="outline" className="border-green-500 text-green-600 gap-1">
                <Shield className="w-3 h-3" /> 已验证
              </Badge>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="rounded-lg border border-border p-4 bg-muted/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <DollarSign className="w-3 h-3" /> 报价
            </div>
            <div className="text-3xl font-bold">
              {symbol}{Number(domain.price || 0).toLocaleString()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Eye className="w-3 h-3" /> 浏览
              </div>
              <div className="font-semibold">{domain.views || 0}</div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Tag className="w-3 h-3" /> 分类
              </div>
              <div className="font-semibold truncate">{domain.category || '普通'}</div>
            </div>
            <div className="col-span-2 rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3" /> 添加时间
              </div>
              <div className="font-semibold">
                {domain.created_at
                  ? formatDistanceToNow(new Date(domain.created_at), { addSuffix: true, locale: zhCN })
                  : '-'}
              </div>
            </div>
          </div>

          {domain.description && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">描述</div>
              <p className="text-sm text-foreground/90 leading-relaxed">{domain.description}</p>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground mb-2">快捷操作</div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={copyName}>
                <Copy className="w-3.5 h-3.5 mr-1" /> 复制域名
              </Button>
              <Link to={getDomainDetailPath(domain)} target="_blank">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> 打开详情
                </Button>
              </Link>
              <CreateAuctionDialog
                domainId={domain.id}
                domainName={domain.name}
                currentPrice={domain.price}
                onCreated={onUpdate}
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <DomainStatusManager domain={domain} onStatusChange={onUpdate} />
              <DomainActions domain={domain} mode="edit" onSuccess={onUpdate} />
              <DomainActions domain={domain} mode="delete" onSuccess={onUpdate} />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
