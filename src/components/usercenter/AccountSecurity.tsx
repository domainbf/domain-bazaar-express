import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Key, Mail, Lock, Eye, EyeOff, Clock, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { TwoFactorAuth } from './TwoFactorAuth';

export const AccountSecurity = () => {
  const { user } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

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

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getStrengthInfo = (strength: number) => {
    switch (strength) {
      case 0:
      case 1: return { text: '弱', color: 'bg-destructive' };
      case 2: return { text: '一般', color: 'bg-yellow-500' };
      case 3: return { text: '中等', color: 'bg-blue-500' };
      case 4:
      case 5: return { text: '强', color: 'bg-green-500' };
      default: return { text: '弱', color: 'bg-destructive' };
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthInfo = getStrengthInfo(passwordStrength);

  return (
    <div className="space-y-6">
      {/* 安全概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            安全概览
          </CardTitle>
          <CardDescription>您的账户安全状态</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">邮箱已验证</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className={`p-2 rounded-full ${is2FAEnabled ? 'bg-green-100' : 'bg-yellow-100'}`}>
                <Shield className={`w-5 h-5 ${is2FAEnabled ? 'text-green-600' : 'text-yellow-600'}`} />
              </div>
              <div>
                <p className="text-sm font-medium">两步验证</p>
                <Badge variant={is2FAEnabled ? "default" : "secondary"} className="mt-1">
                  {is2FAEnabled ? '已启用' : '未启用'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-blue-100">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">上次登录</p>
                <p className="text-xs text-muted-foreground">
                  {user?.last_sign_in_at 
                    ? new Date(user.last_sign_in_at).toLocaleString('zh-CN')
                    : '未知'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 两步验证 */}
      <TwoFactorAuth onStatusChange={setIs2FAEnabled} />

      {/* 修改密码 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            修改密码
          </CardTitle>
          <CardDescription>定期更换密码可以提高账户安全性</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">新密码</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="输入新密码（至少6个字符）"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPassword && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">密码强度:</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-6 h-1.5 rounded-full ${
                        i < passwordStrength ? strengthInfo.color : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-xs font-medium ${
                  passwordStrength <= 1 ? 'text-destructive' : 
                  passwordStrength === 2 ? 'text-yellow-600' : 
                  passwordStrength === 3 ? 'text-blue-600' : 'text-green-600'
                }`}>
                  {strengthInfo.text}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">确认新密码</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入新密码"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">两次输入的密码不匹配</p>
            )}
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={isChangingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            className="w-full"
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                更新中...
              </>
            ) : (
              '更新密码'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 修改邮箱 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            修改邮箱
          </CardTitle>
          <CardDescription>更换登录邮箱需要验证新邮箱地址</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">当前邮箱</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              已验证
            </Badge>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
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
            variant="outline"
            className="w-full"
          >
            {isChangingEmail ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                发送中...
              </>
            ) : (
              '发送验证邮件'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 登录历史 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            最近登录活动
          </CardTitle>
          <CardDescription>查看您账户的登录历史记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">当前会话</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
              <Badge className="bg-green-500">活跃</Badge>
            </div>
            <p className="text-xs text-muted-foreground text-center py-2">
              如发现异常登录活动，请立即修改密码并启用两步验证
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};