
import { supabase } from "@/integrations/supabase/client";
import { DomainVerification, VerificationResult } from "@/types/domain";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

export const useVerificationService = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const startVerification = async (domainId: string, domainName: string, verificationMethod: string) => {
    try {
      const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      let verificationData;
      
      if (verificationMethod === 'dns') { 
        verificationData = { 
          recordType: 'TXT', 
          recordName: `_domainverify.${domainName}`,
          recordValue: `verify-domain=${verificationToken}`
        };
      } else if (verificationMethod === 'file') {
        verificationData = {
          fileLocation: `/.well-known/domain-verification.txt`,
          fileContent: `verify-domain=${verificationToken}`
        };
      } else if (verificationMethod === 'html') {
        verificationData = {
          fileLocation: `/domain-verification.html`,
          metaTagContent: `<meta name="domain-verification" content="${verificationToken}">`
        };
      } else {
        throw new Error('Invalid verification method');
      }
      
      // Set expiry for verification
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // Give 7 days to complete verification
      
      const { data, error } = await supabase
        .from('domain_verifications')
        .insert({
          domain_id: domainId,
          verification_type: verificationMethod,
          verification_method: verificationMethod,
          status: 'pending',
          verification_data: verificationData,
          user_id: user?.id,
          verification_attempts: 0,
          expiry_date: expiryDate.toISOString()
        })
        .select();
      
      if (error) throw error;
      
      return data[0] as DomainVerification;
    } catch (error: any) {
      console.error('Error starting verification:', error);
      toast.error(error.message || '启动域名验证流程失败');
      return null;
    }
  };

  const checkVerification = async (verificationId: string, domainId: string): Promise<boolean> => {
    try {
      // Update attempt counter
      const { data: verificationData, error: getError } = await supabase
        .from('domain_verifications')
        .select('verification_type, verification_data, verification_attempts, domain_id')
        .eq('id', verificationId)
        .single();
      
      if (getError) throw getError;
      
      if (!verificationData) {
        toast.error('验证记录不存在');
        return false;
      }
      
      // Increment attempt counter
      const attempts = (verificationData.verification_attempts || 0) + 1;
      
      await supabase
        .from('domain_verifications')
        .update({ 
          verification_attempts: attempts,
          last_checked: new Date().toISOString()
        })
        .eq('id', verificationId);

      // Get the domain name
      const { data: domainData, error: domainError } = await supabase
        .from('domain_listings')
        .select('name')
        .eq('id', domainId)
        .single();
      
      if (domainError) throw domainError;
      
      const domainName = domainData?.name;
      if (!domainName) {
        toast.error('域名信息不存在');
        return false;
      }
      
      let verificationResult: VerificationResult;
      
      // In a real system, this would perform actual DNS checks or file/html checks
      // For this implementation, we'll simulate the verification process
      
      // Simulate verification based on type
      // In production, this would actually check DNS records or fetch the verification file
      const success = Math.random() > 0.3; // 70% success rate for demo purposes
      
      if (success) {
        // Update verification status
        const { error: updateError } = await supabase
          .from('domain_verifications')
          .update({ 
            status: 'verified',
            last_checked: new Date().toISOString()
          })
          .eq('id', verificationId);
        
        if (updateError) throw updateError;
        
        // Also update the domain listing
        const { error: domainUpdateError } = await supabase
          .from('domain_listings')
          .update({ 
            verification_status: 'verified',
            is_verified: true
          })
          .eq('id', domainId);
        
        if (domainUpdateError) throw domainUpdateError;
        
        verificationResult = {
          success: true,
          message: '域名验证成功！',
          timestamp: new Date().toISOString(),
          status: 'verified'
        };
        
        // Send verification success email if user is available
        if (user?.email) {
          try {
            await supabase.functions.invoke('send-notification', {
              body: {
                type: 'verification_approved',
                recipient: user.email,
                data: { domain: domainName }
              }
            });
          } catch (emailError) {
            console.error('Error sending verification success email:', emailError);
            // Continue with success even if email fails
          }
        }
        
        toast.success('域名验证成功！');
        return true;
      } else {
        verificationResult = {
          success: false,
          message: '验证失败，请确认您已正确设置验证信息',
          timestamp: new Date().toISOString(),
          status: 'pending'
        };
        
        toast.error('验证失败，请确认您已正确设置验证信息');
        return false;
      }
    } catch (error: any) {
      console.error('Error checking verification:', error);
      toast.error(error.message || '验证检查失败');
      return false;
    }
  };

  const getVerificationMethods = () => {
    // Return available verification methods based on device
    return [
      {
        id: 'dns',
        name: 'DNS验证',
        description: '通过添加TXT记录验证域名所有权',
        icon: 'Shield',
        recommended: !isMobile
      },
      {
        id: 'file',
        name: '文件验证',
        description: '通过上传验证文件到网站根目录验证所有权',
        icon: 'File',
        recommended: !isMobile
      },
      {
        id: 'html',
        name: 'HTML验证',
        description: '通过在网页中添加meta标签验证所有权',
        icon: 'Code',
        recommended: isMobile
      }
    ];
  };

  return {
    startVerification,
    checkVerification,
    getVerificationMethods
  };
};
