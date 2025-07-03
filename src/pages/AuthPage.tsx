
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModalHeader } from '@/components/auth/AuthModalHeader';
import { AuthForm } from '@/components/auth/AuthForm';
import { ResetPasswordRequestForm } from '@/components/auth/ResetPasswordRequestForm';
import { useState } from 'react';

export const AuthPage = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // 登录后自动跳转首页
  useEffect(() => {
    if (!isLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleSuccess = () => {
    navigate('/', { replace: true });
  };

  const getTitle = () => {
    if (showResetPassword) return '重置密码';
    return mode === 'signin' ? '用户登录' : '创建新账户';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <AuthModalHeader title={getTitle()} />
        
        {showResetPassword ? (
          <ResetPasswordRequestForm 
            onCancel={() => setShowResetPassword(false)}
            onSuccess={() => setShowResetPassword(false)}
          />
        ) : (
          <AuthForm 
            mode={mode}
            onChangeMode={setMode}
            onForgotPassword={() => setShowResetPassword(true)}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
