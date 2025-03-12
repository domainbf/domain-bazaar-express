
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DomainVerification } from "@/types/domain";

export const useAdminVerificationService = () => {
  const queryClient = useQueryClient();

  const fetchPendingVerifications = async (): Promise<DomainVerification[]> => {
    try {
      // First, fetch the domain verifications
      const { data: verifications, error } = await supabase
        .from('domain_verifications')
        .select(`
          *
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Then, for each verification, fetch the associated domain listing
      if (verifications && verifications.length > 0) {
        const enrichedVerifications = await Promise.all(
          verifications.map(async (verification) => {
            const { data: domainListing, error: domainError } = await supabase
              .from('domain_listings')
              .select('name, owner_id')
              .eq('id', verification.domain_id)
              .single();
            
            if (domainError) {
              console.error('Error fetching domain listing:', domainError);
              // Return verification with empty domain_listings if there's an error
              return {
                ...verification,
                domain_listings: { name: 'Unknown', owner_id: null }
              };
            }
            
            return {
              ...verification,
              domain_listings: domainListing
            };
          })
        );
        
        return enrichedVerifications as DomainVerification[];
      }
      
      return verifications || [];
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      throw error;
    }
  };

  const approveVerification = async (id: string) => {
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

  const rejectVerification = async (id: string) => {
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
