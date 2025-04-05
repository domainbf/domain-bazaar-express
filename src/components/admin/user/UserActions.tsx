
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  username?: string;
  is_seller?: boolean;
  seller_verified?: boolean;
  created_at: string;
  avatar_url?: string;
  total_sales?: number;
  is_admin?: boolean;
}

export const useUserActions = () => {
  const verifyUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          seller_verified: true,
          verification_status: 'verified'
        })
        .eq('id', userId);
      
      if (error) throw error;
      toast.success('用户已成功验证');
      return true;
    } catch (error: any) {
      console.error('验证用户时出错:', error);
      toast.error(error.message || '验证用户失败');
      return false;
    }
  };

  const toggleSellerStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_seller: !currentStatus })
        .eq('id', userId);
      
      if (error) throw error;
      
      const action = !currentStatus ? '授予' : '撤销';
      toast.success(`已${action}用户的卖家身份`);
      return true;
    } catch (error: any) {
      console.error('更改卖家状态时出错:', error);
      toast.error(error.message || '更新用户失败');
      return false;
    }
  };
  
  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);
      
      if (error) throw error;
      
      const action = !currentStatus ? '授予' : '撤销';
      toast.success(`已${action}用户的管理员权限`);
      return true;
    } catch (error: any) {
      console.error('更改管理员状态时出错:', error);
      toast.error(error.message || '更新用户失败');
      return false;
    }
  };
  
  const deleteUser = async (userId: string) => {
    try {
      // First check if this user has any domains
      const { data: domains, error: domainsError } = await supabase
        .from('domain_listings')
        .select('id')
        .eq('owner_id', userId);
        
      if (domainsError) throw domainsError;
      
      if (domains && domains.length > 0) {
        toast.error(`无法删除用户：此用户拥有 ${domains.length} 个域名。请先删除或转移这些域名。`);
        return false;
      }
      
      // Then delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
        
      if (profileError) throw profileError;
      
      // Finally delete the user (if you have permission to do so)
      const { error: userError } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'delete_user',
          user_id: userId
        }
      });
      
      if (userError) {
        throw userError;
      }
      
      toast.success('用户已成功删除');
      return true;
    } catch (error: any) {
      console.error('删除用户时出错:', error);
      toast.error(error.message || '删除用户失败');
      return false;
    }
  };

  return {
    verifyUser,
    toggleSellerStatus,
    toggleAdminStatus,
    deleteUser
  };
};
