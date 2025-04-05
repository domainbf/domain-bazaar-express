
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Check, Shield, Trash, UserX, Lock, Edit } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { UserProfile } from './UserActions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';

interface UserTableProps {
  users: UserProfile[];
  searchQuery: string;
  onVerifyUser: (userId: string) => Promise<void>;
  onToggleSellerStatus: (userId: string, currentStatus: boolean) => Promise<void>;
  onToggleAdminStatus: (userId: string, currentStatus: boolean) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onRefresh: () => void;
}

export const UserTable = ({ 
  users, 
  searchQuery, 
  onVerifyUser, 
  onToggleSellerStatus,
  onToggleAdminStatus,
  onDeleteUser,
  onRefresh
}: UserTableProps) => {
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { user: currentUser } = useAuth();
  
  const filteredUsers = searchQuery
    ? users.filter(user => 
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;
    
  const confirmDelete = (user: UserProfile) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (!selectedUser) return;
    
    await onDeleteUser(selectedUser.id);
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
    onRefresh();
  };
  
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-4 border-b">用户</th>
              <th className="text-left p-4 border-b">电子邮箱</th>
              <th className="text-left p-4 border-b">状态</th>
              <th className="text-left p-4 border-b">注册时间</th>
              <th className="text-left p-4 border-b">销售</th>
              <th className="text-right p-4 border-b">操作</th>
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
                      <div className="font-medium">{user.full_name || '未命名用户'}</div>
                      {user.username && <div className="text-sm text-gray-500">@{user.username}</div>}
                    </div>
                  </div>
                </td>
                <td className="p-4">{user.email || 'N/A'}</td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    {user.is_admin && (
                      <Badge variant="destructive" className="inline-flex items-center text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        管理员
                      </Badge>
                    )}
                    {user.is_seller && (
                      <Badge variant="secondary" className="inline-flex items-center text-xs">
                        卖家
                      </Badge>
                    )}
                    {user.seller_verified && (
                      <Badge variant="verified" className="inline-flex items-center text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        已验证
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="p-4">
                  {user.total_sales || 0}
                </td>
                <td className="p-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!user.seller_verified && user.is_seller && (
                        <DropdownMenuItem onClick={() => onVerifyUser(user.id)}>
                          <Check className="h-4 w-4 mr-2" />
                          验证卖家
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem onClick={() => onToggleSellerStatus(user.id, user.is_seller || false)}>
                        {user.is_seller ? (
                          <>
                            <UserX className="h-4 w-4 mr-2" />
                            撤销卖家身份
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            授予卖家身份
                          </>
                        )}
                      </DropdownMenuItem>
                      
                      {/* Don't allow changing admin status of current user or self */}
                      {currentUser?.id !== user.id && (
                        <DropdownMenuItem onClick={() => onToggleAdminStatus(user.id, user.is_admin || false)}>
                          {user.is_admin ? (
                            <>
                              <Lock className="h-4 w-4 mr-2" />
                              撤销管理员权限
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 mr-2" />
                              授予管理员权限
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem onClick={() => confirmDelete(user)}>
                        <Trash className="h-4 w-4 mr-2 text-red-500" />
                        <span className="text-red-500">删除用户</span>
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
            <p className="text-gray-600">没有找到用户</p>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除用户</DialogTitle>
          </DialogHeader>
          <p>您确定要删除用户 {selectedUser?.full_name || selectedUser?.username || selectedUser?.email || '未命名用户'} 吗？此操作不可撤销。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
