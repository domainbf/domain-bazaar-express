
import { supabase } from "@/integrations/supabase/client";
import { DomainVerification, VerificationResult } from "@/types/domain";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { 
  generateVerificationToken, 
  checkDNSPropagation,
  checkFileAccessibility,
  checkMetaTag,
  checkWhoisInfo,
  sendVerificationEmail,
  formatDomainName
} from './utils';

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
      const formattedDomain = formatDomainName(domainName);
      
      let verificationData;
      
      if (verificationMethod === 'dns') { 
        verificationData = { 
          recordType: 'TXT', 
          recordName: `_domainverify.${formattedDomain}`,
          recordValue: `verify-domain=${verificationToken}`
        };
      } else if (verificationMethod === 'file') {
        verificationData = {
          fileLocation: `/.well-known/domain-verification.txt`,
          fileContent: `verify-domain=${verificationToken}`
        };
      } else if (verificationMethod === 'html') {
        verificationData = {
          metaTagName: "domain-verification",
          metaTagValue: verificationToken,
          metaTagContent: `<meta name="domain-verification" content="${verificationToken}">`
        };
      } else if (verificationMethod === 'whois') {
        verificationData = {
          tokenValue: verificationToken,
          instructionText: '请将此验证码添加到域名WHOIS信息的备注中'
        };
      } else if (verificationMethod === 'email') {
        // 获取当前域名关联的邮箱地址
        const { data: domainData, error: domainError } = await supabase
          .from('domain_listings')
          .select('admin_email, name')
          .eq('id', domainId)
          .single();
        
        if (domainError) throw domainError;
        
        const adminEmail = domainData?.admin_email || `admin@${formattedDomain}`;
        
        verificationData = {
          adminEmail: adminEmail,
          tokenValue: verificationToken,
          emailSent: false
        };
        
        // 发送验证邮件
        const emailSent = await sendVerificationEmail(adminEmail, formattedDomain, verificationToken);
        verificationData.emailSent = emailSent;
        
        if (!emailSent) {
          toast.error(`无法发送验证邮件到 ${adminEmail}`);
        }
      } else {
        throw new Error('无效的验证方式');
      }
      
      // 设置验证过期时间
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // 给予7天完成验证
      
      // 首先检查是否有正在进行的验证
      const { data: existingVerifications, error: fetchError } = await supabase
        .from('domain_verifications')
        .select('id, status')
        .eq('domain_id', domainId)
        .eq('status', 'pending');
      
      if (fetchError) throw fetchError;
      
      // 如果有正在进行的验证，则先删除它们
      if (existingVerifications && existingVerifications.length > 0) {
        const { error: deleteError } = await supabase
          .from('domain_verifications')
          .delete()
          .in('id', existingVerifications.map(v => v.id));
        
        if (deleteError) throw deleteError;
      }
      
      // 创建新的验证记录
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
      
      // 更新域名列表中的验证状态
      await supabase
        .from('domain_listings')
        .update({ verification_status: 'pending' })
        .eq('id', domainId);
      
      // 如果用户可用，添加一个通知
      if (user?.id) {
        try {
          await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              title: '域名验证已开始',
              message: `您的域名 ${formattedDomain} 验证流程已启动，请按照提示完成验证。`,
              type: 'verification',
              related_id: domainId,
              action_url: `/domain-verification/${domainId}`
            });
        } catch (notifyError) {
          console.error('创建通知失败:', notifyError);
          // 通知失败不应阻止验证流程
        }
      }
      
      return data[0] as unknown as DomainVerification;
    } catch (error: any) {
      console.error('Error starting verification:', error);
      toast.error(error.message || '启动域名验证流程失败');
      return null;
    }
  };

  /**
   * 执行DNS验证检查
   */
  const performDNSVerification = async (domainName: string, verificationData: any): Promise<VerificationResult> => {
    try {
      console.log('Performing DNS verification for:', domainName);
      
      // 在实际应用中，这里需要用真实的DNS查询
      // 调用DNS API或使用DNS库来查询特定的TXT记录
      const isDnsPropagated = await checkDNSPropagation(
        domainName,
        'TXT',
        verificationData.recordValue
      );
      
      if (isDnsPropagated) {
        return {
          success: true,
          message: 'DNS记录验证成功',
          timestamp: new Date().toISOString(),
          status: 'verified'
        };
      } else {
        return {
          success: false,
          message: '未找到指定的DNS记录或记录值不匹配',
          timestamp: new Date().toISOString(),
          status: 'failed'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'DNS验证过程中出现错误',
        timestamp: new Date().toISOString(),
        status: 'failed'
      };
    }
  };
  
  /**
   * 执行文件验证检查
   */
  const performFileVerification = async (domainName: string, verificationData: any): Promise<VerificationResult> => {
    try {
      console.log('Performing file verification for:', domainName);
      // 构建要检查的URL
      const fileUrl = `https://${domainName}${verificationData.fileLocation}`;
      
      // 在实际应用中，这里需要尝试访问该文件并检查内容
      const isFileAccessible = await checkFileAccessibility(fileUrl);
      
      if (isFileAccessible) {
        return {
          success: true,
          message: '文件验证成功',
          timestamp: new Date().toISOString(),
          status: 'verified'
        };
      } else {
        return {
          success: false,
          message: '无法访问验证文件或文件内容不匹配',
          timestamp: new Date().toISOString(),
          status: 'failed'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '文件验证过程中出现错误',
        timestamp: new Date().toISOString(),
        status: 'failed'
      };
    }
  };
  
  /**
   * 执行HTML META标签验证检查
   */
  const performHTMLVerification = async (domainName: string, verificationData: any): Promise<VerificationResult> => {
    try {
      console.log('Performing HTML verification for:', domainName);
      // 构建要检查的URL
      const url = `https://${domainName}`;
      
      // 在实际应用中，这里需要尝试访问网页并检查META标签
      const isMetaTagPresent = await checkMetaTag(
        url,
        verificationData.metaTagName,
        verificationData.metaTagValue
      );
      
      if (isMetaTagPresent) {
        return {
          success: true,
          message: 'META标签验证成功',
          timestamp: new Date().toISOString(),
          status: 'verified'
        };
      } else {
        return {
          success: false,
          message: '未找到指定的META标签或标签内容不匹配',
          timestamp: new Date().toISOString(),
          status: 'failed'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'HTML验证过程中出现错误',
        timestamp: new Date().toISOString(),
        status: 'failed'
      };
    }
  };
  
  /**
   * 执行WHOIS信息验证检查
   */
  const performWHOISVerification = async (domainName: string, verificationData: any): Promise<VerificationResult> => {
    try {
      console.log('Performing WHOIS verification for:', domainName);
      
      // 在实际应用中，这里需要查询WHOIS信息
      const isTokenInWhois = await checkWhoisInfo(
        domainName,
        verificationData.tokenValue
      );
      
      if (isTokenInWhois) {
        return {
          success: true,
          message: 'WHOIS信息验证成功',
          timestamp: new Date().toISOString(),
          status: 'verified'
        };
      } else {
        return {
          success: false,
          message: '未在WHOIS信息中找到验证码',
          timestamp: new Date().toISOString(),
          status: 'failed'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'WHOIS验证过程中出现错误',
        timestamp: new Date().toISOString(),
        status: 'failed'
      };
    }
  };
  
  /**
   * 执行邮箱验证检查
   */
  const performEmailVerification = async (domainName: string, verificationData: any): Promise<VerificationResult> => {
    try {
      console.log('Performing email verification for:', domainName);
      
      // 在实际应用中，这需要检查用户是否已点击验证邮件中的链接
      // 这里我们假设验证码已被确认
      
      // 检查是否有对应的验证记录被标记为已确认
      const { data: emailVerification, error } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('token', verificationData.tokenValue)
        .eq('is_verified', true)
        .single();
      
      if (error) {
        // 如果没找到记录，则认为未验证
        return {
          success: false,
          message: '邮箱验证尚未完成，请检查您的邮箱并点击验证链接',
          timestamp: new Date().toISOString(),
          status: 'failed'
        };
      }
      
      return {
        success: true,
        message: '邮箱验证成功',
        timestamp: new Date().toISOString(),
        status: 'verified'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '邮箱验证过程中出现错误',
        timestamp: new Date().toISOString(),
        status: 'failed'
      };
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
      
      // 根据验证类型执行相应的验证检查
      let result: VerificationResult;
      
      switch (verificationData.verification_type) {
        case 'dns':
          result = await performDNSVerification(domainName, verificationData.verification_data);
          break;
        case 'file':
          result = await performFileVerification(domainName, verificationData.verification_data);
          break;
        case 'html':
          result = await performHTMLVerification(domainName, verificationData.verification_data);
          break;
        case 'whois':
          result = await performWHOISVerification(domainName, verificationData.verification_data);
          break;
        case 'email':
          result = await performEmailVerification(domainName, verificationData.verification_data);
          break;
        default:
          result = {
            success: false,
            message: '不支持的验证类型',
            timestamp: new Date().toISOString(),
            status: 'failed'
          };
      }
      
      // 更新验证状态
      if (result.success) {
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
        
        // 创建验证成功通知
        if (user?.id) {
          try {
            await supabase
              .from('notifications')
              .insert({
                user_id: user.id,
                title: '域名验证成功',
                message: `您的域名 ${domainName} 已成功验证所有权！`,
                type: 'verification',
                related_id: domainId,
                action_url: `/domain/${domainName}`
              });
          } catch (notifyError) {
            console.error('创建通知失败:', notifyError);
            // 通知失败不应阻止验证成功
          }
        }
        
        toast.success(result.message || '验证成功');
        return true;
      } else {
        toast.error(result.message || '验证失败，请确认您已正确设置验证信息');
        return false;
      }
    } catch (error: any) {
      console.error('Error checking verification:', error);
      toast.error(error.message || '验证检查失败');
      return false;
    }
  };

  /**
   * 重新发送验证邮件
   */
  const resendVerificationEmail = async (verificationId: string): Promise<boolean> => {
    try {
      const { data: verification, error } = await supabase
        .from('domain_verifications')
        .select('verification_data, domain_id')
        .eq('id', verificationId)
        .single();
      
      if (error) throw error;
      
      if (verification.verification_type !== 'email') {
        throw new Error('此验证不是邮箱验证类型');
      }
      
      const { data: domain, error: domainError } = await supabase
        .from('domain_listings')
        .select('name')
        .eq('id', verification.domain_id)
        .single();
      
      if (domainError) throw domainError;
      
      // 重新发送验证邮件
      const emailSent = await sendVerificationEmail(
        verification.verification_data.adminEmail,
        domain.name,
        verification.verification_data.tokenValue
      );
      
      if (emailSent) {
        toast.success('验证邮件已重新发送');
        
        // 更新验证数据
        await supabase
          .from('domain_verifications')
          .update({
            verification_data: {
              ...verification.verification_data,
              emailSent: true,
              lastSent: new Date().toISOString()
            },
            last_checked: new Date().toISOString()
          })
          .eq('id', verificationId);
          
        return true;
      } else {
        toast.error('发送验证邮件失败');
        return false;
      }
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      toast.error(error.message || '重新发送验证邮件失败');
      return false;
    }
  };

  return {
    startVerification,
    checkVerification,
    resendVerificationEmail
  };
};
