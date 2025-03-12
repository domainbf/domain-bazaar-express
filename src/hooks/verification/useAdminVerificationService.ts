
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DomainVerification } from "@/types/domain";

export const useAdminVerificationService = () => {
  const queryClient = useQueryClient();

  const fetchPendingVerifications = async (): Promise<DomainVerification[]> => {
    try {
      const { data: verifications, error } = await supabase
        .from('domain_verifications')
        .select(`
          *,
          domain_listings:domain_id (
            name,
            owner_id
          )
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

  const approveVerification = async ({ id }: { id: string }) => {
    try {
      const { error: verificationError } = await supabase
        .from('domain_verifications')
        .update({ status: 'verified' })
        .eq('id', id);
      
      if (verificationError) throw verificationError;
      
      // Get the domain_id from the verification
      const { data: verification } = await supabase
        .from('domain_verifications')
        .select('domain_id')
        .eq('id', id)
        .single();
      
      if (verification) {
        const { error: domainError } = await supabase
          .from('domain_listings')
          .update({
            verification_status: 'verified',
            is_verified: true
          })
          .eq('id', verification.domain_id);
        
        if (domainError) throw domainError;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error approving verification:', error);
      throw error;
    }
  };

  const rejectVerification = async ({ id }: { id: string }) => {
    try {
      const { error: verificationError } = await supabase
        .from('domain_verifications')
        .update({ status: 'rejected' })
        .eq('id', id);
      
      if (verificationError) throw verificationError;
      
      // Get the domain_id from the verification
      const { data: verification } = await supabase
        .from('domain_verifications')
        .select('domain_id')
        .eq('id', id)
        .single();
      
      if (verification) {
        const { error: domainError } = await supabase
          .from('domain_listings')
          .update({
            verification_status: 'rejected'
          })
          .eq('id', verification.domain_id);
        
        if (domainError) throw domainError;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error rejecting verification:', error);
      throw error;
    }
  };

  return {
    fetchPendingVerifications,
    approveVerification,
    rejectVerification,
  };
};
