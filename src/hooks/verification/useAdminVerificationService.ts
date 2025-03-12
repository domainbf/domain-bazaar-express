
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DomainVerification } from "@/types/domain";

export const useAdminVerificationService = () => {
  const queryClient = useQueryClient();

  // Fetch pending verifications from real data
  const fetchPendingVerifications = async (): Promise<DomainVerification[]> => {
    try {
      const { data: verifications, error } = await supabase
        .from('domain_verifications')
        .select(`
          *,
          domain_listings(name, owner_id)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return verifications || [];
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      throw error;
    }
  };

  // Approve verification
  const approveVerification = async ({ id, domainId }: { id: string, domainId: string }) => {
    try {
      // Update the verification status
      const { error: verificationError } = await supabase
        .from('domain_verifications')
        .update({ status: 'verified' })
        .eq('id', id);
      
      if (verificationError) throw verificationError;
      
      // Update the domain listing status
      const { error: domainError } = await supabase
        .from('domain_listings')
        .update({
          verification_status: 'verified',
          is_verified: true
        })
        .eq('id', domainId);
      
      if (domainError) throw domainError;
      
      toast.success('Domain verification approved');
      return { success: true };
    } catch (error) {
      console.error('Error approving verification:', error);
      toast.error('Failed to approve verification');
      throw error;
    }
  };

  // Reject verification
  const rejectVerification = async ({ id, domainId }: { id: string, domainId: string }) => {
    try {
      // Update the verification status
      const { error: verificationError } = await supabase
        .from('domain_verifications')
        .update({ status: 'rejected' })
        .eq('id', id);
      
      if (verificationError) throw verificationError;
      
      // Update the domain listing status
      const { error: domainError } = await supabase
        .from('domain_listings')
        .update({
          verification_status: 'rejected'
        })
        .eq('id', domainId);
      
      if (domainError) throw domainError;
      
      toast.success('Domain verification rejected');
      return { success: true };
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error('Failed to reject verification');
      throw error;
    }
  };

  const pendingVerificationsQuery = useQuery({
    queryKey: ['pending-verifications'],
    queryFn: fetchPendingVerifications,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, domainId }: { id: string, domainId: string }) => 
      approveVerification({ id, domainId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-verifications'] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, domainId }: { id: string, domainId: string }) => 
      rejectVerification({ id, domainId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-verifications'] });
    }
  });
  
  return {
    fetchPendingVerifications,
    approveVerification,
    rejectVerification,
    pendingVerifications: pendingVerificationsQuery.data || [],
    isLoading: pendingVerificationsQuery.isLoading,
    isError: pendingVerificationsQuery.isError,
    error: pendingVerificationsQuery.error,
    refetch: pendingVerificationsQuery.refetch,
    approveMutation,
    rejectMutation
  };
};
