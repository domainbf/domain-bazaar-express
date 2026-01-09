import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from '@/components/auth/AuthForm';
import { ResetPasswordRequestForm } from '@/components/auth/ResetPasswordRequestForm';
import { Globe, ShieldCheck, Users, TrendingUp } from 'lucide-react';

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
    return mode === 'signin' ? '欢迎回来' : '创建新账户';
  };

  const getSubtitle = () => {
    if (showResetPassword) return '输入您的邮箱地址，我们将发送重置链接';
    return mode === 'signin' ? '登录您的账户，开始管理您的域名' : '注册账户，开启您的域名投资之旅';
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img 
              src="/lovable-uploads/nic.png" 
              alt="NIC.BN" 
              className="h-10 w-auto" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="text-2xl font-bold text-gray-900 ml-2">NIC.BN</span>
          </Link>
          <Link to="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
            返回首页
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Auth Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Card Header */}
            <div className="bg-gray-900 text-white px-8 py-8 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold mb-2">{getTitle()}</h1>
              <p className="text-gray-300 text-sm">{getSubtitle()}</p>
            </div>
            
            {/* Card Body */}
            <div className="px-8 py-8">
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

          {/* Trust Badges */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center mb-2">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-gray-600 font-medium">安全加密</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-gray-600 font-medium">专业服务</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-gray-600 font-medium">优质域名</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-4 py-4 text-center text-sm text-gray-500">
        © 2025 NIC.BN - 专业域名交易平台
      </footer>
    </div>
  );
};

export default AuthPage;
