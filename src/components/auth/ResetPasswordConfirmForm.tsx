import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, EyeIcon, EyeOffIcon, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ResetPasswordConfirmFormProps {
  tokenData: {
    accessToken: string;
    refreshToken: string;
  };
  sessionReady?: boolean;
}

export const ResetPasswordConfirmForm = ({ tokenData, sessionReady = false }: ResetPasswordConfirmFormProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const checkPasswordStrength = (pwd: string) => ({
    hasLower: /[a-z]/.test(pwd),
    hasUpper: /[A-Z]/.test(pwd),
    hasDigit: /[0-9]/.test(pwd),
    hasSpecial: /[^A-Za-z0-9]/.test(pwd),
    longEnough: pwd.length >= 6,
  });

  const validatePassword = () => {
    if (password.length < 6) {
      setErrorMessage('密码至少需要6个字符');
      return false;
    }
    const s = checkPasswordStrength(password);
    if (!s.hasLower || !s.hasUpper || !s.hasDigit || !s.hasSpecial) {
      setErrorMessage('密码需同时包含大写字母、小写字母、数字和特殊字符（如 @#$!）');
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMessage('两次输入的密码不匹配');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validatePassword()) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      // If Supabase already set up the session via PASSWORD_RECOVERY event,
      // skip setSession and go straight to updateUser.
      if (!sessionReady) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: tokenData.accessToken,
          refresh_token: tokenData.refreshToken,
        });
        if (sessionError) {
          throw new Error('重置链接已过期或无效，请重新申请密码重置');
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        const msg = updateError.message || '';
        if (msg.includes('different from the old password') || msg.includes('same as the old')) {
          throw new Error('新密码不能与原密码相同，请设置一个不同的密码');
        }
        if (msg.includes('Password should be') || msg.includes('password') || msg.includes('Password')) {
          throw new Error('密码不符合安全要求：需包含大写字母、小写字母、数字和特殊字符（如 @#$!）');
        }
        if (msg.includes('expired') || msg.includes('invalid') || msg.includes('missing')) {
          throw new Error('重置链接已过期或无效，请重新申请密码重置');
        }
        throw updateError;
      }

      setIsSuccess(true);
      toast.success('密码已成功重置！');
      setTimeout(() => { window.location.href = '/user-center'; }, 1800);
    } catch (error: any) {
      let friendlyMessage = '重置密码失败，请重试';
      if (
        error.message?.includes('expired') ||
        error.message?.includes('invalid') ||
        error.message?.includes('过期') ||
        error.message?.includes('无效')
      ) {
        friendlyMessage = error.message || '重置链接已过期或无效，请重新申请密码重置';
      } else if (error.message?.includes('Password')) {
        friendlyMessage = '密码不符合安全要求，请使用至少6个字符的密码';
      } else if (error.message) {
        friendlyMessage = error.message;
      }
      setErrorMessage(friendlyMessage);
      toast.error(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-5 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">密码已成功更新！</h3>
          <p className="text-sm text-muted-foreground mt-1">正在跳转到用户中心...</p>
        </div>
        <Button onClick={() => navigate('/user-center')} className="w-full">
          前往用户中心
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          <p className="text-destructive text-sm">{errorMessage}</p>
        </div>
      )}

      <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="text-sm text-foreground space-y-0.5">
          <p>请设置您的新密码。</p>
          <p className="text-muted-foreground">原密码在您点击「确认修改密码」并成功保存<strong className="text-foreground">之后</strong>才会失效，在此之前您仍可用原密码登录。</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">新密码</label>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
            placeholder="输入新密码（至少 6 个字符）"
            className="pr-10 h-11"
            minLength={6}
            disabled={isLoading}
            autoFocus
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">确认密码</label>
        <div className="relative">
          <Input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setErrorMessage(''); }}
            placeholder="再次输入新密码"
            className="pr-10 h-11"
            minLength={6}
            disabled={isLoading}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowConfirm(!showConfirm)}
            tabIndex={-1}
          >
            {showConfirm ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Password requirements checklist */}
      {password && (() => {
        const s = checkPasswordStrength(password);
        const checks = [
          { label: '至少6个字符', ok: s.longEnough },
          { label: '包含小写字母 (a-z)', ok: s.hasLower },
          { label: '包含大写字母 (A-Z)', ok: s.hasUpper },
          { label: '包含数字 (0-9)', ok: s.hasDigit },
          { label: '包含特殊字符 (@#$!…)', ok: s.hasSpecial },
        ];
        const allOk = checks.every(c => c.ok);
        return (
          <div className={`rounded-lg border p-3 space-y-1.5 ${allOk ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-muted/40'}`}>
            <p className="text-xs font-medium text-muted-foreground mb-1">密码要求</p>
            {checks.map((c) => (
              <div key={c.label} className="flex items-center gap-2">
                <span className={`text-xs font-bold ${c.ok ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {c.ok ? '✓' : '·'}
                </span>
                <span className={`text-xs ${c.ok ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        );
      })()}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-11"
          onClick={() => navigate('/auth')}
          disabled={isLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回登录
        </Button>
        <Button
          type="submit"
          className="flex-1 h-11"
          disabled={isLoading || !password || !confirmPassword}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              更新中...
            </>
          ) : (
            '确认修改密码'
          )}
        </Button>
      </div>
    </form>
  );
};
