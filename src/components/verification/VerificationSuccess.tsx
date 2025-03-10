
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VerificationSuccessProps {
  domainName: string;
}

export const VerificationSuccess = ({ domainName }: VerificationSuccessProps) => {
  const navigate = useNavigate();
  
  return (
    <Card className="mb-8 border-green-200">
      <CardHeader className="bg-green-50">
        <div className="flex items-center gap-2">
          <Check className="h-5 w-5 text-green-600" />
          <CardTitle>Domain Verified</CardTitle>
        </div>
        <CardDescription>
          Your domain has been successfully verified as authentic
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <p>Your domain {domainName} is now verified and has the following benefits:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Higher visibility in marketplace searches</li>
          <li>Verification badge shown to potential buyers</li>
          <li>Increased trust and credibility</li>
          <li>Priority support for your listings</li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </CardFooter>
    </Card>
  );
};
