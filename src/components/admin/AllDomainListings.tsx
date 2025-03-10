
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DomainListing } from '@/types/domain';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Star, Check } from 'lucide-react';

export const AllDomainListings = () => {
  const [domains, setDomains] = useState<DomainListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('domain_listings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDomains(data || []);
    } catch (error: any) {
      console.error('Error loading domains:', error);
      toast.error(error.message || 'Failed to load domains');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHighlight = async (domain: DomainListing) => {
    try {
      const { error } = await supabase
        .from('domain_listings')
        .update({ highlight: !domain.highlight })
        .eq('id', domain.id);
      
      if (error) throw error;
      
      // Update local state
      setDomains(domains.map(d => 
        d.id === domain.id ? { ...d, highlight: !d.highlight } : d
      ));
      
      toast.success(`Domain ${domain.highlight ? 'removed from' : 'added to'} featured listings`);
    } catch (error: any) {
      console.error('Error toggling highlight:', error);
      toast.error(error.message || 'Failed to update domain');
    }
  };

  const updateDomainStatus = async (domain: DomainListing, status: string) => {
    try {
      const { error } = await supabase
        .from('domain_listings')
        .update({ status })
        .eq('id', domain.id);
      
      if (error) throw error;
      
      // Update local state
      setDomains(domains.map(d => 
        d.id === domain.id ? { ...d, status } : d
      ));
      
      toast.success(`Domain status updated to ${status}`);
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update domain status');
    }
  };

  const filteredDomains = searchQuery
    ? domains.filter(domain => 
        domain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        domain.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : domains;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">All Domain Listings</h2>
        <Button size="sm" variant="outline" onClick={loadDomains}>
          Refresh
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        <Input 
          placeholder="Search domains..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-4 border-b">Domain</th>
              <th className="text-left p-4 border-b">Price</th>
              <th className="text-left p-4 border-b">Category</th>
              <th className="text-left p-4 border-b">Status</th>
              <th className="text-left p-4 border-b">Verification</th>
              <th className="text-left p-4 border-b">Created</th>
              <th className="text-left p-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDomains.map((domain) => (
              <tr key={domain.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {domain.name}
                    {domain.highlight && (
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    )}
                  </div>
                </td>
                <td className="p-4">${domain.price}</td>
                <td className="p-4 capitalize">{domain.category}</td>
                <td className="p-4 capitalize">{domain.status}</td>
                <td className="p-4">
                  {domain.is_verified ? (
                    <span className="inline-flex items-center text-green-600">
                      <Check className="h-4 w-4 mr-1" />
                      Verified
                    </span>
                  ) : domain.verification_status === 'pending' ? (
                    <span className="text-yellow-600">Pending</span>
                  ) : (
                    <span className="text-gray-500">Not Verified</span>
                  )}
                </td>
                <td className="p-4">
                  {new Date(domain.created_at).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toggleHighlight(domain)}>
                        {domain.highlight ? 'Remove Featured' : 'Mark as Featured'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateDomainStatus(domain, 'available')}>
                        Set as Available
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateDomainStatus(domain, 'sold')}>
                        Mark as Sold
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateDomainStatus(domain, 'reserved')}>
                        Mark as Reserved
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredDomains.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No domains found</p>
        </div>
      )}
    </div>
  );
};
