
import { supabase } from "@/integrations/supabase/client";
import { DomainVerification } from "@/types/domain";
import { fetchPendingVerifications, approveVerification, rejectVerification } from "@/components/admin/verification/VerificationService";

export const useAdminVerificationService = () => {
  return {
    fetchPendingVerifications,
    approveVerification,
    rejectVerification
  };
};
