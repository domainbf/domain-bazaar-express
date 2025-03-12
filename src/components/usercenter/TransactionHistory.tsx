
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DomainOffer } from '@/types/domain';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReceivedOffersTable } from '@/components/dashboard/ReceivedOffersTable';
import { SentOffersTable } from '@/components/dashboard/SentOffersTable';

export const TransactionHistory = () => {
  const [receivedOffers, setReceivedOffers] = useState<DomainOffer[]>([]);
  const [sentOffers, setSentOffers] = useState<DomainOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      // Load received offers (for domains user owns)
      const { data: received, error: receivedError } = await supabase
        .from('domain_offers')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      
      if (receivedError) throw receivedError;
      
      // Get domain names for received offers
      const receivedWithDomains = await Promise.all(
        (received || []).map(async (offer) => {
          const { data: domain } = await supabase
            .from('domain_listings')
            .select('name')
            .eq('id', offer.domain_id)
            .single();
          
          return {
            ...offer,
            domain_name: domain?.name || 'Unknown domain'
          };
        })
      );
      
      setReceivedOffers(receivedWithDomains);

      // Load sent offers
      const { data: sent, error: sentError } = await supabase
        .from('domain_offers')
        .select('*')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (sentError) throw sentError;
      
      // Get domain names for sent offers
      const sentWithDomains = await Promise.all(
        (sent || []).map(async (offer) => {
          const { data: domain } = await supabase
            .from('domain_listings')
            .select('name')
            .eq('id', offer.domain_id)
            .single();
          
          return {
            ...offer,
            domain_name: domain?.name || 'Unknown domain'
          };
        })
      );
      
      setSentOffers(sentWithDomains);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      toast.error(error.message || 'Failed to load transaction history');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="received" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="received" className="data-[state=active]:bg-black data-[state=active]:text-white">
            Received Offers
          </TabsTrigger>
          <TabsTrigger value="sent" className="data-[state=active]:bg-black data-[state=active]:text-white">
            Sent Offers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          <ReceivedOffersTable offers={receivedOffers} onRefresh={loadTransactions} />
        </TabsContent>

        <TabsContent value="sent">
          <SentOffersTable offers={sentOffers} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
