
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { DomainVerification } from "@/types/domain";
import { fetchPendingVerifications, approveVerification, rejectVerification } from "@/components/admin/verification/VerificationService";

export const useAdminVerificationService = () => {
  const pendingVerificationsQuery = useQuery({
    queryKey: ['pending-verifications'],
    queryFn: fetchPendingVerifications,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, domainId }: { id: string, domainId: string }) => 
      approveVerification(id, domainId),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, domainId }: { id: string, domainId: string }) => 
      rejectVerification(id, domainId),
  });
  
  return {
    fetchPendingVerifications,
    approveVerification,
    rejectVerification,
    pendingVerifications: pendingVerificationsQuery.data || [],
    isLoading: pendingVerificationsQuery.isLoading,
    isError: pendingVerificationsQuery.isError,
    error: pendingVerificationsQuery.error,
    refetch: pendingVerificationsQuery.refetch
  };
};
