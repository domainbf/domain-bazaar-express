
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModalHeader } from '@/components/auth/AuthModalHeader';
import { AuthForm } from '@/components/auth/AuthForm';

export const AuthPage = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // 登录后自动跳转首页
  useEffect(() => {
    if (!isLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <AuthModalHeader title="用户登录/注册" />
        <AuthForm 
          mode="signin"
          onChangeMode={() => {}} // 由 AuthForm 自身切换
          onForgotPassword={() => {}}
        />
      </div>
    </div>
  );
};

export default AuthPage;
