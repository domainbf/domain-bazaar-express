
import { DomainVerification } from '@/types/domain';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface VerificationInstructionsProps {
  verification: DomainVerification;
  domainName: string;
  onRefresh: () => void;
  onCheck: () => void;
}

export const VerificationInstructions = ({ 
  verification, 
  domainName, 
  onRefresh, 
  onCheck 
}: VerificationInstructionsProps) => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Complete Verification</CardTitle>
        <CardDescription>
          Follow these steps to verify your domain ownership
        </CardDescription>
      </CardHeader>
      <CardContent>
        {verification.verification_type === 'dns' ? (
          <div className="space-y-4">
            <p>Add the following TXT record to your domain's DNS settings:</p>
            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              <div>
                <p className="text-sm font-medium">Record Type:</p>
                <p className="text-sm font-mono bg-gray-100 p-1 rounded">TXT</p>
              </div>
              <div>
                <p className="text-sm font-medium">Record Name:</p>
                <p className="text-sm font-mono bg-gray-100 p-1 rounded">{verification.verification_data.recordName}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Record Value:</p>
                <p className="text-sm font-mono bg-gray-100 p-1 rounded">{verification.verification_data.recordValue}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">DNS changes can take up to 24-48 hours to propagate, but often happen much faster.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p>Create a verification file on your web server:</p>
            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              <div>
                <p className="text-sm font-medium">File Location:</p>
                <p className="text-sm font-mono bg-gray-100 p-1 rounded">{verification.verification_data.fileLocation}</p>
              </div>
              <div>
                <p className="text-sm font-medium">File Content:</p>
                <p className="text-sm font-mono bg-gray-100 p-1 rounded">{verification.verification_data.fileContent}</p>
              </div>
              <div>
                <p className="text-sm font-medium">File URL:</p>
                <p className="text-sm font-mono bg-gray-100 p-1 rounded flex items-center">
                  https://{domainName}{verification.verification_data.fileLocation}
                  <a href={`https://${domainName}${verification.verification_data.fileLocation}`} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onRefresh}>Refresh Status</Button>
        <Button onClick={onCheck}>Check Verification</Button>
      </CardFooter>
    </Card>
  );
};
