
import { supabase } from "@/integrations/supabase/client";
import { DomainVerification } from "@/types/domain";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { generateVerificationToken } from './utils';

/**
 * 处理域名验证流程的钩子
 */
export const useVerificationProcess = () => {
  const { user } = useAuth();
  
  /**
   * 启动域名验证流程
   */
  const startVerification = async (domainId: string, domainName: string, verificationMethod: string) => {
    try {
      const verificationToken = generateVerificationToken();
      
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
      
      // 设置验证过期时间
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // 给予7天完成验证
      
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
          expiry_date: expiryDate.toISOString(),
          last_checked: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;
      
      return data[0] as unknown as DomainVerification;
    } catch (error: any) {
      console.error('Error starting verification:', error);
      toast.error(error.message || '启动域名验证流程失败');
      return null;
    }
  };

  /**
   * 检查验证状态
   */
  const checkVerification = async (verificationId: string, domainId: string): Promise<boolean> => {
    try {
      // 获取当前验证记录
      const { data: verificationData, error: getError } = await supabase
        .from('domain_verifications')
        .select('*')
        .eq('id', verificationId)
        .single();
      
      if (getError) throw getError;
      
      if (!verificationData) {
        toast.error('验证记录不存在');
        return false;
      }
      
      // 增加尝试计数
      const attempts = (verificationData.verification_attempts || 0) + 1;
      
      await supabase
        .from('domain_verifications')
        .update({ 
          verification_attempts: attempts,
          last_checked: new Date().toISOString()
        })
        .eq('id', verificationId);

      // 获取域名信息
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
      
      // 在实际系统中，这里会执行真正的DNS检查或文件/HTML检查
      // 为了演示，我们模拟验证过程
      
      // 根据类型模拟验证
      // 在生产环境中，这里会实际检查DNS记录或获取验证文件
      const success = Math.random() > 0.3; // 70%的成功率用于演示
      
      if (success) {
        // 更新验证状态
        const { error: updateError } = await supabase
          .from('domain_verifications')
          .update({ 
            status: 'verified',
            last_checked: new Date().toISOString()
          })
          .eq('id', verificationId);
        
        if (updateError) throw updateError;
        
        // 同时更新域名列表
        const { error: domainUpdateError } = await supabase
          .from('domain_listings')
          .update({ 
            verification_status: 'verified',
            is_verified: true
          })
          .eq('id', domainId);
        
        if (domainUpdateError) throw domainUpdateError;
        
        // 如果用户可用，发送验证成功电子邮件
        if (user?.email) {
          try {
            await supabase.functions.invoke('send-notification', {
              body: {
                type: 'verification_complete',
                recipient: user.email,
                data: { 
                  domain: domainName,
                  status: '已验证'
                }
              }
            });
          } catch (emailError) {
            console.error('Error sending verification success email:', emailError);
            // 即使电子邮件失败也继续成功
          }
        }
        
        return true;
      } else {
        toast.error('验证失败，请确认您已正确设置验证信息');
        return false;
      }
    } catch (error: any) {
      console.error('Error checking verification:', error);
      toast.error(error.message || '验证检查失败');
      return false;
    }
  };

  return {
    startVerification,
    checkVerification
  };
};
