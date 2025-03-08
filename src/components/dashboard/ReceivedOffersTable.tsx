
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DomainOffer } from "@/types/domain";

interface ReceivedOffersTableProps {
  offers: DomainOffer[];
  onRefresh: () => Promise<void>;
}

export const ReceivedOffersTable = ({ offers, onRefresh }: ReceivedOffersTableProps) => {
  const handleOfferAction = async (offerId: string, action: 'accepted' | 'rejected' | 'completed') => {
    try {
      const { error } = await supabase
        .from('domain_offers')
        .update({ status: action })
        .eq('id', offerId);
      
      if (error) throw error;
      
      toast.success(`Offer ${action} successfully`);
      onRefresh();
    } catch (error: any) {
      console.error('Error updating offer:', error);
      toast.error(error.message || 'Failed to update offer');
    }
  };

  if (offers.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600">You haven't received any offers yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-4 border-b">Domain</th>
            <th className="text-left p-4 border-b">Offer Amount</th>
            <th className="text-left p-4 border-b">From</th>
            <th className="text-left p-4 border-b">Status</th>
            <th className="text-left p-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => (
            <tr key={offer.id} className="border-b hover:bg-gray-50">
              <td className="p-4 font-medium">{offer.domain_name}</td>
              <td className="p-4">${offer.amount}</td>
              <td className="p-4">{offer.contact_email}</td>
              <td className="p-4 capitalize">{offer.status}</td>
              <td className="p-4">
                {offer.status === 'pending' && (
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleOfferAction(offer.id, 'accepted')}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      Accept
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleOfferAction(offer.id, 'rejected')}
                      className="border-gray-300 text-red-600 hover:bg-red-50"
                    >
                      Reject
                    </Button>
                  </div>
                )}
                {offer.status === 'accepted' && (
                  <Button 
                    size="sm" 
                    onClick={() => handleOfferAction(offer.id, 'completed')}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Mark as Completed
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
