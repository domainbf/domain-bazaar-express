
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DomainForm } from '@/components/dashboard/DomainForm';
import { DomainListingsTable } from '@/components/dashboard/DomainListingsTable';
import { DomainListing } from '@/types/domain';

export const DomainManagement = () => {
  const [domains, setDomains] = useState<DomainListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainListing | null>(null);

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('domain_listings')
        .select('*')
        .eq('owner_id', user.id)
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

  const handleEditDomain = (domain: DomainListing) => {
    setEditingDomain(domain);
    setIsAddDomainOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button 
          onClick={() => {
            setEditingDomain(null);
            setIsAddDomainOpen(true);
          }}
          className="bg-black text-white hover:bg-gray-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Domain
        </Button>
      </div>

      <DomainListingsTable 
        domains={domains} 
        onEdit={handleEditDomain} 
        onRefresh={loadDomains} 
      />

      {/* Add/Edit Domain Dialog */}
      <Dialog open={isAddDomainOpen} onOpenChange={setIsAddDomainOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-black">
              {editingDomain ? 'Edit Domain' : 'Add New Domain'}
            </DialogTitle>
          </DialogHeader>
          <DomainForm 
            isOpen={isAddDomainOpen} 
            onClose={() => setIsAddDomainOpen(false)} 
            onSuccess={loadDomains} 
            editingDomain={editingDomain} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
