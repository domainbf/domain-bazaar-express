import { DomainOffer } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Clock, CheckCircle2, XCircle, Package, AlertCircle, ExternalLink, Trash2, Loader2, Eye, ArrowRight, ArrowLeftRight, Check, X } from "lucide-react";
import { useState } from "react";
import { apiPatch, apiPost } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SentOffersTableProps {
  offers: DomainOffer[];
  onRefresh?: () => Promise<void>;
}

function parseOfferMessage(offer: DomainOffer): { buyerMessage: string; counterAmount?: number; counterNote?: string } {
  if (offer.status === 'countered' && offer.message) {
    try {
      const parsed = JSON.parse(offer.message);
      if (typeof parsed === 'object' && parsed.counter_amount) {
        return {
          buyerMessage: parsed.buyer_message ?? '',
          counterAmount: Number(parsed.counter_amount),
          counterNote: parsed.counter_note ?? '',
        };
      }
    } catch { /* not JSON */ }
  }
  return { buyerMessage: offer.message ?? '' };
}

export const SentOffersTable = ({ offers, onRefresh }: SentOffersTableProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { config } = useSiteSettings();
  const [processingOffers, setProcessingOffers] = useState<Record<string, boolean>>({});
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; offerId: string; domainName: string } | null>(null);
  const [counterResponseDialog, setCounterResponseDialog] = useState<{
    open: boolean; offer: DomainOffer; action: 'accept' | 'reject';
  } | null>(null);

  const handleCancelOffer = async (offerId: string) => {
    setProcessingOffers(prev => ({ ...prev, [offerId]: true }));
    try {
      if (!user) { toast.error('请先登录'); return; }
      await apiPatch(`/data/domain-offers/${offerId}`, { status: 'cancelled' });
      toast.success('报价已取消');
      setCancelDialog(null);
      if (onRefresh) await onRefresh();
    } catch (error: any) {
      toast.error(error.message || '取消报价失败');
    } finally {
      setProcessingOffers(prev => ({ ...prev, [offerId]: false }));
    }
  };

  const handleCounterResponse = async (offer: DomainOffer, action: 'accept' | 'reject') => {
    setProcessingOffers(prev => ({ ...prev, [offer.id]: true }));
    const parsed = parseOfferMessage(offer);
    try {
      if (!user) { toast.error('请先登录'); return; }
      if (action === 'accept') {
        const counterAmt = parsed.counterAmount ?? offer.amount;
        await apiPatch(`/data/domain-offers/${offer.id}`, { status: 'accepted', amount: counterAmt });

        // Create transaction record when buyer accepts seller's counter-offer
        if (offer.domain_id && offer.seller_id && user?.id) {
          try {
            const txResult = await apiPost('/data/transactions', {
              buyer_id: user.id,
              seller_id: offer.seller_id,
              domain_id: offer.domain_id,
              offer_id: offer.id,
              amount: counterAmt,
            });
            if (txResult?.id) {
              toast.success('已接受卖家还价，交易已创建');
              setCounterResponseDialog(null);
              if (onRefresh) await onRefresh();
              navigate('/user-center?tab=transactions');
              return;
            }
          } catch (txErr) {
            console.error('Transaction creation error:', txErr);
          }
        }

        toast.success('已接受卖家还价');
      } else {
        await apiPatch(`/data/domain-offers/${offer.id}`, { status: 'rejected' });
        toast.success('已拒绝卖家还价');
      }
      setCounterResponseDialog(null);
      if (onRefresh) await onRefresh();
    } catch (error: any) {
      console.error('Counter response error:', error);
      toast.error(error.message || '操作失败');
    } finally {
      setProcessingOffers(prev => ({ ...prev, [offer.id]: false }));
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'countered':
        return { label: '卖家已还价', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 dark:border-blue-800', icon: <ArrowLeftRight className="h-3 w-3" /> };
      case 'accepted':
        return { label: '已接受', className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30 dark:border-green-800', icon: <CheckCircle2 className="h-3 w-3" /> };
      case 'rejected':
        return { label: '已拒绝', className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30 dark:border-red-800', icon: <XCircle className="h-3 w-3" /> };
      case 'completed':
        return { label: '已完成', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 dark:border-blue-800', icon: <Package className="h-3 w-3" /> };
      case 'cancelled':
        return { label: '已取消', className: 'bg-muted text-muted-foreground border-border', icon: <XCircle className="h-3 w-3" /> };
      case 'pending':
      default:
        return { label: '待处理', className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 dark:border-yellow-800', icon: <Clock className="h-3 w-3" /> };
    }
  };

  if (offers.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/50 rounded-lg border-2 border-dashed">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground font-medium">您还没有发出任何报价</p>
        <p className="mt-1 text-sm text-muted-foreground">浏览市场寻找心仪的域名并提交报价</p>
        <Link to="/marketplace">
          <Button className="mt-4" variant="outline"><ExternalLink className="h-4 w-4 mr-2" />浏览域名市场</Button>
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
            const parsed = parseOfferMessage(offer);

            return (
              <Card key={offer.id} className={`overflow-hidden ${offer.status === 'countered' ? 'border-blue-300 dark:border-blue-700' : ''}`}>
                <CardContent className="p-4 space-y-3">
                  {offer.status === 'countered' && (
                    <div className="flex items-center gap-2 bg-blue-500/10 dark:bg-blue-950/30 -mx-4 -mt-4 px-4 pt-3 pb-2 border-b border-blue-100 dark:border-blue-900">
                      <ArrowLeftRight className="h-4 w-4 text-blue-500 shrink-0" />
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-400">卖家已还价，请查看并回复</p>
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{offer.domain_name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(offer.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <Badge className={`${statusConfig.className} gap-1`}>{statusConfig.icon}{statusConfig.label}</Badge>
                  </div>

                  <div className="pt-2 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">您的出价</span>
                      <span className={`font-bold ${offer.status === 'countered' ? 'line-through text-muted-foreground' : 'text-primary text-lg'}`}>
                        ¥{(parsed.counterAmount ? offer.amount / 1 : offer.amount).toLocaleString()}
                      </span>
                    </div>
                    {offer.status === 'countered' && parsed.counterAmount && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <ArrowLeftRight className="h-3.5 w-3.5" />卖家还价
                        </span>
                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">¥{parsed.counterAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {parsed.counterNote && (
                    <div className="bg-blue-500/10 dark:bg-blue-950/30 rounded-lg p-3">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">卖家备注</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">{parsed.counterNote}</p>
                    </div>
                  )}

                  {parsed.buyerMessage && offer.status !== 'countered' && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">留言</p>
                      <p className="text-sm bg-muted/50 p-2 rounded">{parsed.buyerMessage}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    {offer.status === 'countered' ? (
                      <>
                        <Button size="sm" className="flex-1 gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => setCounterResponseDialog({ open: true, offer, action: 'accept' })}
                          disabled={isProcessing}>
                          <Check className="h-4 w-4" />接受还价
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 gap-1 text-destructive hover:bg-destructive/10"
                          onClick={() => setCounterResponseDialog({ open: true, offer, action: 'reject' })}
                          disabled={isProcessing}>
                          <X className="h-4 w-4" />拒绝
                        </Button>
                      </>
                    ) : offer.status === 'accepted' && offer.transaction_id ? (
                      <Link to={`/transaction/${offer.transaction_id}`} className="flex-1">
                        <Button size="sm" className="w-full gap-1.5"><ArrowRight className="h-4 w-4" />进入交易详情</Button>
                      </Link>
                    ) : (
                      <Link to={`/domain/${offer.domain_name}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full"><Eye className="h-4 w-4 mr-1" />查看域名</Button>
                      </Link>
                    )}
                    {offer.status === 'pending' && (
                      <Button size="sm" variant="outline"
                        onClick={() => setCancelDialog({ open: true, offerId: offer.id, domainName: offer.domain_name || '' })}
                        className="text-destructive hover:bg-destructive/10" disabled={isProcessing}>
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
                <th className="text-left p-4 font-semibold">报价 / 还价</th>
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
                const parsed = parseOfferMessage(offer);

                return (
                  <tr key={offer.id} className={`hover:bg-muted/30 transition-colors ${offer.status === 'countered' ? 'bg-blue-500/10/50 dark:bg-blue-950/10' : ''}`}>
                    <td className="p-4">
                      <Link to={`/domain/${offer.domain_name}`} className="font-semibold text-primary hover:underline">{offer.domain_name}</Link>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className={`font-bold ${offer.status === 'countered' ? 'line-through text-muted-foreground text-sm' : 'text-primary text-lg'}`}>
                          ¥{offer.amount.toLocaleString()}
                        </span>
                        {offer.status === 'countered' && parsed.counterAmount && (
                          <span className="text-base font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <ArrowLeftRight className="h-3.5 w-3.5" />¥{parsed.counterAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={`${statusConfig.className} gap-1`}>{statusConfig.icon}{statusConfig.label}</Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(offer.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="space-y-1">
                        {parsed.buyerMessage ? (
                          <p className="text-sm text-muted-foreground truncate" title={parsed.buyerMessage}>{parsed.buyerMessage}</p>
                        ) : (
                          <span className="text-sm text-muted-foreground/50">无留言</span>
                        )}
                        {parsed.counterNote && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 truncate" title={parsed.counterNote}>
                            卖家: {parsed.counterNote}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {offer.status === 'countered' ? (
                          <>
                            <Button size="sm" className="gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => setCounterResponseDialog({ open: true, offer, action: 'accept' })}
                              disabled={isProcessing}>
                              <Check className="h-4 w-4" />接受还价
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 text-destructive hover:bg-destructive/10"
                              onClick={() => setCounterResponseDialog({ open: true, offer, action: 'reject' })}
                              disabled={isProcessing}>
                              <X className="h-4 w-4" />拒绝
                            </Button>
                          </>
                        ) : offer.status === 'accepted' && offer.transaction_id ? (
                          <Link to={`/transaction/${offer.transaction_id}`}>
                            <Button size="sm" className="gap-1.5"><ArrowRight className="h-4 w-4" />进入交易</Button>
                          </Link>
                        ) : (
                          <Link to={`/domain/${offer.domain_name}`}>
                            <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1" />查看</Button>
                          </Link>
                        )}
                        {offer.status === 'pending' && (
                          <Button size="sm" variant="outline"
                            onClick={() => setCancelDialog({ open: true, offerId: offer.id, domainName: offer.domain_name || '' })}
                            className="text-destructive hover:bg-destructive/10" disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}取消
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
              <AlertDialogAction onClick={() => handleCancelOffer(cancelDialog.offerId)}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">确认取消</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* 还价回复确认对话框 */}
      {counterResponseDialog && (
        <AlertDialog open={counterResponseDialog.open} onOpenChange={(open) => !open && setCounterResponseDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {counterResponseDialog.action === 'accept' ? '确认接受卖家还价？' : '确认拒绝卖家还价？'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {counterResponseDialog.action === 'accept' ? (
                  <>
                    您将以 <span className="font-bold text-blue-600">¥{parseOfferMessage(counterResponseDialog.offer).counterAmount?.toLocaleString()}</span> 的价格购买域名{' '}
                    <span className="font-semibold">{counterResponseDialog.offer.domain_name}</span>，系统将自动创建交易记录。
                  </>
                ) : (
                  <>
                    拒绝后卖家将收到通知，本次还价协商结束。如仍有意向可重新提交报价。
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleCounterResponse(counterResponseDialog.offer, counterResponseDialog.action)}
                className={counterResponseDialog.action === 'reject' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : 'bg-blue-600 hover:bg-blue-700 text-white'}
              >
                {counterResponseDialog.action === 'accept' ? '确认接受' : '确认拒绝'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
