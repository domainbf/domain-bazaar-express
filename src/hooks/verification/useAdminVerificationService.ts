
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DomainVerification } from "@/types/domain";
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useAdminVerificationService = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const fetchPendingVerifications = useCallback(async (): Promise<DomainVerification[]> => {
    try {
      // First, fetch the domain verifications
      const { data: verifications, error } = await supabase
        .from('domain_verifications')
        .select(`
          *,
          domain_listings(id, name, owner_id, price, category)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (!verifications || verifications.length === 0) {
        return [];
      }
      
      // 增强错误处理与数据转换
      const enrichedVerifications = verifications.map(verification => {
        // 确保域名信息存在
        if (!verification.domain_listings) {
          console.warn(`Missing domain listing for verification ID: ${verification.id}`);
          return {
            ...verification,
            domain_listings: { name: 'Unknown', owner_id: null }
          };
        }
        
        return verification;
      });
      
      return enrichedVerifications as DomainVerification[];
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      throw error;
    }
  }, []);

  const approveVerification = useCallback(async (id: string) => {
    try {
      // 开始事务：获取验证记录
      const { data: verification, error: getError } = await supabase
        .from('domain_verifications')
        .select('domain_id')
        .eq('id', id)
        .single();
      
      if (getError) throw getError;
      
      if (!verification) {
        throw new Error('Verification record not found');
      }
      
      // 更新验证记录状态
      const { error: verificationError } = await supabase
        .from('domain_verifications')
        .update({ 
          status: 'verified',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (verificationError) throw verificationError;
      
      // 更新域名验证状态
      const { error: domainError } = await supabase
        .from('domain_listings')
        .update({
          verification_status: 'verified',
          is_verified: true
        })
        .eq('id', verification.domain_id);
      
      if (domainError) throw domainError;
      
      // 添加域名历史记录
      await supabase
        .from('domain_history')
        .insert({
          domain_id: verification.domain_id,
          action: 'verification_approved',
          new_status: 'verified'
        });
      
      // 创建通知给域名所有者
      const { data: domainData } = await supabase
        .from('domain_listings')
        .select('name, owner_id')
        .eq('id', verification.domain_id)
        .single();
        
      if (domainData?.owner_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: domainData.owner_id,
            title: t('notifications.verificationApproved.title', '域名验证已通过'),
            message: t('notifications.verificationApproved.message', '您的域名 {{domain}} 已通过验证，现在可以上架销售。', { domain: domainData.name }),
            type: 'verification',
            related_id: verification.domain_id,
            action_url: `/user/domains`
          });
      }
      
      return { success: true, domainId: verification.domain_id };
    } catch (error) {
      console.error('Error approving verification:', error);
      throw error;
    }
  }, [t]);

  const rejectVerification = useCallback(async (id: string) => {
    try {
      // 获取验证记录
      const { data: verification, error: getError } = await supabase
        .from('domain_verifications')
        .select('domain_id')
        .eq('id', id)
        .single();
      
      if (getError) throw getError;
      
      if (!verification) {
        throw new Error('Verification record not found');
      }
      
      // 更新验证记录状态
      const { error: verificationError } = await supabase
        .from('domain_verifications')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (verificationError) throw verificationError;
      
      // 更新域名验证状态
      const { error: domainError } = await supabase
        .from('domain_listings')
        .update({
          verification_status: 'rejected'
        })
        .eq('id', verification.domain_id);
      
      if (domainError) throw domainError;
      
      // 添加域名历史记录
      await supabase
        .from('domain_history')
        .insert({
          domain_id: verification.domain_id,
          action: 'verification_rejected',
          new_status: 'rejected'
        });
      
      // 创建通知给域名所有者
      const { data: domainData } = await supabase
        .from('domain_listings')
        .select('name, owner_id')
        .eq('id', verification.domain_id)
        .single();
        
      if (domainData?.owner_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: domainData.owner_id,
            title: t('notifications.verificationRejected.title', '域名验证被拒绝'),
            message: t('notifications.verificationRejected.message', '您的域名 {{domain}} 验证请求被拒绝，请检查域名所有权或联系平台管理员。', { domain: domainData.name }),
            type: 'verification',
            related_id: verification.domain_id,
            action_url: `/domain-verification/${verification.domain_id}`
          });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error rejecting verification:', error);
      throw error;
    }
  }, [t]);

  return {
    fetchPendingVerifications,
    approveVerification,
    rejectVerification,
  };
};
