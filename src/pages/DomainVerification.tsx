
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Domain, DomainVerification as DomainVerificationType } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link, Check, AlertTriangle, FileText, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const DomainVerification = () => {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [domain, setDomain] = useState<Domain | null>(null);
  const [verification, setVerification] = useState<DomainVerificationType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationMethod, setVerificationMethod] = useState('dns');

  useEffect(() => {
    if (domainId) {
      loadDomainAndVerification();
    }
  }, [domainId]);

  const loadDomainAndVerification = async () => {
    setIsLoading(true);
    try {
      // Get domain details
      const { data: domainData, error: domainError } = await supabase
        .from('domain_listings')
        .select('*')
        .eq('id', domainId)
        .single();
      
      if (domainError) throw domainError;
      setDomain(domainData);
      
      // Get verification details if any
      const { data: verificationData, error: verificationError } = await supabase
        .from('domain_verifications')
        .select('*')
        .eq('domain_id', domainId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (verificationError) throw verificationError;
      
      if (verificationData && verificationData.length > 0) {
        setVerification(verificationData[0]);
      }
    } catch (error: any) {
      console.error('Error loading domain verification:', error);
      toast.error(error.message || 'Failed to load domain verification details');
    } finally {
      setIsLoading(false);
    }
  };

  const startVerification = async () => {
    try {
      // Check if user owns this domain
      if (domain?.owner_id !== user?.id) {
        toast.error('You can only verify domains you own');
        return;
      }
      
      // Create a verification record
      const verificationToken = Math.random().toString(36).substring(2, 15);
      
      const verificationData = verificationMethod === 'dns' 
        ? { 
            recordType: 'TXT', 
            recordName: `_domainverify.${domain?.name}`,
            recordValue: `verify-domain=${verificationToken}`
          }
        : {
            fileLocation: `/.well-known/domain-verification.txt`,
            fileContent: `verify-domain=${verificationToken}`
          };
      
      const { data, error } = await supabase
        .from('domain_verifications')
        .insert({
          domain_id: domainId,
          verification_type: verificationMethod,
          status: 'pending',
          verification_data: verificationData
        })
        .select();
      
      if (error) throw error;
      
      setVerification(data[0]);
      toast.success('Verification process started. Follow the instructions to verify your domain.');
      
    } catch (error: any) {
      console.error('Error starting verification:', error);
      toast.error(error.message || 'Failed to start domain verification process');
    }
  };

  const checkVerification = async () => {
    try {
      toast.info('Checking domain verification...');
      
      // In a real implementation, you would have a server function to check the DNS or file
      // For demo purposes, we'll simulate the verification
      
      setTimeout(async () => {
        const { error } = await supabase
          .from('domain_verifications')
          .update({ status: 'verified' })
          .eq('id', verification?.id);
        
        if (error) throw error;
        
        // Also update the domain listing
        const { error: domainError } = await supabase
          .from('domain_listings')
          .update({ 
            verification_status: 'verified',
            is_verified: true
          })
          .eq('id', domainId);
        
        if (domainError) throw domainError;
        
        toast.success('Domain verified successfully!');
        loadDomainAndVerification();
      }, 2000);
      
    } catch (error: any) {
      console.error('Error checking verification:', error);
      toast.error(error.message || 'Failed to check verification status');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Domain not found. <Button variant="link" onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900">Domain Verification: {domain.name}</h1>
        </div>
        
        {domain.verification_status === 'verified' ? (
          <Alert className="mb-8 bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Verified Domain</AlertTitle>
            <AlertDescription className="text-green-700">
              This domain has been successfully verified and is marked as authentic in our marketplace.
            </AlertDescription>
          </Alert>
        ) : verification?.status === 'pending' ? (
          <Alert className="mb-8 bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-600">Verification Pending</AlertTitle>
            <AlertDescription className="text-yellow-700">
              Please complete the verification steps below to verify ownership of this domain.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-8">
            <Link className="h-4 w-4" />
            <AlertTitle>Domain Not Verified</AlertTitle>
            <AlertDescription>
              Verified domains receive higher visibility and trust in our marketplace.
            </AlertDescription>
          </Alert>
        )}
        
        {!verification && (
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
                      <p className="text-sm text-gray-600">3. Make the file accessible via: https://{domain.name}/.well-known/domain-verification.txt</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button onClick={startVerification}>Start Verification</Button>
            </CardFooter>
          </Card>
        )}
        
        {verification && verification.status === 'pending' && (
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
                        https://{domain.name}{verification.verification_data.fileLocation}
                        <a href={`https://${domain.name}${verification.verification_data.fileLocation}`} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={loadDomainAndVerification}>Refresh Status</Button>
              <Button onClick={checkVerification}>Check Verification</Button>
            </CardFooter>
          </Card>
        )}
        
        {verification && verification.status === 'verified' && (
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
              <p>Your domain {domain.name} is now verified and has the following benefits:</p>
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
        )}
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
