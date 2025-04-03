
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

interface UserTableProps {
  users: UserProfile[];
  searchQuery: string;
  onVerifyUser: (userId: string) => Promise<void>;
  onToggleSellerStatus: (userId: string, currentStatus: boolean) => Promise<void>;
}

export const UserTable = ({ 
  users, 
  searchQuery, 
  onVerifyUser, 
  onToggleSellerStatus 
}: UserTableProps) => {
  const filteredUsers = searchQuery
    ? users.filter(user => 
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;
  
  return (
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
                      <DropdownMenuItem onClick={() => onVerifyUser(user.id)}>
                        Verify Seller
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onToggleSellerStatus(user.id, user.is_seller || false)}>
                      {user.is_seller ? 'Remove Seller Status' : 'Grant Seller Status'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {filteredUsers.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No users found</p>
        </div>
      )}
    </div>
  );
};
