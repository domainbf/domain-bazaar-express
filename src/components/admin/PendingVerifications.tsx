
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DomainVerification } from '@/types/domain';
import { Button } from "@/components/ui/button";
import { Check, X, ExternalLink } from 'lucide-react';

export const PendingVerifications = () => {
  const [verifications, setVerifications] = useState<DomainVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPendingVerifications();
  }, []);

  const loadPendingVerifications = async () => {
    setIsLoading(true);
    try {
      // Get pending verifications with domain info
      const { data, error } = await supabase
        .from('domain_verifications')
        .select(`
          *,
          domain_listings:domain_id (
            id,
            name,
            owner_id
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setVerifications(data || []);
    } catch (error: any) {
      console.error('Error loading pending verifications:', error);
      toast.error(error.message || 'Failed to load pending verifications');
    } finally {
      setIsLoading(false);
    }
  };

  const approveVerification = async (id: string, domainId: string) => {
    try {
      // Update verification status
      const { error: verificationError } = await supabase
        .from('domain_verifications')
        .update({ status: 'verified' })
        .eq('id', id);
      
      if (verificationError) throw verificationError;
      
      // Update domain verification status
      const { error: domainError } = await supabase
        .from('domain_listings')
        .update({ 
          verification_status: 'verified',
          is_verified: true
        })
        .eq('id', domainId);
      
      if (domainError) throw domainError;
      
      toast.success('Domain verification approved');
      loadPendingVerifications();
    } catch (error: any) {
      console.error('Error approving verification:', error);
      toast.error(error.message || 'Failed to approve verification');
    }
  };

  const rejectVerification = async (id: string, domainId: string) => {
    try {
      // Update verification status
      const { error: verificationError } = await supabase
        .from('domain_verifications')
        .update({ status: 'rejected' })
        .eq('id', id);
      
      if (verificationError) throw verificationError;
      
      // Update domain verification status
      const { error: domainError } = await supabase
        .from('domain_listings')
        .update({ 
          verification_status: 'rejected',
          is_verified: false
        })
        .eq('id', domainId);
      
      if (domainError) throw domainError;
      
      toast.success('Domain verification rejected');
      loadPendingVerifications();
    } catch (error: any) {
      console.error('Error rejecting verification:', error);
      toast.error(error.message || 'Failed to reject verification');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (verifications.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600 mb-4">No pending verifications</p>
        <Button variant="outline" onClick={loadPendingVerifications}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Pending Domain Verifications</h2>
        <Button size="sm" variant="outline" onClick={loadPendingVerifications}>
          Refresh
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-4 border-b">Domain</th>
              <th className="text-left p-4 border-b">Type</th>
              <th className="text-left p-4 border-b">Submitted</th>
              <th className="text-left p-4 border-b">Verification Data</th>
              <th className="text-left p-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {verifications.map((verification) => (
              <tr key={verification.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">
                  {/* @ts-ignore - We know domain_listings exists from our join */}
                  {verification.domain_listings?.name}
                </td>
                <td className="p-4 capitalize">{verification.verification_type}</td>
                <td className="p-4">
                  {new Date(verification.created_at).toLocaleDateString()}
                </td>
                <td className="p-4">
                  {verification.verification_type === 'dns' ? (
                    <div className="text-sm">
                      <p>TXT Record: {verification.verification_data.recordName}</p>
                      <p className="text-gray-500 truncate">{verification.verification_data.recordValue}</p>
                    </div>
                  ) : (
                    <div className="text-sm">
                      <p>File: {verification.verification_data.fileLocation}</p>
                      <div className="flex items-center">
                        <p className="text-gray-500 truncate">{verification.verification_data.fileContent}</p>
                        <a 
                          /* @ts-ignore - We know domain_listings exists from our join */
                          href={`https://${verification.domain_listings?.name}${verification.verification_data.fileLocation}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
                      onClick={() => approveVerification(verification.id, verification.domain_id)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                      onClick={() => rejectVerification(verification.id, verification.domain_id)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
