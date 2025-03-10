
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VerificationOptionsProps {
  onStartVerification: (method: string) => void;
}

export const VerificationOptions = ({ onStartVerification }: VerificationOptionsProps) => {
  const [verificationMethod, setVerificationMethod] = useState('dns');

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Verify Domain Ownership</CardTitle>
        <CardDescription>
          Verifying your domain proves you own it and increases buyer trust.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="dns" onValueChange={setVerificationMethod}>
          <TabsList className="mb-4">
            <TabsTrigger value="dns">DNS Verification</TabsTrigger>
            <TabsTrigger value="file">File Verification</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dns">
            <div className="space-y-4">
              <p>Add a TXT record to your domain's DNS settings to verify ownership.</p>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm font-medium mb-1">Once you start the verification, you'll need to add a TXT record with:</p>
                <p className="text-sm text-gray-600">Record Type: TXT</p>
                <p className="text-sm text-gray-600">Record Name: _domainverify.yourdomain.com</p>
                <p className="text-sm text-gray-600">Record Value: A verification code we'll provide</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="file">
            <div className="space-y-4">
              <p>Upload a verification file to your domain's web server.</p>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm font-medium mb-1">Once you start verification, you'll need to:</p>
                <p className="text-sm text-gray-600">1. Create a file at: /.well-known/domain-verification.txt</p>
                <p className="text-sm text-gray-600">2. Add the verification code we'll provide to the file</p>
                <p className="text-sm text-gray-600">3. Make the file accessible via your domain</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onStartVerification(verificationMethod)}>Start Verification</Button>
      </CardFooter>
    </Card>
  );
};
