
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Domain, DomainVerification } from '@/types/domain';
import { useVerificationService } from './useVerificationService';

export const useDomainVerification = (domainId?: string) => {
  const [domain, setDomain] = useState<Domain | null>(null);
  const [verification, setVerification] = useState<DomainVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { startVerification, checkVerification } = useVerificationService();

  const loadDomainAndVerification = async () => {
    if (!domainId) return;
    
    setIsLoading(true);
    try {
      // Get domain details
      const { data: domainData, error: domainError } = await supabase
        .from('domain_listings')
        .select('*')
        .eq('id', domainId)
        .single();
      
      if (domainError) throw domainError;
      setDomain(domainData);
      
      // Get verification details if any
      const { data: verificationData, error: verificationError } = await supabase
        .from('domain_verifications')
        .select('*')
        .eq('domain_id', domainId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (verificationError) throw verificationError;
      
      if (verificationData && verificationData.length > 0) {
        setVerification(verificationData[0]);
      } else {
        setVerification(null);
      }
    } catch (error: any) {
      console.error('Error loading domain verification:', error);
      toast.error(error.message || 'Failed to load domain verification details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartVerification = async (verificationMethod: string) => {
    if (!domain || !domainId) return;
    
    const newVerification = await startVerification(domainId, domain.name || '', verificationMethod);
    
    if (newVerification) {
      setVerification(newVerification);
      toast.success('Verification process started. Follow the instructions to verify your domain.');
    }
  };

  const handleCheckVerification = async () => {
    if (!verification || !domainId) return;
    
    toast.info('Checking domain verification...');
    
    const success = await checkVerification(verification.id, domainId);
    
    if (success) {
      toast.success('Domain verified successfully!');
      loadDomainAndVerification();
    }
  };

  return {
    domain,
    verification,
    isLoading,
    loadDomainAndVerification,
    handleStartVerification,
    handleCheckVerification
  };
};
