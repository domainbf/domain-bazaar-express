
import { DomainOffer } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Clock, CheckCircle2, XCircle, Package, AlertCircle } from "lucide-react";

interface SentOffersTableProps {
  offers: DomainOffer[];
}

export const SentOffersTable = ({ offers }: SentOffersTableProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'accepted':
        return {
          label: '已接受',
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle2 className="h-3 w-3" />
        };
      case 'rejected':
        return {
          label: '已拒绝',
          className: 'bg-red-100 text-red-800 border-red-200',
          icon: <XCircle className="h-3 w-3" />
        };
      case 'completed':
        return {
          label: '已完成',
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Package className="h-3 w-3" />
        };
      case 'pending':
      default:
        return {
          label: '待处理',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="h-3 w-3" />
        };
    }
  };

  if (offers.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/50 rounded-lg border-2 border-dashed">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground font-medium">您还没有发出任何报价</p>
        <p className="mt-1 text-sm text-muted-foreground">浏览市场寻找心仪的域名并提交报价</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 移动端卡片视图 */}
      <div className="block lg:hidden space-y-4">
        {offers.map((offer) => {
          const statusConfig = getStatusConfig(offer.status);
          return (
            <Card key={offer.id} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{offer.domain_name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {new Date(offer.created_at).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <Badge className={`${statusConfig.className} gap-1`}>
                    {statusConfig.icon}
                    {statusConfig.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">报价金额</span>
                  <span className="text-lg font-bold text-primary">
                    ¥{offer.amount.toLocaleString()}
                  </span>
                </div>
                {offer.message && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">留言</p>
                    <p className="text-sm">{offer.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 桌面端表格视图 */}
      <div className="hidden lg:block overflow-x-auto rounded-lg border">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-semibold">域名</th>
              <th className="text-left p-4 font-semibold">报价金额</th>
              <th className="text-left p-4 font-semibold">状态</th>
              <th className="text-left p-4 font-semibold">提交时间</th>
              <th className="text-left p-4 font-semibold">留言</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {offers.map((offer) => {
              const statusConfig = getStatusConfig(offer.status);
              return (
                <tr key={offer.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <span className="font-semibold">{offer.domain_name}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-lg font-bold text-primary">
                      ¥{offer.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="p-4">
                    <Badge className={`${statusConfig.className} gap-1`}>
                      {statusConfig.icon}
                      {statusConfig.label}
                    </Badge>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(offer.created_at).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="p-4 max-w-xs">
                    {offer.message ? (
                      <p className="text-sm text-muted-foreground truncate" title={offer.message}>
                        {offer.message}
                      </p>
                    ) : (
                      <span className="text-sm text-muted-foreground/50">无留言</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
