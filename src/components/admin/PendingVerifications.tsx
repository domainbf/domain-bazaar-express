
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { DomainVerification } from '@/types/domain';
import { Button } from "@/components/ui/button";
import { VerificationCard } from './verification/VerificationCard';
import { fetchPendingVerifications, approveVerification, rejectVerification } from './verification/VerificationService';

export const PendingVerifications = () => {
  const [verifications, setVerifications] = useState<DomainVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPendingVerifications();
  }, []);

  const loadPendingVerifications = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPendingVerifications();
      setVerifications(data);
    } catch (error: any) {
      console.error('Error loading pending verifications:', error);
      toast.error(error.message || 'Failed to load pending verifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveVerification = async (id: string, domainId: string) => {
    try {
      await approveVerification(id, domainId);
      toast.success('Domain verification approved');
      loadPendingVerifications();
    } catch (error: any) {
      console.error('Error approving verification:', error);
      toast.error(error.message || 'Failed to approve verification');
    }
  };

  const handleRejectVerification = async (id: string, domainId: string) => {
    try {
      await rejectVerification(id, domainId);
      toast.success('Domain verification rejected');
      loadPendingVerifications();
    } catch (error: any) {
      console.error('Error rejecting verification:', error);
      toast.error(error.message || 'Failed to reject verification');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (verifications.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600 mb-4">No pending verifications</p>
        <Button variant="outline" onClick={loadPendingVerifications}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Pending Domain Verifications</h2>
        <Button size="sm" variant="outline" onClick={loadPendingVerifications}>
          Refresh
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-4 border-b">Domain</th>
              <th className="text-left p-4 border-b">Type</th>
              <th className="text-left p-4 border-b">Submitted</th>
              <th className="text-left p-4 border-b">Verification Data</th>
              <th className="text-left p-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {verifications.map((verification) => (
              <VerificationCard 
                key={verification.id}
                verification={verification}
                onApprove={handleApproveVerification}
                onReject={handleRejectVerification}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
