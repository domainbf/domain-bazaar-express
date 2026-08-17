
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
      <Alert className={`mb-8 bg-success/10 border-success/30 ${isMobile ? 'text-sm' : ''}`}>
        <Check className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-success`} />
        <AlertTitle className="text-success">{t('verification.status.verified')}</AlertTitle>
        <AlertDescription className="text-success">
          {t('verification.status.verifiedDescription')}
        </AlertDescription>
      </Alert>
    );
  }

  if (domain.verification_status === 'pending') {
    return (
      <Alert className={`mb-8 bg-warning/10 border-warning/30 ${isMobile ? 'text-sm' : ''}`}>
        <AlertTriangle className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-warning`} />
        <AlertTitle className="text-warning">{t('verification.status.pending')}</AlertTitle>
        <AlertDescription className="text-warning">
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
