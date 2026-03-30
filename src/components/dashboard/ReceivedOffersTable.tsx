import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { apiPost, apiPatch } from "@/lib/apiClient";
import { DomainOffer } from "@/types/domain";
import { Check, X, Mail, AlertCircle, Clock, Package, CheckCircle2, XCircle, Loader2, ArrowRight, MessageSquare, DollarSign, ArrowLeftRight } from 'lucide-react';
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface ReceivedOffersTableProps {
  offers: DomainOffer[];
  onRefresh: () => Promise<void>;
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

export const ReceivedOffersTable = ({ offers, onRefresh }: ReceivedOffersTableProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [processingOffers, setProcessingOffers] = useState<Record<string, boolean>>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; offerId: string;
    action: 'accepted' | 'rejected' | 'completed'; domainName: string;
  } | null>(null);
  const [counterDialog, setCounterDialog] = useState<{
    open: boolean; offer: DomainOffer;
  } | null>(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterNote, setCounterNote] = useState('');
  const [isCountering, setIsCountering] = useState(false);

  useRealtimeSubscription(
    ["domain_offers"],
    (_event) => { onRefresh?.(); }
  );

  const handleOfferAction = async (offerId: string, action: 'accepted' | 'rejected' | 'completed') => {
    setProcessingOffers(prev => ({ ...prev, [offerId]: true }));
    try {
      if (!user) { toast.error('请先登录'); return; }

      const offerData = offers.find(o => o.id === offerId) as any;
      if (!offerData) { toast.error('报价不存在'); return; }

      await apiPatch(`/data/domain-offers/${offerId}`, { status: action });

      // Create transaction record when seller accepts
      let newTransactionId: string | null = null;
      if (action === 'accepted' && offerData.buyer_id) {
        try {
          const txResult = await apiPost('/data/transactions', {
            buyer_id: offerData.buyer_id,
            domain_id: offerData.domain_id,
            offer_id: offerId,
            amount: offerData.amount,
          });
          if (txResult?.id) newTransactionId = txResult.id;
        } catch (txErr) {
          console.error('Transaction creation error:', txErr);
        }
      }

      const actionText = action === 'accepted' ? '已接受' : (action === 'rejected' ? '已拒绝' : '已完成');
      toast.success(`报价${actionText}，通知已发送给买家`);
      setConfirmDialog(null);
      await onRefresh();
      if (action === 'accepted' && newTransactionId) navigate(`/user-center?tab=transactions`);
    } catch (error: any) {
      console.error('Error updating offer:', error);
      toast.error(error.message || '更新报价状态失败');
    } finally {
      setProcessingOffers(prev => ({ ...prev, [offerId]: false }));
    }
  };

  const handleCounterOffer = async () => {
    if (!counterDialog) return;
    const amount = parseFloat(counterAmount.replace(/,/g, ''));
    if (!amount || amount <= 0) { toast.error('请输入有效的还价金额'); return; }

    setIsCountering(true);
    try {
      if (!user) { toast.error('请先登录'); return; }

      const offer = counterDialog.offer;

      // Preserve original buyer message, embed counter data as JSON
      const originalMessage = (() => {
        try {
          const p = JSON.parse(offer.message || '');
          return p.buyer_message ?? offer.message ?? '';
        } catch { return offer.message ?? ''; }
      })();

      const encodedMessage = JSON.stringify({
        buyer_message: originalMessage,
        counter_amount: amount,
        counter_note: counterNote.trim(),
      });

      await apiPatch(`/data/domain-offers/${offer.id}`, { status: 'countered', message: encodedMessage });

      toast.success('还价已发送，买家将收到站内通知及邮件提醒');
      setCounterDialog(null);
      setCounterAmount('');
      setCounterNote('');
      await onRefresh();
    } catch (err: any) {
      console.error('Counter offer error:', err);
      toast.error(err.message || '还价发送失败');
    } finally {
      setIsCountering(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: '待处理', className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 dark:border-yellow-800', icon: <Clock className="h-3 w-3" /> };
      case 'countered':
        return { label: '已还价', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 dark:border-blue-800', icon: <ArrowLeftRight className="h-3 w-3" /> };
      case 'accepted':
        return { label: '已接受', className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30 dark:border-green-800', icon: <CheckCircle2 className="h-3 w-3" /> };
      case 'rejected':
        return { label: '已拒绝', className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30 dark:border-red-800', icon: <XCircle className="h-3 w-3" /> };
      case 'completed':
        return { label: '已完成', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 dark:border-blue-800', icon: <Package className="h-3 w-3" /> };
      case 'cancelled':
        return { label: '已取消', className: 'bg-muted text-muted-foreground border-border', icon: <XCircle className="h-3 w-3" /> };
      default:
        return { label: status, className: 'bg-muted text-muted-foreground border-border', icon: <AlertCircle className="h-3 w-3" /> };
    }
  };

  if (offers.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/50 rounded-lg border-2 border-dashed">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground font-medium">您还没有收到任何报价</p>
        <p className="mt-1 text-sm text-muted-foreground">当有买家对您的域名感兴趣时，报价会显示在这里</p>
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
              <Card key={offer.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{offer.domain_name}</h3>
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>买家（匿名）</span>
                      </div>
                    </div>
                    <Badge className={`${statusConfig.className} gap-1`}>{statusConfig.icon}{statusConfig.label}</Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">买家报价</span>
                    <span className={`text-lg font-bold ${offer.status === 'countered' ? 'line-through text-muted-foreground' : 'text-primary'}`}>
                      ${offer.amount.toLocaleString()}
                    </span>
                  </div>

                  {offer.status === 'countered' && parsed.counterAmount && (
                    <div className="flex items-center justify-between bg-blue-500/10 dark:bg-blue-950/30 rounded-lg px-3 py-2">
                      <span className="text-sm text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1">
                        <ArrowLeftRight className="h-3.5 w-3.5" />您的还价
                      </span>
                      <span className="text-lg font-bold text-blue-700 dark:text-blue-400">${parsed.counterAmount.toLocaleString()}</span>
                    </div>
                  )}

                  {parsed.buyerMessage && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">买家留言</p>
                      <p className="text-sm bg-muted/50 p-2 rounded">{parsed.buyerMessage}</p>
                    </div>
                  )}

                  {parsed.counterNote && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">您的还价备注</p>
                      <p className="text-sm bg-blue-500/10 dark:bg-blue-950/30 p-2 rounded text-blue-700 dark:text-blue-400">{parsed.counterNote}</p>
                    </div>
                  )}

                  {offer.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button size="sm" onClick={() => setConfirmDialog({ open: true, offerId: offer.id, action: 'accepted', domainName: offer.domain_name || '' })} className="flex-1" disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}接受
                      </Button>
                      <Button size="sm" variant="outline"
                        onClick={() => { setCounterDialog({ open: true, offer }); setCounterAmount(String(Math.ceil(offer.amount * 1.2))); }}
                        className="flex-1" disabled={isProcessing}>
                        <ArrowLeftRight className="h-4 w-4 mr-1" />还价
                      </Button>
                      <Button size="sm" variant="outline"
                        onClick={() => setConfirmDialog({ open: true, offerId: offer.id, action: 'rejected', domainName: offer.domain_name || '' })}
                        className="text-destructive hover:bg-destructive/10" disabled={isProcessing}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {offer.status === 'accepted' && (
                    <div className="flex flex-col gap-2 pt-2 border-t">
                      {offer.transaction_id && (
                        <Link to={`/transaction/${offer.transaction_id}`}>
                          <Button size="sm" className="w-full gap-1.5"><ArrowRight className="h-4 w-4" />进入交易详情</Button>
                        </Link>
                      )}
                      <Button size="sm" variant="outline"
                        onClick={() => setConfirmDialog({ open: true, offerId: offer.id, action: 'completed', domainName: offer.domain_name || '' })}
                        className="w-full" disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Package className="h-4 w-4 mr-1" />}标记为已完成
                      </Button>
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
                <th className="text-left p-4 font-semibold">来自</th>
                <th className="text-left p-4 font-semibold">留言</th>
                <th className="text-left p-4 font-semibold">状态</th>
                <th className="text-left p-4 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {offers.map((offer) => {
                const statusConfig = getStatusConfig(offer.status);
                const isProcessing = processingOffers[offer.id];
                const parsed = parseOfferMessage(offer);

                return (
                  <tr key={offer.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-semibold">{offer.domain_name}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className={`text-lg font-bold ${offer.status === 'countered' ? 'line-through text-muted-foreground text-sm' : 'text-primary'}`}>
                          ${offer.amount.toLocaleString()}
                        </span>
                        {offer.status === 'countered' && parsed.counterAmount && (
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <ArrowLeftRight className="h-3 w-3" />还价 ${parsed.counterAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>买家（匿名）</span>
                      </div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="space-y-1">
                        {parsed.buyerMessage ? (
                          <p className="text-sm text-muted-foreground truncate" title={parsed.buyerMessage}>{parsed.buyerMessage}</p>
                        ) : (
                          <span className="text-sm text-muted-foreground/50">无留言</span>
                        )}
                        {parsed.counterNote && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 truncate flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 shrink-0" />{parsed.counterNote}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={`${statusConfig.className} gap-1`}>{statusConfig.icon}{statusConfig.label}</Badge>
                    </td>
                    <td className="p-4">
                      {offer.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => setConfirmDialog({ open: true, offerId: offer.id, action: 'accepted', domainName: offer.domain_name || '' })} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}接受
                          </Button>
                          <Button size="sm" variant="outline"
                            onClick={() => { setCounterDialog({ open: true, offer }); setCounterAmount(String(Math.ceil(offer.amount * 1.2))); }}
                            disabled={isProcessing} className="gap-1">
                            <ArrowLeftRight className="h-4 w-4" />还价
                          </Button>
                          <Button size="sm" variant="outline"
                            onClick={() => setConfirmDialog({ open: true, offerId: offer.id, action: 'rejected', domainName: offer.domain_name || '' })}
                            className="text-destructive hover:bg-destructive/10" disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <X className="h-4 w-4 mr-1" />}拒绝
                          </Button>
                        </div>
                      )}
                      {offer.status === 'countered' && (
                        <span className="text-sm text-blue-600 dark:text-blue-400">等待买家回复</span>
                      )}
                      {offer.status === 'accepted' && (
                        <div className="flex gap-2">
                          {offer.transaction_id && (
                            <Link to={`/transaction/${offer.transaction_id}`}>
                              <Button size="sm" className="gap-1.5"><ArrowRight className="h-4 w-4" />进入交易</Button>
                            </Link>
                          )}
                          <Button size="sm" variant="outline"
                            onClick={() => setConfirmDialog({ open: true, offerId: offer.id, action: 'completed', domainName: offer.domain_name || '' })}
                            disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Package className="h-4 w-4 mr-1" />}标记完成
                          </Button>
                        </div>
                      )}
                      {(offer.status === 'rejected' || offer.status === 'completed' || offer.status === 'cancelled') && (
                        <span className="text-sm text-muted-foreground">无可用操作</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 确认对话框 */}
      {confirmDialog && (
        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmDialog.action === 'accepted' && '确认接受报价？'}
                {confirmDialog.action === 'rejected' && '确认拒绝报价？'}
                {confirmDialog.action === 'completed' && '确认标记为已完成？'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDialog.action === 'accepted' && `接受后系统将创建交易记录，并通知买家完成付款。`}
                {confirmDialog.action === 'rejected' && `拒绝后，买家将收到通知。此操作不可撤销。`}
                {confirmDialog.action === 'completed' && `确认域名 ${confirmDialog.domainName} 的交易已完成？`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleOfferAction(confirmDialog.offerId, confirmDialog.action)}
                className={confirmDialog.action === 'rejected' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}
              >
                确认
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* 还价对话框 */}
      {counterDialog && (
        <Dialog open={counterDialog.open} onOpenChange={(open) => { if (!open) { setCounterDialog(null); setCounterAmount(''); setCounterNote(''); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-blue-500" />
                向买家还价
              </DialogTitle>
              <DialogDescription>
                买家对域名 <span className="font-semibold">{counterDialog.offer.domain_name}</span> 出价{' '}
                <span className="font-semibold">${counterDialog.offer.amount.toLocaleString()}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">还价金额 *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <Input
                    type="number"
                    placeholder="输入您的还价金额"
                    value={counterAmount}
                    onChange={e => setCounterAmount(e.target.value)}
                    className="pl-7"
                    data-testid="input-counter-amount"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  买家出价：${counterDialog.offer.amount.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">还价备注（可选）</label>
                <Textarea
                  placeholder="向买家解释您的还价理由..."
                  value={counterNote}
                  onChange={e => setCounterNote(e.target.value)}
                  rows={3}
                  data-testid="textarea-counter-note"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setCounterDialog(null)} className="flex-1">取消</Button>
                <Button
                  onClick={handleCounterOffer}
                  disabled={isCountering || !counterAmount}
                  className="flex-1 gap-2"
                  data-testid="button-submit-counter"
                >
                  {isCountering ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                  发送还价
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
