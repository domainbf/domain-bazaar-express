
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Edit, Trash, CheckCircle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { DomainListing } from "@/types/domain";

interface DomainListingsTableProps {
  domains: DomainListing[];
  onEdit: (domain: DomainListing) => void;
  onRefresh: () => Promise<void>;
  onVerify?: (domainId: string) => void;
  onDelete?: (domainId: string) => Promise<void>;
  showActions?: boolean;
}

export const DomainListingsTable = ({ 
  domains, 
  onEdit, 
  onRefresh, 
  onVerify, 
  onDelete, 
  showActions = true 
}: DomainListingsTableProps) => {
  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;

    try {
      if (onDelete) {
        await onDelete(domainId);
      } else {
        const { error } = await supabase
          .from('domain_listings')
          .delete()
          .eq('id', domainId);
        
        if (error) throw error;
        toast.success('Domain deleted successfully');
        onRefresh();
      }
    } catch (error: any) {
      console.error('Error deleting domain:', error);
      toast.error(error.message || 'Failed to delete domain');
    }
  };

  if (domains.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600 mb-4">You haven't listed any domains yet</p>
        <Button 
          onClick={() => document.getElementById('add-domain-button')?.click()}
          className="bg-black text-white hover:bg-gray-800"
        >
          Add Your First Domain
        </Button>
      </div>
    );
  }

  return (
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
          {domains.map((domain) => (
            <tr key={domain.id} className="border-b hover:bg-gray-50">
              <td className="p-4">
                <div className="font-medium">{domain.name}</div>
                {domain.highlight && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Featured</span>}
              </td>
              <td className="p-4">${domain.price}</td>
              <td className="p-4 capitalize">{domain.category}</td>
              <td className="p-4 capitalize">{domain.status}</td>
              {showActions && (
                <td className="p-4">
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onEdit(domain)}
                      className="border-gray-300 text-black hover:bg-gray-100"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    {onVerify && domain.verification_status !== 'verified' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => onVerify(domain.id as string)}
                        className="border-gray-300 text-green-600 hover:bg-green-50 hover:border-green-300"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDeleteDomain(domain.id as string)}
                      className="border-gray-300 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
