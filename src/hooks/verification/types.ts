
import { DomainVerification, VerificationResult } from "@/types/domain";

export interface VerificationMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  recommended: boolean;
}

export interface VerificationServiceHook {
  startVerification: (domainId: string, domainName: string, verificationMethod: string) => Promise<DomainVerification | null>;
  checkVerification: (verificationId: string, domainId: string) => Promise<boolean>;
  getVerificationMethods: () => VerificationMethod[];
  resendVerificationEmail: (verificationId: string) => Promise<boolean>;
  getVerificationStatus: (verificationId: string) => Promise<VerificationCheckResult | null>;
  getMethodIcon: (methodId: string) => any;
}

export interface VerificationCheckResult {
  success: boolean;
  message: string;
  details?: any;
}
