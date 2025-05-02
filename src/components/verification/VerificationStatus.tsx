
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, AlertTriangle, Link } from 'lucide-react';
import { Domain } from '@/types/domain';
import { useIsMobile } from "@/hooks/use-mobile";

interface VerificationStatusProps {
  domain: Domain;
}

export const VerificationStatus = ({ domain }: VerificationStatusProps) => {
  const isMobile = useIsMobile();
  
  if (domain.verification_status === 'verified') {
    return (
      <Alert className={`mb-8 bg-green-50 border-green-200 ${isMobile ? 'text-sm' : ''}`}>
        <Check className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-green-600`} />
        <AlertTitle className="text-green-600">已验证域名</AlertTitle>
        <AlertDescription className="text-green-700">
          此域名已成功验证并在我们的市场中标记为可信域名。
        </AlertDescription>
      </Alert>
    );
  }

  if (domain.verification_status === 'pending') {
    return (
      <Alert className={`mb-8 bg-yellow-50 border-yellow-200 ${isMobile ? 'text-sm' : ''}`}>
        <AlertTriangle className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-yellow-600`} />
        <AlertTitle className="text-yellow-600">验证待处理</AlertTitle>
        <AlertDescription className="text-yellow-700">
          请完成以下验证步骤，以验证此域名的所有权。
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className={`mb-8 ${isMobile ? 'text-sm' : ''}`}>
      <Link className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
      <AlertTitle>未验证域名</AlertTitle>
      <AlertDescription>
        经过验证的域名在我们的市场中会获得更高的曝光率和信任度。
      </AlertDescription>
    </Alert>
  );
};
