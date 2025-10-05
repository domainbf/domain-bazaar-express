import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Key, Mail, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const AccountSecurity = () => {
  const { user } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('新密码和确认密码不匹配');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('密码长度至少为6个字符');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('密码已更新');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || '更新密码失败');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('请输入有效的邮箱地址');
      return;
    }

    setIsChangingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      toast.success('验证邮件已发送到新邮箱，请查收并确认');
      setNewEmail('');
    } catch (error: any) {
      toast.error(error.message || '更新邮箱失败');
    } finally {
      setIsChangingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            账户安全
          </CardTitle>
          <CardDescription>管理您的登录凭据和账户安全设置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 当前邮箱 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">当前邮箱</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* 修改密码 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Key className="w-5 h-5" />
              修改密码
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-password">新密码</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="输入新密码（至少6个字符）"
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">确认新密码</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入新密码"
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword || !newPassword || !confirmPassword}
                className="w-full"
              >
                {isChangingPassword ? '更新中...' : '更新密码'}
              </Button>
            </div>
          </div>

          {/* 修改邮箱 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              修改邮箱
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-email">新邮箱地址</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="输入新的邮箱地址"
                />
              </div>
              <Button
                onClick={handleChangeEmail}
                disabled={isChangingEmail || !newEmail}
                className="w-full"
                variant="outline"
              >
                {isChangingEmail ? '发送中...' : '发送验证邮件'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
