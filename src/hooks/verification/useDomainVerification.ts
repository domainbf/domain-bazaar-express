
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Domain, DomainVerification } from '@/types/domain';
import { useVerificationService } from './useVerificationService';
import { useIsMobile } from "@/hooks/use-mobile";

export const useDomainVerification = (domainId?: string) => {
  const [domain, setDomain] = useState<Domain | null>(null);
  const [verification, setVerification] = useState<DomainVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { startVerification, checkVerification } = useVerificationService();
  const isMobile = useIsMobile();

  const loadDomainAndVerification = async () => {
    if (!domainId) return;
    
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
        .select('id, domain_id, verification_type, status, verification_data, created_at, updated_at, verification_method, last_checked, verification_attempts, expiry_date')
        .eq('domain_id', domainId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (verificationError) throw verificationError;
      
      if (verificationData && verificationData.length > 0) {
        setVerification(verificationData[0] as DomainVerification);
      } else {
        setVerification(null);
      }
    } catch (error: any) {
      console.error('Error loading domain verification:', error);
      toast.error(error.message || '加载域名验证详情失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartVerification = async (verificationMethod: string) => {
    if (!domain || !domainId) return;
    
    // Optimize verification method based on mobile status if not explicitly selected
    if (verificationMethod === 'auto') {
      verificationMethod = isMobile ? 'html' : 'dns';
    }
    
    const newVerification = await startVerification(domainId, domain.name || '', verificationMethod);
    
    if (newVerification) {
      setVerification(newVerification);
      toast.success('验证流程已启动。请按照说明验证您的域名。');
    }
  };

  const handleCheckVerification = async () => {
    if (!verification || !domainId) return false;
    
    toast.info('正在检查域名验证状态...');
    
    const success = await checkVerification(verification.id, domainId);
    
    if (success) {
      toast.success('域名验证成功！');
      await loadDomainAndVerification();
      return true;
    }
    
    return false;
  };

  return {
    domain,
    verification,
    isLoading,
    loadDomainAndVerification,
    handleStartVerification,
    handleCheckVerification
  };
};
