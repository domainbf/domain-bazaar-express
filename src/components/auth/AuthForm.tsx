
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { toast } from 'sonner';

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
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { signIn, signUp, isAuthenticating } = useAuth();

  // Clear error message when switching modes
  useEffect(() => {
    setErrorMessage('');
  }, [mode]);

  const validateForm = () => {
    if (!email.trim()) {
      setErrorMessage('请输入邮箱地址');
      return false;
    }
    
    if (!password.trim()) {
      setErrorMessage('请输入密码');
      return false;
    }
    
    if (mode === 'signup') {
      if (!fullName.trim()) {
        setErrorMessage('请输入您的姓名');
        return false;
      }
      
      if (password.length < 6) {
        setErrorMessage('密码长度至少为6个字符');
        return false;
      }
    }
    
    setErrorMessage('');
    return true;
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
          toast.success('注册成功！请查看您的邮箱以完成验证。');
          // Don't close modal on signup to show confirmation message
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
      setErrorMessage(error.message || '认证过程中发生错误');
    }
  };

  return (
    <form onSubmit={handleAuth} className="space-y-4 mt-4">
      {errorMessage && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
          {errorMessage}
        </div>
      )}
      
      {mode === 'signup' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <User className="w-4 h-4" /> 姓名
          </label>
          <Input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="bg-white border-gray-300 focus:border-black transition-colors"
            placeholder="张三"
          />
        </div>
      )}
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Mail className="w-4 h-4" /> 邮箱
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-white border-gray-300 focus:border-black transition-colors"
          placeholder="your@example.com"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Lock className="w-4 h-4" /> 密码
        </label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white border-gray-300 focus:border-black transition-colors pr-10"
            minLength={mode === 'signup' ? 6 : undefined}
            placeholder={mode === 'signup' ? "至少6个字符" : "您的密码"}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      {mode === 'signin' && (
        <div className="text-right">
          <button 
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-black hover:underline"
          >
            忘记密码?
          </button>
        </div>
      )}
      
      <Button 
        type="submit"
        disabled={isAuthenticating}
        className="w-full bg-black text-white hover:bg-gray-800 transition-colors"
      >
        {isAuthenticating ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin w-4 h-4" />
            {mode === 'signin' ? '登录中...' : '创建账户中...'}
          </span>
        ) : (
          mode === 'signin' ? '登录' : '注册'
        )}
      </Button>
      
      {mode === 'signin' ? (
        <p className="text-center text-sm text-gray-600">
          还没有账户?{' '}
          <button 
            type="button"
            onClick={() => onChangeMode('signup')}
            className="text-black font-medium hover:underline"
          >
            注册
          </button>
        </p>
      ) : (
        <p className="text-center text-sm text-gray-600">
          已有账户?{' '}
          <button 
            type="button"
            onClick={() => onChangeMode('signin')}
            className="text-black font-medium hover:underline"
          >
            登录
          </button>
        </p>
      )}
    </form>
  );
};
