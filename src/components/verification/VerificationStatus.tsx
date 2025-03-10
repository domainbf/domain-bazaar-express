
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, AlertTriangle, Link } from 'lucide-react';
import { Domain } from '@/types/domain';

interface VerificationStatusProps {
  domain: Domain;
}

export const VerificationStatus = ({ domain }: VerificationStatusProps) => {
  if (domain.verification_status === 'verified') {
    return (
      <Alert className="mb-8 bg-green-50 border-green-200">
        <Check className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-600">Verified Domain</AlertTitle>
        <AlertDescription className="text-green-700">
          This domain has been successfully verified and is marked as authentic in our marketplace.
        </AlertDescription>
      </Alert>
    );
  }

  if (domain.verification_status === 'pending') {
    return (
      <Alert className="mb-8 bg-yellow-50 border-yellow-200">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-600">Verification Pending</AlertTitle>
        <AlertDescription className="text-yellow-700">
          Please complete the verification steps below to verify ownership of this domain.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-8">
      <Link className="h-4 w-4" />
      <AlertTitle>Domain Not Verified</AlertTitle>
      <AlertDescription>
        Verified domains receive higher visibility and trust in our marketplace.
      </AlertDescription>
    </Alert>
  );
};
