
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  const navigate = useNavigate();
  const [accessDenied, setAccessDenied] = useState(false);
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

  // 检查用户权限
  useEffect(() => {
    if (domain && user) {
      if (domain.owner_id !== user.id) {
        setAccessDenied(true);
        toast.error('您只能验证自己的域名');
        setTimeout(() => {
          navigate('/marketplace');
        }, 2000);
      }
    }
  }, [domain, user, navigate]);

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }

    if (!domain) {
      return <DomainNotFound />;
    }

    if (accessDenied) {
      return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-600 mb-4">访问被拒绝</h2>
          <p className="text-gray-600 mb-4">您只能验证自己的域名</p>
          <p className="text-sm text-gray-500">正在跳转到市场页面...</p>
        </div>
      );
    }

    return (
      <>
        <DomainHeader domainName={domain?.name} />
        
        <VerificationStatus domain={domain} />
        
        {!verification && (
          <VerificationOptions onStartVerification={(method) => {
            if (domain.owner_id !== user?.id) {
              toast.error('您只能验证自己的域名');
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
