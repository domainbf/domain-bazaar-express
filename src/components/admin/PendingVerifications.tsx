
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { VerificationsList } from './verification/VerificationsList';
import { EmptyState } from './verification/EmptyState';
import { HeaderSection } from './verification/HeaderSection';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAdminVerificationService } from '@/hooks/verification/useAdminVerificationService';

export const PendingVerifications = () => {
  const [verifications, setVerifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchPendingVerifications, approveVerification, rejectVerification } = useAdminVerificationService();

  useEffect(() => {
    loadPendingVerifications();
  }, []);

  const loadPendingVerifications = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPendingVerifications();
      setVerifications(data);
    } catch (error) {
      console.error('Error loading pending verifications:', error);
      toast.error(error.message || 'Failed to load pending verifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveVerification = async (id, domainId) => {
    try {
      await approveVerification(id, domainId);
      toast.success('Domain verification approved');
      loadPendingVerifications();
    } catch (error) {
      console.error('Error approving verification:', error);
      toast.error(error.message || 'Failed to approve verification');
    }
  };

  const handleRejectVerification = async (id, domainId) => {
    try {
      await rejectVerification(id, domainId);
      toast.success('Domain verification rejected');
      loadPendingVerifications();
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error(error.message || 'Failed to reject verification');
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <HeaderSection onRefresh={loadPendingVerifications} />

      {verifications.length === 0 ? (
        <EmptyState onRefresh={loadPendingVerifications} />
      ) : (
        <VerificationsList 
          verifications={verifications}
          onApprove={handleApproveVerification}
          onReject={handleRejectVerification}
        />
      )}
    </div>
  );
};
