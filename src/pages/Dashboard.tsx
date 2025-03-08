import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Edit, Trash, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Navbar } from '@/components/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DomainListing {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  highlight: boolean;
  status: string;
  created_at: string;
  owner_id: string;
}

interface DomainOffer {
  id: string;
  domain_id: string;
  amount: number;
  status: string;
  message: string;
  created_at: string;
  contact_email: string;
  domain_name?: string;
  buyer_email?: string;
  seller_id?: string;
  buyer_id?: string;
  updated_at?: string;
}

export const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [myDomains, setMyDomains] = useState<DomainListing[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<DomainOffer[]>([]);
  const [sentOffers, setSentOffers] = useState<DomainOffer[]>([]);
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainListing | null>(null);
  const navigate = useNavigate();

  // Form state for adding/editing domains
  const [domainName, setDomainName] = useState('');
  const [domainPrice, setDomainPrice] = useState('');
  const [domainDescription, setDomainDescription] = useState('');
  const [domainCategory, setDomainCategory] = useState('standard');
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      toast.error('Please sign in to access the dashboard');
      navigate('/');
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load user's domains
      const { data: domains, error: domainsError } = await supabase
        .from('domain_listings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (domainsError) throw domainsError;
      setMyDomains(domains as DomainListing[] || []);

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

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const domainData = {
        name: domainName,
        price: parseFloat(domainPrice),
        description: domainDescription,
        category: domainCategory,
        highlight: isHighlighted,
        owner_id: user.id
      };

      if (editingDomain) {
        // Update existing domain
        const { error } = await supabase
          .from('domain_listings')
          .update(domainData)
          .eq('id', editingDomain.id);
        
        if (error) throw error;
        toast.success('Domain updated successfully');
      } else {
        // Add new domain
        const { error } = await supabase
          .from('domain_listings')
          .insert([domainData]);
        
        if (error) throw error;
        toast.success('Domain added successfully');
      }

      // Reset form and close dialog
      resetForm();
      setIsAddDomainOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving domain:', error);
      toast.error(error.message || 'Failed to save domain');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;

    try {
      const { error } = await supabase
        .from('domain_listings')
        .delete()
        .eq('id', domainId);
      
      if (error) throw error;
      toast.success('Domain deleted successfully');
      loadData();
    } catch (error: any) {
      console.error('Error deleting domain:', error);
      toast.error(error.message || 'Failed to delete domain');
    }
  };

  const handleEditDomain = (domain: DomainListing) => {
    setEditingDomain(domain);
    setDomainName(domain.name);
    setDomainPrice(domain.price.toString());
    setDomainDescription(domain.description || '');
    setDomainCategory(domain.category || 'standard');
    setIsHighlighted(domain.highlight);
    setIsAddDomainOpen(true);
  };

  const handleOfferAction = async (offerId: string, action: 'accepted' | 'rejected' | 'completed') => {
    try {
      const { error } = await supabase
        .from('domain_offers')
        .update({ status: action })
        .eq('id', offerId);
      
      if (error) throw error;
      
      toast.success(`Offer ${action} successfully`);
      loadData();
    } catch (error: any) {
      console.error('Error updating offer:', error);
      toast.error(error.message || 'Failed to update offer');
    }
  };

  const resetForm = () => {
    setDomainName('');
    setDomainPrice('');
    setDomainDescription('');
    setDomainCategory('standard');
    setIsHighlighted(false);
    setEditingDomain(null);
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
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black">Dashboard</h1>
          <Button 
            onClick={() => {
              resetForm();
              setIsAddDomainOpen(true);
            }}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Domain
          </Button>
        </div>

        <Tabs defaultValue="domains" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="domains" className="data-[state=active]:bg-black data-[state=active]:text-white">
              My Domains
            </TabsTrigger>
            <TabsTrigger value="received" className="data-[state=active]:bg-black data-[state=active]:text-white">
              Received Offers
            </TabsTrigger>
            <TabsTrigger value="sent" className="data-[state=active]:bg-black data-[state=active]:text-white">
              Sent Offers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="domains">
            {myDomains.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-4">You haven't listed any domains yet</p>
                <Button 
                  onClick={() => {
                    resetForm();
                    setIsAddDomainOpen(true);
                  }}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  Add Your First Domain
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-4 border-b">Domain</th>
                      <th className="text-left p-4 border-b">Price</th>
                      <th className="text-left p-4 border-b">Category</th>
                      <th className="text-left p-4 border-b">Status</th>
                      <th className="text-left p-4 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myDomains.map((domain) => (
                      <tr key={domain.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="font-medium">{domain.name}</div>
                          {domain.highlight && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Featured</span>}
                        </td>
                        <td className="p-4">${domain.price}</td>
                        <td className="p-4 capitalize">{domain.category}</td>
                        <td className="p-4 capitalize">{domain.status}</td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEditDomain(domain)}
                              className="border-gray-300 text-black hover:bg-gray-100"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDeleteDomain(domain.id)}
                              className="border-gray-300 text-red-600 hover:bg-red-50 hover:border-red-300"
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="received">
            {receivedOffers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">You haven't received any offers yet</p>
              </div>
            ) : (
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
                    {receivedOffers.map((offer) => (
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
            )}
          </TabsContent>

          <TabsContent value="sent">
            {sentOffers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">You haven't made any offers yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-4 border-b">Domain</th>
                      <th className="text-left p-4 border-b">Your Offer</th>
                      <th className="text-left p-4 border-b">Status</th>
                      <th className="text-left p-4 border-b">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentOffers.map((offer) => (
                      <tr key={offer.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{offer.domain_name}</td>
                        <td className="p-4">${offer.amount}</td>
                        <td className="p-4 capitalize">
                          <span className={`px-2 py-1 rounded text-xs ${
                            offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            offer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            offer.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {offer.status}
                          </span>
                        </td>
                        <td className="p-4">{new Date(offer.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Domain Dialog */}
      <Dialog open={isAddDomainOpen} onOpenChange={setIsAddDomainOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-black">
              {editingDomain ? 'Edit Domain' : 'Add New Domain'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDomain} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Domain Name</label>
              <Input
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                required
                className="bg-white border-gray-300"
                placeholder="example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Price ($)</label>
              <Input
                type="number"
                value={domainPrice}
                onChange={(e) => setDomainPrice(e.target.value)}
                required
                className="bg-white border-gray-300"
                placeholder="1000"
                min="1"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={domainDescription}
                onChange={(e) => setDomainDescription(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md p-2 text-black"
                placeholder="Describe your domain (optional)"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select
                value={domainCategory}
                onChange={(e) => setDomainCategory(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md p-2 text-black"
              >
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="short">Short</option>
                <option value="dev">Development</option>
                <option value="brandable">Brandable</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="highlight"
                checked={isHighlighted}
                onChange={(e) => setIsHighlighted(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="highlight" className="text-sm font-medium text-gray-700">
                Highlight this domain (featured)
              </label>
            </div>
            <Button 
              type="submit"
              disabled={formLoading}
              className="w-full bg-black text-white hover:bg-gray-800"
            >
              {formLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin w-4 h-4" />
                  Saving...
                </span>
              ) : (
                editingDomain ? 'Update Domain' : 'Add Domain'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
