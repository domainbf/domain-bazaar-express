
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
      toast.success('User verified successfully');
      return true;
    } catch (error: any) {
      console.error('Error verifying user:', error);
      toast.error(error.message || 'Failed to verify user');
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
      toast.success(`User ${!currentStatus ? 'granted' : 'revoked'} seller status`);
      return true;
    } catch (error: any) {
      console.error('Error toggling seller status:', error);
      toast.error(error.message || 'Failed to update user');
      return false;
    }
  };

  return {
    verifyUser,
    toggleSellerStatus
  };
};
