
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DomainForm } from '@/components/dashboard/DomainForm';
import { DomainListingsTable } from '@/components/dashboard/DomainListingsTable';
import { DomainListing } from '@/types/domain';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

export const DomainManagement = () => {
  const [domains, setDomains] = useState<DomainListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainListing | null>(null);
  const [domainStats, setDomainStats] = useState({ total: 0, verified: 0, pending: 0 });
  const navigate = useNavigate();

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
      
      // Calculate domain statistics
      if (data) {
        const stats = {
          total: data.length,
          verified: data.filter(d => d.verification_status === 'verified').length,
          pending: data.filter(d => d.verification_status === 'pending').length
        };
        setDomainStats(stats);
      }
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

  const handleVerifyDomain = (domainId: string) => {
    navigate(`/domain-verification/${domainId}`);
  };

  const handleDeleteDomain = async (domainId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this domain? This action cannot be undone.');
    
    if (!confirmed) return;
    
    try {
      // Check if there are any verifications for this domain
      const { data: verifications, error: verificationError } = await supabase
        .from('domain_verifications')
        .select('id')
        .eq('domain_id', domainId);
      
      if (verificationError) throw verificationError;
      
      // Delete any verifications
      if (verifications && verifications.length > 0) {
        const { error: deleteVerificationError } = await supabase
          .from('domain_verifications')
          .delete()
          .eq('domain_id', domainId);
        
        if (deleteVerificationError) throw deleteVerificationError;
      }
      
      // Delete the domain
      const { error: deleteDomainError } = await supabase
        .from('domain_listings')
        .delete()
        .eq('id', domainId);
      
      if (deleteDomainError) throw deleteDomainError;
      
      toast.success('Domain deleted successfully');
      loadDomains();
    } catch (error: any) {
      console.error('Error deleting domain:', error);
      toast.error(error.message || 'Failed to delete domain');
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Your Domains</h2>
          <div className="flex space-x-4 text-sm">
            <span>Total: {domainStats.total}</span>
            <span>Verified: {domainStats.verified}</span>
            <span>Pending verification: {domainStats.pending}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadDomains}
            className="flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
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
      </div>

      {domains.length === 0 ? (
        <Alert>
          <AlertTitle>No domains found</AlertTitle>
          <AlertDescription>
            You haven't added any domains yet. Click the "Add Domain" button to get started.
          </AlertDescription>
        </Alert>
      ) : (
        <DomainListingsTable 
          domains={domains} 
          onEdit={handleEditDomain} 
          onRefresh={loadDomains} 
          onVerify={handleVerifyDomain}
          onDelete={handleDeleteDomain}
          showActions={true}
        />
      )}

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
