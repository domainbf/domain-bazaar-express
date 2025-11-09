
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface VerificationSuccessProps {
  domainName: string;
}

export const VerificationSuccess = ({ domainName }: VerificationSuccessProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <Card className="mb-8 border-green-200">
      <CardHeader className="bg-green-50">
        <div className="flex items-center gap-2">
          <Check className="h-5 w-5 text-green-600" />
          <CardTitle>{t('verification.success.title')}</CardTitle>
        </div>
        <CardDescription>
          {t('verification.success.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <p>{t('verification.success.message', { domainName })}</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>{t('verification.success.benefits.visibility')}</li>
          <li>{t('verification.success.benefits.badge')}</li>
          <li>{t('verification.success.benefits.trust')}</li>
          <li>{t('verification.success.benefits.support')}</li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          {t('verification.success.returnToDashboard')}
        </Button>
      </CardFooter>
    </Card>
  );
};
