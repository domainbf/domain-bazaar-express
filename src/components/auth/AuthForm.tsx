
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { toast } from 'sonner';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onChangeMode: (mode: 'signin' | 'signup') => void;
  onForgotPassword: () => void;
  onSuccess?: () => void;
}

export const AuthForm = ({ 
  mode, 
  onChangeMode, 
  onForgotPassword,
  onSuccess 
}: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('auth_remember_me') === 'true';
  });
  const { signIn, signUp, isAuthenticating } = useAuth();

  // Restore remembered email
  useEffect(() => {
    if (mode === 'signin') {
      const savedEmail = localStorage.getItem('auth_remembered_email');
      if (savedEmail && rememberMe) {
        setEmail(savedEmail);
      }
    }
  }, [mode, rememberMe]);

  // Clear states when switching modes
  useEffect(() => {
    setErrorMessage('');
    setShowVerificationMessage(false);
    setPassword('');
    setConfirmPassword('');
    if (mode === 'signin') {
      setFullName('');
    }
  }, [mode]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    if (password.length < 6) return '密码长度至少为6个字符';
    if (password.length > 72) return '密码长度不能超过72个字符';
    return null;
  };

  const validateForm = () => {
    if (!email.trim()) {
      setErrorMessage('请输入邮箱地址');
      return false;
    }
    if (!validateEmail(email)) {
      setErrorMessage('请输入有效的邮箱地址');
      return false;
    }
    if (!password.trim()) {
      setErrorMessage('请输入密码');
      return false;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrorMessage(passwordError);
      return false;
    }
    if (mode === 'signup') {
      if (!fullName.trim()) {
        setErrorMessage('请输入您的姓名');
        return false;
      }
      if (!confirmPassword.trim()) {
        setErrorMessage('请确认密码');
        return false;
      }
      if (password !== confirmPassword) {
        setErrorMessage('两次输入的密码不匹配');
        return false;
      }
    }
    setErrorMessage('');
    return true;
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('请先输入邮箱');
      return;
    }
    setIsResendingVerification(true);
    try {
      await signUp(email, password, { full_name: fullName });
      toast.success('验证邮件已重新发送，请查收');
    } catch (error: any) {
      toast.error('发送验证邮件失败，请稍后再试');
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      if (mode === 'signup') {
        const success = await signUp(email, password, { full_name: fullName });
        if (success) {
          setShowVerificationMessage(true);
          toast.success('注册成功！请查看您的邮箱以完成验证。');
        }
      } else {
        // Save remember me preference
        if (rememberMe) {
          localStorage.setItem('auth_remember_me', 'true');
          localStorage.setItem('auth_remembered_email', email);
        } else {
          localStorage.removeItem('auth_remember_me');
          localStorage.removeItem('auth_remembered_email');
        }
        
        const success = await signIn(email, password);
        if (success) {
          toast.success('登录成功！');
          if (onSuccess) onSuccess();
        }
      }
    } catch (error: any) {
      const errorMsg = error?.message || '';
      if (errorMsg.includes('Email not confirmed')) {
        setShowVerificationMessage(true);
        setErrorMessage('请先验证您的邮箱，然后再尝试登录');
      } else if (errorMsg.includes('Invalid login credentials') || errorMsg.includes('invalid_credentials')) {
        setErrorMessage('邮箱或密码错误，请检查后重试');
      } else if (errorMsg.includes('User not found')) {
        setErrorMessage('该用户不存在，请先注册账户');
      } else if (errorMsg.includes('Too many requests')) {
        setErrorMessage('请求过于频繁，请稍后再试');
      } else {
        setErrorMessage(errorMsg || '认证过程中发生错误，请稍后重试');
      }
    }
  };

  const handleForgotPasswordClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onForgotPassword();
  };

  const handleModeChange = (e: React.MouseEvent, newMode: 'signin' | 'signup') => {
    e.preventDefault();
    e.stopPropagation();
    onChangeMode(newMode);
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

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1: return { text: '弱', color: 'text-destructive' };
      case 2: return { text: '一般', color: 'text-yellow-600' };
      case 3: return { text: '中等', color: 'text-blue-600' };
      case 4:
      case 5: return { text: '强', color: 'text-green-600' };
      default: return { text: '弱', color: 'text-destructive' };
    }
  };

  const passwordStrength = mode === 'signup' ? getPasswordStrength(password) : 0;
  const strengthInfo = getPasswordStrengthText(passwordStrength);

  const strengthBarColors = ['bg-destructive', 'bg-destructive', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500', 'bg-green-500'];

  return (
    <div className="space-y-5">
      {/* 安全提示卡片 */}
      {mode === 'signup' && (
        <Card className="border-l-4 border-l-primary bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">安全注册</h4>
                <p className="text-xs text-muted-foreground">我们使用企业级加密技术保护您的信息安全</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        {showVerificationMessage && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-green-800">验证邮件已发送</p>
                  <p className="text-sm text-green-700 mt-1">
                    验证邮件已发送至 <span className="font-medium">{email}</span>
                  </p>
                </div>
                <div className="bg-background border border-green-200 rounded-md p-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    📧 请检查您的邮箱（包括垃圾邮件文件夹）并点击验证链接完成{mode === 'signup' ? '注册' : '登录'}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={isResendingVerification}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    {isResendingVerification ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        发送中...
                      </>
                    ) : (
                      '重新发送验证邮件'
                    )}
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      
        {mode === 'signup' && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" /> 
              姓名 
              <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 bg-background border-input focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all duration-200"
              placeholder="请输入您的真实姓名"
              required
            />
          </div>
        )}
      
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" /> 
            邮箱地址 
            <span className="text-destructive">*</span>
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 bg-background border-input focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all duration-200"
            placeholder="请输入您的邮箱地址"
            required
          />
        </div>
      
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" /> 
            密码 
            <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 bg-background border-input focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all duration-200 pr-12"
              placeholder={mode === 'signup' ? "至少6个字符" : "请输入您的密码"}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {mode === 'signup' && password && (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      i < passwordStrength ? strengthBarColors[passwordStrength] : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <span className={`text-xs ${strengthInfo.color} font-medium`}>
                密码强度: {strengthInfo.text}
              </span>
            </div>
          )}
        </div>

        {mode === 'signup' && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" /> 
              确认密码 
              <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 bg-background border-input focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all duration-200 pr-12"
                placeholder="请再次输入密码进行确认"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-destructive">两次输入的密码不匹配</p>
            )}
          </div>
        )}
      
        {mode === 'signin' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                className="h-4 w-4 shrink-0 rounded-[3px] border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label
                htmlFor="remember-me"
                className="text-sm text-muted-foreground cursor-pointer select-none leading-none"
              >
                记住我
              </label>
            </div>
            <button 
              type="button"
              onClick={handleForgotPasswordClick}
              className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors cursor-pointer font-medium"
            >
              忘记密码？
            </button>
          </div>
        )}
        
        <div className="pt-2">
          <Button 
            type="submit"
            disabled={isAuthenticating}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 font-medium text-base shadow-sm"
          >
            {isAuthenticating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin w-5 h-5" />
                {mode === 'signin' ? '正在登录...' : '正在创建账户...'}
              </span>
            ) : (
              <span>{mode === 'signin' ? '立即登录' : '创建账户'}</span>
            )}
          </Button>
        </div>
      
        <div className="text-center pt-4 border-t border-border">
          {mode === 'signin' ? (
            <p className="text-sm text-muted-foreground">
              还没有账户？{' '}
              <button 
                type="button"
                onClick={(e) => handleModeChange(e, 'signup')}
                className="text-primary font-semibold hover:underline transition-colors cursor-pointer"
              >
                立即注册
              </button>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              已有账户？{' '}
              <button 
                type="button"
                onClick={(e) => handleModeChange(e, 'signin')}
                className="text-primary font-semibold hover:underline transition-colors cursor-pointer"
              >
                直接登录
              </button>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
