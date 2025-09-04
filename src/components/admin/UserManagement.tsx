
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserTable } from "./user/UserTable";
import { UserHeader } from './user/UserHeader';
import { UserFilters } from './user/UserFilters';
import { useUserActions, UserProfile } from './user/UserActions';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Mail, Shield, Edit, Trash2 } from 'lucide-react';

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    full_name: '',
    username: '',
    is_seller: false,
    bio: ''
  });
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

  const handleEditUser = async () => {
    if (!editingUser) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editingUser.full_name,
          username: editingUser.username,
          bio: editingUser.bio,
          is_seller: editingUser.is_seller,
          seller_verified: editingUser.seller_verified
        })
        .eq('id', editingUser.id);
      
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === editingUser.id ? editingUser : user
      ));
      toast.success('用户信息更新成功');
      setIsEditDialogOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error('更新用户失败: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定要删除此用户吗？此操作不可撤销。')) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(users.filter(user => user.id !== userId));
      toast.success('用户删除成功');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('删除用户失败: ' + error.message);
    }
  };

  const handleCreateUser = async () => {
    try {
      // 创建新用户配置
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          ...newUserForm,
          id: crypto.randomUUID() // 生成临时ID，实际应该通过auth创建
        }])
        .select();
      
      if (error) throw error;
      
      if (data && data[0]) {
        setUsers([data[0], ...users]);
        toast.success('用户创建成功');
        setIsCreateDialogOpen(false);
        setNewUserForm({ email: '', full_name: '', username: '', is_seller: false, bio: '' });
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error('创建用户失败: ' + error.message);
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">用户管理</h2>
          <p className="text-muted-foreground">管理系统用户，编辑用户信息和权限</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                新建用户
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建新用户</DialogTitle>
                <DialogDescription>填写用户基本信息</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">邮箱</label>
                  <Input
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">姓名</label>
                  <Input
                    value={newUserForm.full_name}
                    onChange={(e) => setNewUserForm({...newUserForm, full_name: e.target.value})}
                    placeholder="用户姓名"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">用户名</label>
                  <Input
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({...newUserForm, username: e.target.value})}
                    placeholder="username"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">个人简介</label>
                  <Textarea
                    value={newUserForm.bio}
                    onChange={(e) => setNewUserForm({...newUserForm, bio: e.target.value})}
                    placeholder="个人简介"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newUserForm.is_seller}
                    onChange={(e) => setNewUserForm({...newUserForm, is_seller: e.target.checked})}
                  />
                  <label className="text-sm font-medium">设为卖家</label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreateUser}>创建用户</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={loadUsers}>
            刷新数据
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">用户列表</TabsTrigger>
          <TabsTrigger value="stats">统计信息</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="搜索用户..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <Card key={user.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {user.full_name || user.username || 'Unknown User'}
                          {user.seller_verified && (
                            <Badge variant="secondary">
                              <Shield className="h-3 w-3 mr-1" />
                              已验证
                            </Badge>
                          )}
                          {user.is_seller && (
                            <Badge variant="outline">卖家</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {user.email} • 注册时间: {new Date(user.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {user.bio && (
                        <p className="text-sm text-muted-foreground">{user.bio}</p>
                      )}
                      <div className="flex gap-4 text-sm">
                        <span>总销售: {user.total_sales || 0}</span>
                        <span>用户名: {user.username || 'N/A'}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerifyUser(user.id)}
                          disabled={user.seller_verified}
                        >
                          {user.seller_verified ? '已验证' : '验证用户'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleSellerStatus(user.id, user.is_seller || false)}
                        >
                          {user.is_seller ? '取消卖家' : '设为卖家'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">总用户数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">卖家数量</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.is_seller).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">已验证用户</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.seller_verified).length}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 编辑用户对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>修改用户信息和权限</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">姓名</label>
                <Input
                  value={editingUser.full_name || ''}
                  onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">用户名</label>
                <Input
                  value={editingUser.username || ''}
                  onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">个人简介</label>
                <Textarea
                  value={editingUser.bio || ''}
                  onChange={(e) => setEditingUser({...editingUser, bio: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editingUser.is_seller || false}
                  onChange={(e) => setEditingUser({...editingUser, is_seller: e.target.checked})}
                />
                <label className="text-sm font-medium">卖家账户</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editingUser.seller_verified || false}
                  onChange={(e) => setEditingUser({...editingUser, seller_verified: e.target.checked})}
                />
                <label className="text-sm font-medium">已验证</label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditUser}>保存更改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
