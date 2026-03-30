import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, AlertCircle, CheckCircle, ArrowLeft, Send } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { translateAuthError } from '@/utils/translateError';
import { RESET_PASSWORD_URL } from '@/config/siteConfig';

interface ResetPasswordRequestFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

export const ResetPasswordRequestForm = ({ onCancel, onSuccess }: ResetPasswordRequestFormProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('请输入有效的邮箱地址');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: RESET_PASSWORD_URL,
      });

      if (error) throw error;

      setIsSent(true);
      toast.success('密码重置邮件已发送');
      if (onSuccess) onSuccess();
    } catch (error: any) {
      const msg = translateAuthError(error.message || '', '发送密码重置邮件失败，请稍后再试');
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="space-y-5">
        <Alert className="border-primary/20 bg-primary/5">
          <CheckCircle className="h-4 w-4 text-primary" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">重置邮件已发送！</p>
              <p className="text-sm text-muted-foreground">
                我们已将密码重置链接发送至<br />
                <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-foreground">请注意：</p>
          <ul className="text-sm text-muted-foreground space-y-1.5 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5 font-bold">·</span>
              重置链接有效期为 <strong className="text-foreground">30 分钟</strong>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5 font-bold">·</span>
              如未收到邮件，请检查垃圾邮件文件夹
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5 font-bold">·</span>
              链接只能使用一次，过期后需重新申请
            </li>
          </ul>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-11"
          onClick={onCancel}
          data-testid="button-back-to-login"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回登录
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleResetPassword} className="space-y-5">
      {errorMessage && (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground" />
          注册邮箱地址
          <span className="text-destructive">*</span>
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErrorMessage(''); }}
          required
          className="h-11 bg-background border-input focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all duration-200"
          placeholder="your@email.com"
          disabled={isLoading}
          autoFocus
          data-testid="input-reset-email"
        />
        <p className="text-xs text-muted-foreground">请输入您注册时使用的邮箱地址</p>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !email}
        className="w-full h-12 font-medium text-base"
        data-testid="button-send-reset"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin w-4 h-4" />
            发送中...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            发送重置链接
          </span>
        )}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors inline-flex items-center gap-1.5"
          disabled={isLoading}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          返回登录
        </button>
      </div>
    </form>
  );
};
