
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Domain, DomainVerification as DomainVerificationType } from '@/types/domain';
import { useAuth } from '@/contexts/AuthContext';

// Import refactored components
import { VerificationOptions } from '@/components/verification/VerificationOptions';
import { VerificationInstructions } from '@/components/verification/VerificationInstructions';
import { VerificationSuccess } from '@/components/verification/VerificationSuccess';
import { VerificationStatus } from '@/components/verification/VerificationStatus';
import { DomainHeader } from '@/components/verification/DomainHeader';
import { VerificationFooter } from '@/components/verification/VerificationFooter';
import { DomainNotFound } from '@/components/verification/DomainNotFound';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useVerificationService } from '@/hooks/verification/useVerificationService';

export const DomainVerification = () => {
  const { domainId } = useParams<{ domainId: string }>();
  const { user } = useAuth();
  const [domain, setDomain] = useState<Domain | null>(null);
  const [verification, setVerification] = useState<DomainVerificationType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { startVerification, checkVerification } = useVerificationService();

  useEffect(() => {
    if (domainId) {
      loadDomainAndVerification();
    }
  }, [domainId]);

  const loadDomainAndVerification = async () => {
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
    
    if (domain.owner_id !== user?.id) {
      toast.error('You can only verify domains you own');
      return;
    }
    
    const newVerification = await startVerification(domainId, domain.name, verificationMethod);
    
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

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }

    if (!domain) {
      return <DomainNotFound />;
    }

    return (
      <>
        <DomainHeader domainName={domain?.name} />
        
        <VerificationStatus domain={domain} />
        
        {!verification && (
          <VerificationOptions onStartVerification={handleStartVerification} />
        )}
        
        {verification && verification.status === 'pending' && (
          <VerificationInstructions 
            verification={verification}
            domainName={domain?.name || ''}
            onRefresh={loadDomainAndVerification}
            onCheck={handleCheckVerification}
          />
        )}
        
        {verification && verification.status === 'verified' && (
          <VerificationSuccess domainName={domain?.name || ''} />
        )}
        
        <VerificationFooter />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {renderContent()}
      </div>
    </div>
  );
};
