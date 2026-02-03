
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DomainOffer } from "@/types/domain";
import { Check, X, Mail, AlertCircle, Clock, Package, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from "react";
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

interface ReceivedOffersTableProps {
  offers: DomainOffer[];
  onRefresh: () => Promise<void>;
}

export const ReceivedOffersTable = ({ offers, onRefresh }: ReceivedOffersTableProps) => {
  const [processingOffers, setProcessingOffers] = useState<Record<string, boolean>>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    offerId: string;
    action: 'accepted' | 'rejected' | 'completed';
    domainName: string;
  } | null>(null);

  // 实时监听报价状态变化
  useEffect(() => {
    const channel = supabase
      .channel('received-offers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'domain_offers'
        },
        (payload) => {
          console.log('Offer updated:', payload);
          onRefresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onRefresh]);
  
  const handleOfferAction = async (offerId: string, action: 'accepted' | 'rejected' | 'completed') => {
    setProcessingOffers(prev => ({...prev, [offerId]: true}));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('请先登录');
        return;
      }

      // 先获取报价详情以确认权限
      const { data: offerData, error: fetchError } = await supabase
        .from('domain_offers')
        .select(`
          *,
          domain_listings (name, owner_id)
        `)
        .eq('id', offerId)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (!offerData) {
        toast.error('报价不存在');
        return;
      }

      // 验证当前用户是卖家
      if (offerData.seller_id !== user.id) {
        toast.error('您没有权限处理此报价');
        return;
      }

      // 使用 RPC 或直接更新（卖家有更新自己收到报价的权限）
      const { error: updateError } = await supabase
        .from('domain_offers')
        .update({ 
          status: action, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', offerId)
        .eq('seller_id', user.id); // 确保只更新自己的报价
      
      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(`更新失败: ${updateError.message}`);
      }
        
      // 创建通知给买家
      if (offerData.buyer_id && offerData.domain_listings) {
        const actionMessages = {
          accepted: '您的报价已被接受！卖家将与您联系完成交易。',
          rejected: '您的报价已被拒绝，您可以尝试提交新的报价。',
          completed: '交易已完成！感谢您使用我们的平台。'
        };

        try {
          await supabase
            .from('notifications')
            .insert({
              user_id: offerData.buyer_id,
              title: `报价${action === 'accepted' ? '已接受' : action === 'rejected' ? '已拒绝' : '已完成'}`,
              message: `您对域名 ${offerData.domain_listings.name} 的报价（¥${offerData.amount}）${actionMessages[action]}`,
              type: 'offer',
              related_id: offerId,
              action_url: '/user-center?tab=transactions'
            });
        } catch (notifError) {
          console.error('Notification error:', notifError);
          // 通知失败不影响主流程
        }
      }
      
      const actionText = action === 'accepted' ? '已接受' : (action === 'rejected' ? '已拒绝' : '已完成');
      toast.success(`报价${actionText}成功`);
      setConfirmDialog(null);
      await onRefresh();
    } catch (error: any) {
      console.error('Error updating offer:', error);
      toast.error(error.message || '更新报价状态失败，请检查权限');
    } finally {
      setProcessingOffers(prev => ({...prev, [offerId]: false}));
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: '待处理',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="h-3 w-3" />
        };
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
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <AlertCircle className="h-3 w-3" />
        };
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
            
            return (
              <Card key={offer.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{offer.domain_name}</h3>
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <a href={`mailto:${offer.contact_email}`} className="hover:text-primary">
                          {offer.contact_email}
                        </a>
                      </div>
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
                      <p className="text-xs text-muted-foreground mb-1">买家留言</p>
                      <p className="text-sm bg-muted/50 p-2 rounded">{offer.message}</p>
                    </div>
                  )}

                  {offer.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button 
                        size="sm" 
                        onClick={() => setConfirmDialog({ open: true, offerId: offer.id, action: 'accepted', domainName: offer.domain_name || '' })}
                        className="flex-1"
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                        接受
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setConfirmDialog({ open: true, offerId: offer.id, action: 'rejected', domainName: offer.domain_name || '' })}
                        className="flex-1 text-red-600 hover:bg-red-50"
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                        拒绝
                      </Button>
                    </div>
                  )}
                  
                  {offer.status === 'accepted' && (
                    <Button 
                      size="sm" 
                      onClick={() => setConfirmDialog({ open: true, offerId: offer.id, action: 'completed', domainName: offer.domain_name || '' })}
                      className="w-full"
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Package className="h-4 w-4 mr-1" />}
                      标记为已完成
                    </Button>
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
                
                return (
                  <tr key={offer.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-semibold">{offer.domain_name}</td>
                    <td className="p-4">
                      <span className="text-lg font-bold text-primary">
                        ¥{offer.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${offer.contact_email}`} className="text-primary hover:underline text-sm">
                          {offer.contact_email}
                        </a>
                      </div>
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
                      <Badge className={`${statusConfig.className} gap-1`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {offer.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            onClick={() => setConfirmDialog({ open: true, offerId: offer.id, action: 'accepted', domainName: offer.domain_name || '' })}
                            disabled={isProcessing}
                          >
                            {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                            接受
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setConfirmDialog({ open: true, offerId: offer.id, action: 'rejected', domainName: offer.domain_name || '' })}
                            className="text-red-600 hover:bg-red-50"
                            disabled={isProcessing}
                          >
                            {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                            拒绝
                          </Button>
                        </div>
                      )}
                      {offer.status === 'accepted' && (
                        <Button 
                          size="sm" 
                          onClick={() => setConfirmDialog({ open: true, offerId: offer.id, action: 'completed', domainName: offer.domain_name || '' })}
                          disabled={isProcessing}
                        >
                          {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Package className="h-4 w-4 mr-1" />}
                          标记完成
                        </Button>
                      )}
                      {(offer.status === 'rejected' || offer.status === 'completed') && (
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
                {confirmDialog.action === 'accepted' && `接受后，系统将通知买家，您需要与买家协商完成域名 ${confirmDialog.domainName} 的交易。`}
                {confirmDialog.action === 'rejected' && `拒绝后，买家将收到通知，此操作不可撤销。`}
                {confirmDialog.action === 'completed' && `确认域名交易已完成？此操作将关闭该报价。`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleOfferAction(confirmDialog.offerId, confirmDialog.action)}
                className={confirmDialog.action === 'rejected' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                确认
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
