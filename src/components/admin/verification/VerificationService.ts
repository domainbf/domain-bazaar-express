
import { supabase } from '@/integrations/supabase/client';
import { DomainVerification } from '@/types/domain';

export const VerificationService = {
  async fetchPendingVerifications(): Promise<DomainVerification[]> {
    try {
      const { data: verifications, error } = await supabase
        .from('domain_verifications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
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
              return {
                ...verification,
                domain_listings: { name: 'Unknown', owner_id: null }
              } as unknown as DomainVerification;
            }
            
            return {
              ...verification,
              domain_listings: domainListing
            } as unknown as DomainVerification;
          })
        );
        
        return enrichedVerifications;
      }
      
      return (verifications || []) as unknown as DomainVerification[];
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      throw error;
    }
  },

  async approveVerification(id: string): Promise<{ success: boolean }> {
    try {
      const { error: verificationError } = await supabase
        .from('domain_verifications')
        .update({ status: 'verified' })
        .eq('id', id);
      
      if (verificationError) throw verificationError;
      
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
  },

  async rejectVerification(id: string): Promise<{ success: boolean }> {
    try {
      const { error: verificationError } = await supabase
        .from('domain_verifications')
        .update({ status: 'rejected' })
        .eq('id', id);
      
      if (verificationError) throw verificationError;
      
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
  }
};
