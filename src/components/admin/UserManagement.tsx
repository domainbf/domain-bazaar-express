
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Check, Shield } from 'lucide-react';

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
      // Join profiles with auth.users to get email
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // For a real implementation, you would need to use a server function to join with auth.users

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

  const filteredUsers = searchQuery
    ? users.filter(user => 
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

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

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-4 border-b">User</th>
              <th className="text-left p-4 border-b">Email</th>
              <th className="text-left p-4 border-b">Status</th>
              <th className="text-left p-4 border-b">Joined</th>
              <th className="text-left p-4 border-b">Sales</th>
              <th className="text-left p-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.username || 'User'} 
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        {(user.username || user.full_name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{user.full_name || 'Unnamed User'}</div>
                      {user.username && <div className="text-sm text-gray-500">@{user.username}</div>}
                    </div>
                  </div>
                </td>
                <td className="p-4">{user.email || 'N/A'}</td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    {user.is_seller && (
                      <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                        Seller
                      </span>
                    )}
                    {user.seller_verified && (
                      <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">
                        <Check className="h-3 w-3 mr-1" />
                        Verified
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="p-4">
                  {user.total_sales || 0}
                </td>
                <td className="p-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!user.seller_verified && user.is_seller && (
                        <DropdownMenuItem onClick={() => verifyUser(user.id)}>
                          Verify Seller
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => toggleSellerStatus(user.id, user.is_seller || false)}>
                        {user.is_seller ? 'Remove Seller Status' : 'Grant Seller Status'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No users found</p>
        </div>
      )}
    </div>
  );
};
