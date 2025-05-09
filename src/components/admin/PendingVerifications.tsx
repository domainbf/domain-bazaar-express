
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { VerificationsList } from './verification/VerificationsList';
import { EmptyState } from './verification/EmptyState';
import { HeaderSection } from './verification/HeaderSection';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAdminVerificationService } from '@/hooks/verification/useAdminVerificationService';
import { useTranslation } from 'react-i18next';

export const PendingVerifications = () => {
  const [verifications, setVerifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchPendingVerifications, approveVerification, rejectVerification } = useAdminVerificationService();
  const { t } = useTranslation();

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
      toast.error(t('admin.verifications.loadError', 'Failed to load pending verifications'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveVerification = async (id) => {
    try {
      await approveVerification(id);
      toast.success(t('admin.verifications.approveSuccess', 'Domain verification approved'));
      loadPendingVerifications();
    } catch (error) {
      console.error('Error approving verification:', error);
      toast.error(t('admin.verifications.approveError', 'Failed to approve verification'));
    }
  };

  const handleRejectVerification = async (id) => {
    try {
      await rejectVerification(id);
      toast.success(t('admin.verifications.rejectSuccess', 'Domain verification rejected'));
      loadPendingVerifications();
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error(t('admin.verifications.rejectError', 'Failed to reject verification'));
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
