
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DomainVerification, VerificationCheckResult } from '@/types/domain';
import { toast } from 'sonner';

const generateToken = () => {
  // Generate a more secure and unique token
  const array = new Uint32Array(4);
  crypto.getRandomValues(array);
  return `domain-verification=${Array.from(array, dec => dec.toString(16).padStart(8, '0')).join('')}`;
};

export const useVerificationProcess = () => {
  const [isLoading, setIsLoading] = useState(false);

  const startVerification = async (domainId: string, domainName: string, verificationMethod: string): Promise<DomainVerification | null> => {
    setIsLoading(true);
    try {
      const token = generateToken();
      let verification_data: Record<string, any> = {};
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // Verification expires in 7 days

      switch (verificationMethod) {
        case 'dns':
          verification_data = {
            token,
            recordType: 'TXT',
            recordName: `_domainverify.${domainName.toLowerCase()}`,
            recordValue: token,
          };
          break;
        case 'file':
          verification_data = {
            token,
            fileLocation: '/.well-known/domain-verification.txt',
            fileContent: token,
          };
          break;
        case 'html':
          verification_data = {
            token,
            metaName: 'domain-verification',
          };
          break;
        case 'whois':
          verification_data = {
            token,
            tokenValue: token,
          };
          break;
        case 'email':
          verification_data = {
            token,
            adminEmail: `admin@${domainName}`, // This is a guess, real implementation might need more logic
          };
          break;
        default:
          toast.error('不支持的验证方法');
          return null;
      }

      const { data, error } = await supabase
        .from('domain_verifications')
        .insert({
          domain_id: domainId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          verification_method: verificationMethod,
          status: 'pending',
          verification_type: verificationMethod, // More specific type
          verification_data: verification_data,
          expiry_date: expiryDate.toISOString(),
        })
        .select('*')
        .single();

      if (error) throw error;

      return data as DomainVerification;
    } catch (error: any) {
      toast.error(error.message || '启动域名验证失败');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const checkVerification = async (verificationId: string, domainId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // 更新验证记录尝试次数
      const { data: verificationData } = await supabase
        .from('domain_verifications')
        .select('verification_attempts')
        .eq('id', verificationId)
        .single();
      
      const currentAttempts = verificationData?.verification_attempts || 0;
      
      await supabase
        .from('domain_verifications')
        .update({
          verification_attempts: currentAttempts + 1,
          last_checked: new Date().toISOString()
        })
        .eq('id', verificationId);

      // 调用后端真实验证，若失败建议反馈具体原因
      const { data: result, error } = await supabase.functions.invoke('check-domain-verification', {
        body: { 
          verificationId,
          domainId
        }
      });

      if (error) throw error;

      if (result && result.verified) {
        await supabase
          .from('domain_verifications')
          .update({
            status: 'verified',
          })
          .eq('id', verificationId);

        await supabase
          .from('domain_listings')
          .update({
            is_verified: true,
            verification_status: 'verified'
          })
          .eq('id', domainId);

        toast.success('域名验证成功！');
        return true;
      } else {
        // 优化失败反馈，附带详细提示
        toast.error(
          result?.message
            ? `域名验证失败：${result.message}。请根据提示检查 DNS/文件/Meta/邮箱等设置后重试。`
            : '域名验证失败，请确保您已正确设置验证信息'
        );
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || '验证检查过程中出错');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async (verificationId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: verification, error: fetchError } = await supabase
        .from('domain_verifications')
        .select('domain_id, verification_data')
        .eq('id', verificationId)
        .single();

      if (fetchError) throw fetchError;

      const { data: domain, error: domainError } = await supabase
        .from('domain_listings')
        .select('name')
        .eq('id', verification.domain_id)
        .single();

      if (domainError) throw domainError;

      const { error } = await supabase.functions.invoke('resend-verification', {
        body: { 
          verificationId,
          domainName: domain.name,
          verificationData: verification.verification_data
        }
      });

      if (error) throw error;

      toast.success('验证邮件已重新发送');
      return true;
    } catch (error: any) {
      console.error('重发验证邮件失败:', error);
      toast.error(error.message || '重发验证邮件失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getVerificationStatus = async (verificationId: string): Promise<VerificationCheckResult | null> => {
    try {
      const { data: verification, error } = await supabase
        .from('domain_verifications')
        .select('status, verification_method, domain_id, verification_data, last_checked')
        .eq('id', verificationId)
        .single();

      if (error) throw error;

      const { data: domain, error: domainError } = await supabase
        .from('domain_listings')
        .select('name')
        .eq('id', verification.domain_id)
        .single();

      if (domainError) throw domainError;

      // 检查状态
      if (verification.status === 'verified') {
        return {
          success: true,
          message: '域名已验证成功',
          details: {
            verifiedAt: verification.last_checked
          }
        };
      }

      // 查询验证状态
      const { data: result, error: checkError } = await supabase.functions.invoke('check-verification-status', {
        body: { 
          verificationId,
          domainName: domain.name,
          method: verification.verification_method,
          verificationData: verification.verification_data
        }
      });

      if (checkError) throw checkError;

      return result as VerificationCheckResult;

    } catch (error: any) {
      console.error('获取验证状态失败:', error);
      return {
        success: false,
        message: error.message || '获取验证状态失败'
      };
    }
  };

  return {
    startVerification,
    checkVerification,
    resendVerificationEmail,
    getVerificationStatus,
    isLoading
  };
};
