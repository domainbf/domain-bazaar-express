
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserTable } from "./user/UserTable";
import { UserHeader } from './user/UserHeader';
import { UserFilters } from './user/UserFilters';
import { useUserActions, UserProfile } from './user/UserActions';

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { verifyUser, toggleSellerStatus, toggleAdminStatus, deleteUser } = useUserActions();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, username, is_seller, seller_verified, created_at, avatar_url, total_sales, is_admin')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get emails for each user
      const userIds = data?.map(profile => profile.id) || [];
      if (userIds.length > 0) {
        const { data: userData, error: userError } = await supabase.functions.invoke('admin-user-management', {
          body: { action: 'get_user_emails', user_ids: userIds }
        });
        
        if (userError) throw userError;
        
        // Merge emails with profiles
        const usersWithEmails = data?.map(profile => {
          const userInfo = userData?.users?.find((u: any) => u.id === profile.id);
          return {
            ...profile,
            email: userInfo?.email || null
          };
        });
        
        setUsers(usersWithEmails || []);
      } else {
        setUsers(data || []);
      }
    } catch (error: any) {
      console.error('加载用户时出错:', error);
      toast.error(error.message || '加载用户失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyUser = async (userId: string) => {
    const success = await verifyUser(userId);
    if (success) {
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, seller_verified: true } : user
      ));
    }
  };

  const handleToggleSellerStatus = async (userId: string, currentStatus: boolean) => {
    const success = await toggleSellerStatus(userId, currentStatus);
    if (success) {
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_seller: !currentStatus } : user
      ));
    }
  };
  
  const handleToggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    const success = await toggleAdminStatus(userId, currentStatus);
    if (success) {
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_admin: !currentStatus } : user
      ));
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    const success = await deleteUser(userId);
    if (success) {
      // Update local state
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserHeader onRefresh={loadUsers} />
      <UserFilters 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
      />
      <UserTable 
        users={users}
        searchQuery={searchQuery}
        onVerifyUser={handleVerifyUser}
        onToggleSellerStatus={handleToggleSellerStatus}
        onToggleAdminStatus={handleToggleAdminStatus}
        onDeleteUser={handleDeleteUser}
        onRefresh={loadUsers}
      />
    </div>
  );
};
