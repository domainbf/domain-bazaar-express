
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { toast } from "sonner";
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
import { useDomainVerification } from '@/hooks/verification/useDomainVerification';

export const DomainVerification = () => {
  const { domainId } = useParams<{ domainId: string }>();
  const { user } = useAuth();
  const { 
    domain, 
    verification, 
    isLoading, 
    loadDomainAndVerification, 
    handleStartVerification, 
    handleCheckVerification 
  } = useDomainVerification(domainId);

  useEffect(() => {
    if (domainId) {
      loadDomainAndVerification();
    }
  }, [domainId]);

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
          <VerificationOptions onStartVerification={(method) => {
            if (domain.owner_id !== user?.id) {
              toast.error('You can only verify domains you own');
              return;
            }
            handleStartVerification(method);
          }} />
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
