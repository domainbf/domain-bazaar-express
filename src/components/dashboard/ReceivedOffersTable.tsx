
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DomainOffer } from "@/types/domain";
import { Check, X, Mail, AlertCircle } from 'lucide-react';
import { useState } from "react";

interface ReceivedOffersTableProps {
  offers: DomainOffer[];
  onRefresh: () => Promise<void>;
}

export const ReceivedOffersTable = ({ offers, onRefresh }: ReceivedOffersTableProps) => {
  const [processingOffers, setProcessingOffers] = useState<Record<string, boolean>>({});
  
  const handleOfferAction = async (offerId: string, action: 'accepted' | 'rejected' | 'completed') => {
    setProcessingOffers(prev => ({...prev, [offerId]: true}));
    
    try {
      const { error } = await supabase
        .from('domain_offers')
        .update({ status: action })
        .eq('id', offerId);
      
      if (error) throw error;
      
      // Get the offer details to send notification
      const { data: offerData } = await supabase
        .from('domain_offers')
        .select('*, domain_listings(name)')
        .eq('id', offerId)
        .single();
        
      if (offerData) {
        // Send email notification to buyer
        try {
          await supabase.functions.invoke('send-notification', {
            body: {
              type: action === 'accepted' ? 'offer_accepted' : 'offer_rejected',
              recipient: offerData.contact_email,
              data: { 
                domain: offerData.domain_listings.name,
                amount: offerData.amount,
                status: action
              }
            }
          });
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }
      }
      
      const actionText = action === 'accepted' ? '已接受' : (action === 'rejected' ? '已拒绝' : '已完成');
      toast.success(`报价${actionText}成功`);
      onRefresh();
    } catch (error: any) {
      console.error('Error updating offer:', error);
      toast.error(error.message || '更新报价状态失败');
    } finally {
      setProcessingOffers(prev => ({...prev, [offerId]: false}));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">待处理</span>;
      case 'accepted':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">已接受</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">已拒绝</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">已完成</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  if (offers.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <AlertCircle className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-2 text-gray-600">您还没有收到任何报价</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-4 border-b">域名</th>
            <th className="text-left p-4 border-b">报价金额</th>
            <th className="text-left p-4 border-b">来自</th>
            <th className="text-left p-4 border-b">状态</th>
            <th className="text-left p-4 border-b">操作</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => (
            <tr key={offer.id} className="border-b hover:bg-gray-50">
              <td className="p-4 font-medium">{offer.domain_name}</td>
              <td className="p-4">${offer.amount.toLocaleString()}</td>
              <td className="p-4">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${offer.contact_email}`} className="text-blue-600 hover:underline">
                    {offer.contact_email}
                  </a>
                </div>
              </td>
              <td className="p-4">{getStatusBadge(offer.status)}</td>
              <td className="p-4">
                {offer.status === 'pending' && (
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleOfferAction(offer.id, 'accepted')}
                      className="bg-green-600 text-white hover:bg-green-700"
                      disabled={processingOffers[offer.id]}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      接受
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleOfferAction(offer.id, 'rejected')}
                      className="border-gray-300 text-red-600 hover:bg-red-50"
                      disabled={processingOffers[offer.id]}
                    >
                      <X className="h-4 w-4 mr-1" />
                      拒绝
                    </Button>
                  </div>
                )}
                {offer.status === 'accepted' && (
                  <Button 
                    size="sm" 
                    onClick={() => handleOfferAction(offer.id, 'completed')}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    disabled={processingOffers[offer.id]}
                  >
                    标记为已完成
                  </Button>
                )}
                {(offer.status === 'rejected' || offer.status === 'completed') && (
                  <span className="text-gray-500 text-sm">无可用操作</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
