
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DomainVerification, VerificationCheckResult } from '@/types/domain';
import { toast } from 'sonner';

export const useVerificationProcess = () => {
  const [isLoading, setIsLoading] = useState(false);

  const startVerification = async (domainId: string, domainName: string, verificationMethod: string): Promise<DomainVerification | null> => {
    setIsLoading(true);
    try {
      // 创建验证记录
      const { data, error } = await supabase
        .from('domain_verifications')
        .insert({
          domain_id: domainId,
          verification_method: verificationMethod,
          status: 'pending',
          verification_type: 'ownership',
          verification_data: {
            domain: domainName,
            method: verificationMethod,
            timestamp: new Date().toISOString()
          }
        })
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      return data as DomainVerification;
    } catch (error: any) {
      console.error('启动验证失败:', error);
      toast.error(error.message || '启动域名验证失败');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const checkVerification = async (verificationId: string, domainId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // 首先更新验证记录的尝试次数
      await supabase
        .from('domain_verifications')
        .update({
          verification_attempts: supabase.rpc('increment_attempts', { row_id: verificationId }),
          last_checked: new Date().toISOString()
        })
        .eq('id', verificationId);

      // 调用验证函数
      const { data: result, error } = await supabase.functions.invoke('check-domain-verification', {
        body: { 
          verificationId,
          domainId
        }
      });

      if (error) throw error;

      if (result && result.verified) {
        // 如果验证成功，更新验证记录和域名记录
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
        toast.error(result?.message || '域名验证失败，请确保您已正确设置验证信息');
        return false;
      }
    } catch (error: any) {
      console.error('验证检查失败:', error);
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
