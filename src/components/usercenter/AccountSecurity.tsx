import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Key, Mail, Eye, EyeOff, Clock, MapPin, Loader2, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { TwoFactorAuth } from './TwoFactorAuth';
import { DeviceManagement } from './DeviceManagement';
import { Alert, AlertDescription } from "@/components/ui/alert";

export const AccountSecurity = () => {
  const { user } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('新密码和确认密码不匹配');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('密码长度至少为8个字符');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('密码已更新');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (error: any) {
      toast.error(error.message || '更新密码失败');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast.error('请输入有效的邮箱地址');
      return;
    }
    if (newEmail === user?.email) {
      toast.error('新邮箱不能与当前邮箱相同');
      return;
    }

    setIsChangingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success('验证邮件已发送到新邮箱，请查收并确认');
      setNewEmail('');
      setShowEmailForm(false);
    } catch (error: any) {
      toast.error(error.message || '更新邮箱失败');
    } finally {
      setIsChangingEmail(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getStrengthInfo = (s: number) => {
    if (s <= 1) return { text: '弱', color: 'bg-destructive', textColor: 'text-destructive' };
    if (s === 2) return { text: '一般', color: 'bg-yellow-500', textColor: 'text-yellow-600 dark:text-yellow-400' };
    if (s === 3) return { text: '中等', color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400' };
    return { text: '强', color: 'bg-green-500', textColor: 'text-green-600 dark:text-green-400' };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthInfo = getStrengthInfo(passwordStrength);

  // Password requirement checks
  const pwReqs = [
    { met: newPassword.length >= 8, label: '至少8个字符' },
    { met: /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword), label: '包含大小写字母' },
    { met: /[0-9]/.test(newPassword), label: '包含数字' },
    { met: /[^A-Za-z0-9]/.test(newPassword), label: '包含特殊字符' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 安全概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            安全概览
          </CardTitle>
          <CardDescription>您的账户安全状态一览</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
              <div className="p-2 rounded-full bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium">邮箱已验证</p>
                <p className="text-xs text-muted-foreground truncate max-w-[140px]">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
              <div className={`p-2 rounded-full ${is2FAEnabled ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                <Shield className={`w-5 h-5 ${is2FAEnabled ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
              </div>
              <div>
                <p className="text-sm font-medium">两步验证</p>
                <Badge variant={is2FAEnabled ? "default" : "secondary"} className="mt-1">
                  {is2FAEnabled ? '已启用' : '未启用'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
              <div className="p-2 rounded-full bg-blue-500/10">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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

          {!is2FAEnabled && (
            <Alert className="mt-4 border-yellow-500/30 bg-yellow-500/5">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-sm">
                建议启用两步验证以增强账户安全性。启用后，每次登录都需要额外的验证步骤。
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 两步验证 */}
      <TwoFactorAuth onStatusChange={setIs2FAEnabled} />

      {/* 修改密码 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                登录密码
              </CardTitle>
              <CardDescription>定期更换密码可以提高账户安全性</CardDescription>
            </div>
            {!showPasswordForm && (
              <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)}>
                修改密码
              </Button>
            )}
          </div>
        </CardHeader>
        {showPasswordForm && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">新密码</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="输入新密码"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* 密码强度条 */}
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">强度:</span>
                    <div className="flex gap-1 flex-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i < passwordStrength ? strengthInfo.color : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-medium ${strengthInfo.textColor}`}>
                      {strengthInfo.text}
                    </span>
                  </div>

                  {/* 密码要求列表 */}
                  <div className="grid grid-cols-2 gap-1">
                    {pwReqs.map((req, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${req.met ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                        <span className={`text-xs ${req.met ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> 两次输入的密码不匹配
                </p>
              )}
              {confirmPassword && newPassword === confirmPassword && confirmPassword.length > 0 && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> 密码匹配
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8}
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    更新中...
                  </>
                ) : (
                  '确认修改'
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowPasswordForm(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                取消
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 修改邮箱 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                登录邮箱
              </CardTitle>
              <CardDescription>更换登录邮箱需要验证新邮箱地址</CardDescription>
            </div>
            {!showEmailForm && (
              <Button variant="outline" size="sm" onClick={() => setShowEmailForm(true)}>
                修改邮箱
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">当前邮箱</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-500/30">
              <CheckCircle className="w-3 h-3 mr-1" />
              已验证
            </Badge>
          </div>

          {showEmailForm && (
            <>
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
              <Alert className="bg-muted/50">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  修改邮箱后，系统会向新邮箱发送验证链接。确认后新邮箱才会生效。
                </AlertDescription>
              </Alert>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleChangeEmail}
                  disabled={isChangingEmail || !newEmail}
                  variant="outline"
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
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowEmailForm(false);
                    setNewEmail('');
                  }}
                >
                  取消
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 设备管理 */}
      <DeviceManagement />

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
                <div className="p-2 rounded-full bg-green-500/10">
                  <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">当前会话</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
              <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/10">活跃</Badge>
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
