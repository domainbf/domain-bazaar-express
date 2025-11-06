
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Navbar } from '@/components/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DomainListingsTable } from '@/components/dashboard/DomainListingsTable';
import { ReceivedOffersTable } from '@/components/dashboard/ReceivedOffersTable';
import { SentOffersTable } from '@/components/dashboard/SentOffersTable';
import { DomainForm } from '@/components/dashboard/DomainForm';
import { DomainListing, DomainOffer } from '@/types/domain';

export const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [myDomains, setMyDomains] = useState<DomainListing[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<DomainOffer[]>([]);
  const [sentOffers, setSentOffers] = useState<DomainOffer[]>([]);
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainListing | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      toast.error('请先登录以访问控制台');
      navigate('/auth');
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 获取当前用户
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('请先登录');
        navigate('/auth');
        return;
      }

      // 仅加载当前用户的域名
      const { data: domains, error: domainsError } = await supabase
        .from('domain_listings')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (domainsError) throw domainsError;
      setMyDomains(domains as unknown as DomainListing[] || []);

      // Load received offers (for domains user owns)
      const { data: received, error: receivedError } = await supabase
        .from('domain_offers')
        .select('*')
        .eq('seller_id', (await supabase.auth.getUser()).data.user?.id)
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
      
      setReceivedOffers(receivedWithDomains as unknown as DomainOffer[]);

      // Load sent offers
      const { data: sent, error: sentError } = await supabase
        .from('domain_offers')
        .select('*')
        .eq('buyer_id', (await supabase.auth.getUser()).data.user?.id)
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
      
      setSentOffers(sentWithDomains as unknown as DomainOffer[]);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast.error(error.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDomain = (domain: DomainListing) => {
    setEditingDomain(domain);
    setIsAddDomainOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-black" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">控制台</h1>
          <Button 
            id="add-domain-button"
            onClick={() => {
              setEditingDomain(null);
              setIsAddDomainOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            添加域名
          </Button>
        </div>

        <Tabs defaultValue="domains" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="domains">
              我的域名
            </TabsTrigger>
            <TabsTrigger value="received">
              收到的报价
            </TabsTrigger>
            <TabsTrigger value="sent">
              发出的报价
            </TabsTrigger>
          </TabsList>

          <TabsContent value="domains">
            <DomainListingsTable 
              domains={myDomains} 
              onEdit={handleEditDomain} 
              onRefresh={loadData} 
            />
          </TabsContent>

          <TabsContent value="received">
            <ReceivedOffersTable 
              offers={receivedOffers} 
              onRefresh={loadData} 
            />
          </TabsContent>

          <TabsContent value="sent">
            <SentOffersTable offers={sentOffers} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Domain Dialog */}
      <Dialog open={isAddDomainOpen} onOpenChange={setIsAddDomainOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {editingDomain ? '编辑域名' : '添加新域名'}
            </DialogTitle>
          </DialogHeader>
          <DomainForm 
            isOpen={isAddDomainOpen} 
            onClose={() => setIsAddDomainOpen(false)} 
            onSuccess={loadData} 
            editingDomain={editingDomain} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
