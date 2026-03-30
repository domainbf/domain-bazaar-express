
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, AlertTriangle, Link } from 'lucide-react';
import { Domain } from '@/types/domain';
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from 'react-i18next';

interface VerificationStatusProps {
  domain: Domain;
}

export const VerificationStatus = ({ domain }: VerificationStatusProps) => {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  
  if (domain.verification_status === 'verified') {
    return (
      <Alert className={`mb-8 bg-green-500/10 border-green-500/30 ${isMobile ? 'text-sm' : ''}`}>
        <Check className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-green-600`} />
        <AlertTitle className="text-green-600">{t('verification.status.verified')}</AlertTitle>
        <AlertDescription className="text-green-700">
          {t('verification.status.verifiedDescription')}
        </AlertDescription>
      </Alert>
    );
  }

  if (domain.verification_status === 'pending') {
    return (
      <Alert className={`mb-8 bg-yellow-500/10 border-yellow-500/30 ${isMobile ? 'text-sm' : ''}`}>
        <AlertTriangle className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-yellow-600`} />
        <AlertTitle className="text-yellow-600">{t('verification.status.pending')}</AlertTitle>
        <AlertDescription className="text-yellow-700">
          {t('verification.status.pendingDescription')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className={`mb-8 ${isMobile ? 'text-sm' : ''}`}>
      <Link className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
      <AlertTitle>{t('verification.status.unverified')}</AlertTitle>
      <AlertDescription>
        {t('verification.status.unverifiedDescription')}
      </AlertDescription>
    </Alert>
  );
};
