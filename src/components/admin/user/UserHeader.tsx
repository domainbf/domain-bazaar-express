
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  RefreshCw, 
  UserPlus, 
  Download, 
  Upload,
  Users,
  FileSpreadsheet
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserHeaderProps {
  onRefresh: () => void;
}

export const UserHeader = ({ onRefresh }: UserHeaderProps) => {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Generate a random password
      const tempPassword = Math.random().toString(36).slice(-10);
      
      // Create the user
      const { data, error } = await supabase.auth.signUp({
        email: inviteEmail,
        password: tempPassword,
        options: {
          data: {
            full_name: inviteFullName
          }
        }
      });
      
      if (error) throw error;
      
      // Send invitation email
      const { error: emailError } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'user_invitation',
          recipient: inviteEmail,
          data: {
            name: inviteFullName,
            tempPassword,
            resetUrl: `${window.location.origin}/reset-password`
          }
        }
      });
      
      if (emailError) throw emailError;
      
      toast.success(`邀请已发送至 ${inviteEmail}`);
      setIsInviteDialogOpen(false);
      setInviteEmail('');
      setInviteFullName('');
      onRefresh();
    } catch (error: any) {
      console.error('邀请用户时出错:', error);
      toast.error(error.message || '邀请用户失败');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleExportUsers = async () => {
    try {
      // Get all users
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, username, is_seller, seller_verified, created_at, avatar_url, total_sales, is_admin');
      
      if (error) throw error;
      
      // Convert to CSV
      const headers = ['ID', '电子邮箱', '姓名', '用户名', '卖家', '已验证', '创建日期', '头像', '销售量', '管理员'];
      
      const csvContent = [
        headers.join(','),
        ...(data || []).map(user => [
          user.id,
          user.email || '',
          user.full_name || '',
          user.username || '',
          user.is_seller ? '是' : '否',
          user.seller_verified ? '是' : '否',
          new Date(user.created_at).toLocaleDateString(),
          user.avatar_url || '',
          user.total_sales || '0',
          user.is_admin ? '是' : '否'
        ].join(','))
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `用户列表_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('用户导出成功');
    } catch (error: any) {
      console.error('导出用户时出错:', error);
      toast.error(error.message || '导出用户失败');
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">用户管理</h2>
          <p className="text-gray-500">管理平台的所有用户账户</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={onRefresh}
            className="flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" /> 刷新
          </Button>
          <Button 
            variant="outline"
            onClick={handleExportUsers}
            className="flex items-center gap-1"
          >
            <FileSpreadsheet className="w-4 h-4" /> 导出CSV
          </Button>
          <Button
            variant="default"
            onClick={() => setIsInviteDialogOpen(true)}
            className="bg-black text-white hover:bg-gray-800 flex items-center gap-1"
          >
            <UserPlus className="w-4 h-4" /> 邀请用户
          </Button>
        </div>
      </div>
      
      {/* Invite User Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>邀请新用户</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInviteUser} className="space-y-4">
            <div>
              <Label htmlFor="email">电子邮箱</Label>
              <Input 
                id="email" 
                type="email" 
                value={inviteEmail} 
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="用户邮箱"
                required
              />
            </div>
            <div>
              <Label htmlFor="fullName">姓名</Label>
              <Input 
                id="fullName" 
                type="text" 
                value={inviteFullName} 
                onChange={(e) => setInviteFullName(e.target.value)}
                placeholder="用户姓名"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                取消
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-black text-white hover:bg-gray-800"
              >
                {isSubmitting ? '发送中...' : '发送邀请'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
