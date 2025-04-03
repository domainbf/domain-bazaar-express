
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserTable } from "./user/UserTable";

interface UserProfile {
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

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, seller_verified: true } : user
      ));
      
      toast.success('User verified successfully');
    } catch (error: any) {
      console.error('Error verifying user:', error);
      toast.error(error.message || 'Failed to verify user');
    }
  };

  const toggleSellerStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_seller: !currentStatus })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_seller: !currentStatus } : user
      ));
      
      toast.success(`User ${!currentStatus ? 'granted' : 'revoked'} seller status`);
    } catch (error: any) {
      console.error('Error toggling seller status:', error);
      toast.error(error.message || 'Failed to update user');
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">User Management</h2>
        <Button size="sm" variant="outline" onClick={loadUsers}>
          Refresh
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        <Input 
          placeholder="Search users..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <UserTable 
        users={users}
        searchQuery={searchQuery}
        onVerifyUser={verifyUser}
        onToggleSellerStatus={toggleSellerStatus}
      />
    </div>
  );
};
