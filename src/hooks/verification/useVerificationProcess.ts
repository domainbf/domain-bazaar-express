
import { supabase } from "@/integrations/supabase/client";
import { DomainVerification, VerificationResult } from "@/types/domain";
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
          metaTagContent: `<meta name="domain-verification" content="${verificationToken}">`,
          metaTagName: "domain-verification",
          metaTagValue: verificationToken
        };
      } else if (verificationMethod === 'whois') {
        verificationData = {
          tokenValue: verificationToken,
          instructionText: '请将此验证码添加到域名WHOIS信息的备注中'
        };
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
              message: `您的域名 ${domainName} 验证流程已启动，请按照提示完成验证。`,
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
      // 在实际系统中，这里会有DNS查询逻辑
      // 模拟查询DNS记录
      const simulateSuccess = Math.random() > 0.3; // 70%的成功率，仅用于演示
      
      if (simulateSuccess) {
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
      // 在实际系统中，这里会尝试访问和读取验证文件
      // 模拟文件访问
      const simulateSuccess = Math.random() > 0.3; // 70%的成功率，仅用于演示
      
      if (simulateSuccess) {
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
      // 在实际系统中，这里会尝试访问网页并检查META标签
      // 模拟网页访问和解析
      const simulateSuccess = Math.random() > 0.3; // 70%的成功率，仅用于演示
      
      if (simulateSuccess) {
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
      // 在实际系统中，这里会查询WHOIS信息
      // 模拟WHOIS查询
      const simulateSuccess = Math.random() > 0.3; // 70%的成功率，仅用于演示
      
      if (simulateSuccess) {
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

  return {
    startVerification,
    checkVerification
  };
};
