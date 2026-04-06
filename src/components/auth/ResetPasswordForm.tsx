import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const ResetPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('请输入邮箱地址');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setIsSubmitted(true);
      toast.success('密码重置链接已发送到您的邮箱');
    } catch (error: any) {
      const msg = error.message || '发送重置邮件时出错，请稍后再试';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-5">
        <Alert className="border-primary/20 bg-primary/5">
          <CheckCircle className="h-4 w-4 text-primary" />
          <AlertDescription>
            <div className="space-y-1.5">
              <p className="font-semibold text-foreground">重置链接已发送！</p>
              <p className="text-sm text-muted-foreground">
                已发送至：<span className="font-medium text-foreground">{email}</span>
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-foreground">请注意：</p>
          <ul className="text-sm text-muted-foreground space-y-1.5 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">·</span>
              重置链接有效期为 <strong className="text-foreground">60 分钟</strong>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">·</span>
              如未收到邮件，请检查垃圾邮件文件夹
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">·</span>
              链接只能使用一次，过期后需重新申请
            </li>
          </ul>
        </div>

        <Link to="/auth">
          <Button variant="outline" className="w-full h-11">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回登录
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
          autoComplete="email"
          className="h-11 bg-background border-input focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all duration-200"
          placeholder="your@email.com"
          disabled={isLoading}
          autoFocus
          data-testid="input-reset-email"
        />
        <p className="text-xs text-muted-foreground">请输入您注册时使用的邮箱地址</p>
      </div>

      <div className="flex gap-3">
        <Link to="/auth" className="flex-1">
          <Button type="button" variant="outline" className="w-full h-11" disabled={isLoading}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回登录
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={isLoading || !email}
          className="flex-1 h-11 font-medium"
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
      </div>
    </form>
  );
};
