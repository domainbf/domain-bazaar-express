
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { toast } from 'sonner';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

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
  const { signIn, signUp, isAuthenticating } = useAuth();

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
        console.log('Attempting to sign up with email:', email);
        const success = await signUp(email, password, {
          full_name: fullName
        });
        
        if (success) {
          setShowVerificationMessage(true);
          toast.success('注册成功！请查看您的邮箱以完成验证。');
        }
      } else {
        console.log('Attempting to sign in with email:', email);
        const success = await signIn(email, password);
        
        if (success) {
          toast.success('登录成功！');
          if (onSuccess) onSuccess();
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
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

  // 修复忘记密码按钮点击事件
  const handleForgotPasswordClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onForgotPassword();
  };

  // 修复模式切换按钮点击事件
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
      case 1: return { text: '弱', color: 'text-red-500' };
      case 2: return { text: '一般', color: 'text-yellow-500' };
      case 3: return { text: '中等', color: 'text-blue-500' };
      case 4:
      case 5: return { text: '强', color: 'text-green-500' };
      default: return { text: '弱', color: 'text-red-500' };
    }
  };

  const passwordStrength = mode === 'signup' ? getPasswordStrength(password) : 0;
  const strengthInfo = getPasswordStrengthText(passwordStrength);

  return (
    <div className="space-y-5">
      {/* 安全提示卡片 */}
      {mode === 'signup' && (
        <Card className="border-l-4 border-l-gray-900 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <ShieldCheck className="h-5 w-5 text-gray-900 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-gray-900">安全注册</h4>
                <p className="text-xs text-gray-600">我们使用企业级加密技术保护您的信息安全</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
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
                <div className="bg-white border border-green-200 rounded-md p-3">
                  <p className="text-xs text-gray-600 mb-2">
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
            <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-600" /> 
              姓名 
              <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 bg-white border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 transition-all duration-200"
              placeholder="请输入您的真实姓名"
              required
            />
          </div>
        )}
      
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-600" /> 
            邮箱地址 
            <span className="text-red-500">*</span>
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 bg-white border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 transition-all duration-200"
            placeholder="请输入您的邮箱地址"
            required
          />
        </div>
      
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-600" /> 
            密码 
            <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 bg-white border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 transition-all duration-200 pr-12"
              placeholder={mode === 'signup' ? "至少6个字符" : "请输入您的密码"}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-900 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {mode === 'signup' && password && (
            <div className="flex items-center justify-between text-xs">
              <span>密码强度: <span className={strengthInfo.color + " font-medium"}>{strengthInfo.text}</span></span>
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i < passwordStrength ? 'bg-gray-900' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {mode === 'signup' && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-600" /> 
              确认密码 
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 bg-white border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 transition-all duration-200 pr-12"
                placeholder="请再次输入密码进行确认"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-900 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
      
        {mode === 'signin' && (
          <div className="text-right">
            <button 
              type="button"
              onClick={handleForgotPasswordClick}
              className="text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors cursor-pointer font-medium"
            >
              忘记密码？
            </button>
          </div>
        )}
        
        <div className="pt-2">
          <Button 
            type="submit"
            disabled={isAuthenticating}
            className="w-full h-12 bg-gray-900 text-white hover:bg-gray-800 transition-all duration-200 font-medium text-base"
          >
            {isAuthenticating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin w-5 h-5" />
                {mode === 'signin' ? '正在登录...' : '正在创建账户...'}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {mode === 'signin' ? '立即登录' : '创建账户'}
              </span>
            )}
          </Button>
        </div>
      
        <div className="text-center pt-4 border-t border-gray-200">
          {mode === 'signin' ? (
            <p className="text-sm text-gray-600">
              还没有账户？{' '}
              <button 
                type="button"
                onClick={(e) => handleModeChange(e, 'signup')}
                className="text-gray-900 font-semibold hover:underline transition-colors cursor-pointer"
              >
                立即注册
              </button>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              已有账户？{' '}
              <button 
                type="button"
                onClick={(e) => handleModeChange(e, 'signin')}
                className="text-gray-900 font-semibold hover:underline transition-colors cursor-pointer"
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
