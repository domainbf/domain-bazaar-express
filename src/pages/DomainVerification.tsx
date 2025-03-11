import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Domain, DomainVerification as DomainVerificationType } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { VerificationOptions } from '@/components/verification/VerificationOptions';
import { VerificationInstructions } from '@/components/verification/VerificationInstructions';
import { VerificationSuccess } from '@/components/verification/VerificationSuccess';
import { VerificationStatus } from '@/components/verification/VerificationStatus';

export const DomainVerification = () => {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [domain, setDomain] = useState<Domain | null>(null);
  const [verification, setVerification] = useState<DomainVerificationType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const startVerification = async (verificationMethod: string) => {
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
          <h1 className="text-2xl font-bold text-gray-900">Domain Verification: {domain?.name}</h1>
        </div>
        
        <VerificationStatus domain={domain} />
        
        {!verification && (
          <VerificationOptions onStartVerification={startVerification} />
        )}
        
        {verification && verification.status === 'pending' && (
          <VerificationInstructions 
            verification={verification}
            domainName={domain?.name || ''}
            onRefresh={loadDomainAndVerification}
            onCheck={checkVerification}
          />
        )}
        
        {verification && verification.status === 'verified' && (
          <VerificationSuccess domainName={domain?.name || ''} />
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
