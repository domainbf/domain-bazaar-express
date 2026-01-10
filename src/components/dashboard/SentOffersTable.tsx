import { DomainOffer } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Clock, CheckCircle2, XCircle, Package, AlertCircle, ExternalLink, Trash2, Loader2, Eye } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SentOffersTableProps {
  offers: DomainOffer[];
  onRefresh?: () => Promise<void>;
}

export const SentOffersTable = ({ offers, onRefresh }: SentOffersTableProps) => {
  const [processingOffers, setProcessingOffers] = useState<Record<string, boolean>>({});
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    offerId: string;
    domainName: string;
  } | null>(null);

  const handleCancelOffer = async (offerId: string) => {
    setProcessingOffers(prev => ({...prev, [offerId]: true}));
    
    try {
      const { error } = await supabase
        .from('domain_offers')
        .delete()
        .eq('id', offerId);
      
      if (error) throw error;
      
      toast.success('报价已取消');
      setCancelDialog(null);
      if (onRefresh) await onRefresh();
    } catch (error: any) {
      console.error('Error canceling offer:', error);
      toast.error(error.message || '取消报价失败');
    } finally {
      setProcessingOffers(prev => ({...prev, [offerId]: false}));
    }
  };

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
        <Link to="/marketplace">
          <Button className="mt-4" variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            浏览域名市场
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* 移动端卡片视图 */}
        <div className="block lg:hidden space-y-4">
          {offers.map((offer) => {
            const statusConfig = getStatusConfig(offer.status);
            const isProcessing = processingOffers[offer.id];
            
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
                      <p className="text-sm bg-muted/50 p-2 rounded">{offer.message}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    <Link to={`/domain/${offer.domain_name}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-1" />
                        查看域名
                      </Button>
                    </Link>
                    {offer.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setCancelDialog({ open: true, offerId: offer.id, domainName: offer.domain_name || '' })}
                        className="text-red-600 hover:bg-red-50"
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
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
                <th className="text-left p-4 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {offers.map((offer) => {
                const statusConfig = getStatusConfig(offer.status);
                const isProcessing = processingOffers[offer.id];
                
                return (
                  <tr key={offer.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <Link to={`/domain/${offer.domain_name}`} className="font-semibold text-primary hover:underline">
                        {offer.domain_name}
                      </Link>
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
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Link to={`/domain/${offer.domain_name}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            查看
                          </Button>
                        </Link>
                        {offer.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setCancelDialog({ open: true, offerId: offer.id, domainName: offer.domain_name || '' })}
                            className="text-red-600 hover:bg-red-50"
                            disabled={isProcessing}
                          >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                            取消
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 取消确认对话框 */}
      {cancelDialog && (
        <AlertDialog open={cancelDialog.open} onOpenChange={(open) => !open && setCancelDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认取消报价？</AlertDialogTitle>
              <AlertDialogDescription>
                您确定要取消对域名 <span className="font-semibold">{cancelDialog.domainName}</span> 的报价吗？此操作不可撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>返回</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleCancelOffer(cancelDialog.offerId)}
                className="bg-red-600 hover:bg-red-700"
              >
                确认取消
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
