
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserTable } from "./user/UserTable";
import { UserHeader } from './user/UserHeader';
import { UserFilters } from './user/UserFilters';
import { useUserActions, UserProfile } from './user/UserActions';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { verifyUser, toggleSellerStatus } = useUserActions();
  const { t } = useTranslation();

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
      toast.error(t('admin.users.loadError', 'Failed to load users'));
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
      toast.success(t('admin.users.verifySuccess', 'User successfully verified'));
    }
  };

  const handleToggleSellerStatus = async (userId: string, currentStatus: boolean) => {
    const success = await toggleSellerStatus(userId, currentStatus);
    if (success) {
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_seller: !currentStatus } : user
      ));
      const message = !currentStatus 
        ? t('admin.users.sellerEnabled', 'Seller status enabled') 
        : t('admin.users.sellerDisabled', 'Seller status disabled');
      toast.success(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const filteredUsers = searchQuery
    ? users.filter(user =>
        (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.id && user.id.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : users;

  return (
    <div className="space-y-6">
      <UserHeader onRefresh={loadUsers} />
      <UserFilters 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
      />
      <UserTable 
        users={filteredUsers}
        searchQuery={searchQuery}
        onVerifyUser={handleVerifyUser}
        onToggleSellerStatus={handleToggleSellerStatus}
      />
    </div>
  );
};
