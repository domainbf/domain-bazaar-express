
import { supabase } from "@/integrations/supabase/client";
import { DomainVerification } from "@/types/domain";
import { toast } from "sonner";

export const useVerificationService = () => {
  const startVerification = async (domainId: string, domainName: string, verificationMethod: string) => {
    try {
      const verificationToken = Math.random().toString(36).substring(2, 15);
      
      const verificationData = verificationMethod === 'dns' 
        ? { 
            recordType: 'TXT', 
            recordName: `_domainverify.${domainName}`,
            recordValue: `verify-domain=${verificationToken}`
          }
        : {
            fileLocation: `/.well-known/domain-verification.txt`,
            fileContent: `verify-domain=${verificationToken}`
          };
      
      const { data, error } = await supabase
        .from('domain_verifications')
        .insert({
          domain_id: domainId,
          verification_type: verificationMethod,
          status: 'pending',
          verification_data: verificationData
        })
        .select();
      
      if (error) throw error;
      
      return data[0] as DomainVerification;
    } catch (error: any) {
      console.error('Error starting verification:', error);
      toast.error(error.message || 'Failed to start domain verification process');
      return null;
    }
  };

  const checkVerification = async (verificationId: string, domainId: string) => {
    try {
      // Simulate verification check (in a real app, this would actually check DNS or file)
      // For demo purposes, we'll just update the status
      const { error } = await supabase
        .from('domain_verifications')
        .update({ status: 'verified' })
        .eq('id', verificationId);
      
      if (error) throw error;
      
      // Also update the domain listing
      const { error: domainError } = await supabase
        .from('domain_listings')
        .update({ 
          verification_status: 'verified',
          is_verified: true
        })
        .eq('id', domainId);
      
      if (domainError) throw domainError;
      
      return true;
    } catch (error: any) {
      console.error('Error checking verification:', error);
      toast.error(error.message || 'Failed to check verification status');
      return false;
    }
  };

  return {
    startVerification,
    checkVerification
  };
};
