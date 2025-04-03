
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
  const { verifyUser, toggleSellerStatus } = useUserActions();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error(error.message || 'Failed to load users');
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
      />
    </div>
  );
};
