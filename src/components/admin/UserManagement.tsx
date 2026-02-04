import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  UserPlus, Mail, Shield, Edit, Trash2, Users, Search, RefreshCw, 
  CheckCircle, XCircle, Crown, MoreHorizontal, Download, Upload, Filter
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from 'react-i18next';

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
  bio?: string;
  is_admin?: boolean;
  role?: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    full_name: '',
    username: '',
    is_seller: false,
    bio: '',
    role: 'user'
  });
  const { t } = useTranslation();
  const itemsPerPage = 10;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // 加载用户资料 - 获取所有字段
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;

      // 加载管理员角色
      const { data: adminRoles, error: rolesError } = await supabase
        .from('admin_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error loading roles:', rolesError);
      }

      // 合并角色信息和用户邮箱
      const usersWithRoles = (profilesData || []).map(profile => {
        const userRole = adminRoles?.find(r => r.user_id === profile.id);
        // 优先使用 contact_email，因为 auth.users 表不可直接访问
        const userEmail = profile.contact_email || `用户ID: ${profile.id.slice(0, 8)}...`;
        return {
          ...profile,
          email: userEmail,
          is_admin: !!userRole,
          role: userRole?.role || 'user'
        };
      });
      
      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error('加载用户失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          seller_verified: true,
          verification_status: 'verified'
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, seller_verified: true } : user
      ));
      toast.success('用户验证成功');
    } catch (error: any) {
      toast.error('验证失败: ' + error.message);
    }
  };

  const handleToggleSellerStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_seller: !currentStatus })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_seller: !currentStatus } : user
      ));
      toast.success(!currentStatus ? '已设为卖家' : '已取消卖家资格');
    } catch (error: any) {
      toast.error('操作失败: ' + error.message);
    }
  };

  const handleSetUserRole = async (userId: string, newRole: string) => {
    setIsSaving(true);
    try {
      if (newRole === 'admin') {
        // 添加管理员角色
        const { error } = await supabase
          .from('admin_roles')
          .upsert({ 
            user_id: userId, 
            role: 'admin'
          }, { 
            onConflict: 'user_id' 
          });
        
        if (error) throw error;
      } else {
        // 移除管理员角色
        const { error } = await supabase
          .from('admin_roles')
          .delete()
          .eq('user_id', userId);
        
        if (error && error.code !== 'PGRST116') throw error;
      }
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_admin: newRole === 'admin', role: newRole } : user
      ));
      toast.success('角色更新成功');
      setIsRoleDialogOpen(false);
    } catch (error: any) {
      console.error('Error setting role:', error);
      toast.error('角色更新失败: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editingUser.full_name,
          username: editingUser.username,
          bio: editingUser.bio,
          is_seller: editingUser.is_seller,
          seller_verified: editingUser.seller_verified,
          contact_email: editingUser.email // Save the email to contact_email field
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
    } finally {
      setIsSaving(false);
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

  const handleBatchAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      toast.error('请先选择用户');
      return;
    }

    try {
      switch (action) {
        case 'verify':
          await supabase
            .from('profiles')
            .update({ seller_verified: true, verification_status: 'verified' })
            .in('id', selectedUsers);
          setUsers(users.map(user => 
            selectedUsers.includes(user.id) ? { ...user, seller_verified: true } : user
          ));
          toast.success(`已验证 ${selectedUsers.length} 个用户`);
          break;
        case 'enable_seller':
          await supabase
            .from('profiles')
            .update({ is_seller: true })
            .in('id', selectedUsers);
          setUsers(users.map(user => 
            selectedUsers.includes(user.id) ? { ...user, is_seller: true } : user
          ));
          toast.success(`已设置 ${selectedUsers.length} 个用户为卖家`);
          break;
        case 'disable_seller':
          await supabase
            .from('profiles')
            .update({ is_seller: false })
            .in('id', selectedUsers);
          setUsers(users.map(user => 
            selectedUsers.includes(user.id) ? { ...user, is_seller: false } : user
          ));
          toast.success(`已取消 ${selectedUsers.length} 个用户的卖家资格`);
          break;
        case 'delete':
          if (!confirm(`确定要删除 ${selectedUsers.length} 个用户吗？`)) return;
          await supabase
            .from('profiles')
            .delete()
            .in('id', selectedUsers);
          setUsers(users.filter(user => !selectedUsers.includes(user.id)));
          toast.success(`已删除 ${selectedUsers.length} 个用户`);
          break;
      }
      setSelectedUsers([]);
    } catch (error: any) {
      toast.error('批量操作失败: ' + error.message);
    }
  };

  const handleExportUsers = () => {
    const csvContent = [
      ['ID', '姓名', '用户名', '邮箱', '是否卖家', '是否验证', '角色', '注册时间'].join(','),
      ...filteredUsers.map(user => [
        user.id,
        user.full_name || '',
        user.username || '',
        user.email || '',
        user.is_seller ? '是' : '否',
        user.seller_verified ? '是' : '否',
        user.role || 'user',
        new Date(user.created_at).toLocaleString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('用户数据导出成功');
  };

  // 筛选用户
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.id && user.id.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = filterRole === 'all' || 
      (filterRole === 'admin' && user.is_admin) ||
      (filterRole === 'seller' && user.is_seller) ||
      (filterRole === 'user' && !user.is_admin && !user.is_seller);
    
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'verified' && user.seller_verified) ||
      (filterStatus === 'unverified' && !user.seller_verified);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // 分页
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map(u => u.id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总用户</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">卖家</p>
                <p className="text-2xl font-bold">{users.filter(u => u.is_seller).length}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已验证</p>
                <p className="text-2xl font-bold">{users.filter(u => u.seller_verified).length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">管理员</p>
                <p className="text-2xl font-bold">{users.filter(u => u.is_admin).length}</p>
              </div>
              <Crown className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 工具栏 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-1 gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索用户..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部角色</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="seller">卖家</SelectItem>
                  <SelectItem value="user">普通用户</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="verified">已验证</SelectItem>
                  <SelectItem value="unverified">未验证</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              {selectedUsers.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      批量操作 ({selectedUsers.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>选择操作</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBatchAction('verify')}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      批量验证
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBatchAction('enable_seller')}>
                      <Shield className="h-4 w-4 mr-2" />
                      设为卖家
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBatchAction('disable_seller')}>
                      <XCircle className="h-4 w-4 mr-2" />
                      取消卖家
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleBatchAction('delete')}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      批量删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button variant="outline" onClick={handleExportUsers}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <Button variant="outline" onClick={loadUsers}>
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 用户列表 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>用户</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt="" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{user.full_name || user.username || '未设置'}</p>
                        <p className="text-sm text-muted-foreground">{user.email || user.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.is_admin && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Crown className="h-3 w-3 mr-1" />
                          管理员
                        </Badge>
                      )}
                      {user.is_seller && (
                        <Badge variant="secondary">卖家</Badge>
                      )}
                      {!user.is_admin && !user.is_seller && (
                        <Badge variant="outline">普通用户</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.seller_verified ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        已验证
                      </Badge>
                    ) : (
                      <Badge variant="outline">未验证</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>用户操作</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          setEditingUser(user);
                          setIsEditDialogOpen(true);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          编辑信息
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedUserForRole(user);
                          setIsRoleDialogOpen(true);
                        }}>
                          <Crown className="h-4 w-4 mr-2" />
                          设置角色
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleVerifyUser(user.id)}
                          disabled={user.seller_verified}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          验证用户
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleToggleSellerStatus(user.id, user.is_seller || false)}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          {user.is_seller ? '取消卖家' : '设为卖家'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          删除用户
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                显示 {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} / {filteredUsers.length} 个用户
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑用户对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>修改用户信息和权限</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>用户ID</Label>
                  <Input
                    value={editingUser.id}
                    disabled
                    className="bg-muted text-xs"
                  />
                </div>
                <div>
                  <Label>联系邮箱</Label>
                  <Input
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    placeholder="用户邮箱"
                  />
                </div>
              </div>
              <div>
                <Label>姓名</Label>
                <Input
                  value={editingUser.full_name || ''}
                  onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                  placeholder="用户全名"
                />
              </div>
              <div>
                <Label>用户名</Label>
                <Input
                  value={editingUser.username || ''}
                  onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                  placeholder="@用户名"
                />
              </div>
              <div>
                <Label>个人简介</Label>
                <Textarea
                  value={editingUser.bio || ''}
                  onChange={(e) => setEditingUser({...editingUser, bio: e.target.value})}
                  rows={3}
                  placeholder="用户的个人简介..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_seller"
                    checked={editingUser.is_seller || false}
                    onCheckedChange={(checked) => setEditingUser({...editingUser, is_seller: !!checked})}
                  />
                  <Label htmlFor="is_seller">卖家账户</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="seller_verified"
                    checked={editingUser.seller_verified || false}
                    onCheckedChange={(checked) => setEditingUser({...editingUser, seller_verified: !!checked})}
                  />
                  <Label htmlFor="seller_verified">已验证</Label>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
                <Badge variant={editingUser.is_admin ? "default" : "outline"}>
                  {editingUser.is_admin ? '管理员' : '普通用户'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  角色需在"设置角色"中更改
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditUser} disabled={isSaving}>
              {isSaving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              保存更改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 角色设置对话框 */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>设置用户角色</DialogTitle>
            <DialogDescription>
              为用户 {selectedUserForRole?.full_name || selectedUserForRole?.username || '未知用户'} 设置角色
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>选择角色</Label>
              <Select
                value={selectedUserForRole?.role || 'user'}
                onValueChange={(value) => {
                  if (selectedUserForRole) {
                    handleSetUserRole(selectedUserForRole.id, value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      普通用户
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      管理员
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="py-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ 管理员角色拥有系统最高权限，请谨慎设置
                </p>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};