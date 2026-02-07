import { Navbar } from '@/components/Navbar';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { ResetPasswordConfirmForm } from '@/components/auth/ResetPasswordConfirmForm';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export const ResetPassword = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [resetTokenData, setResetTokenData] = useState<{
    accessToken: string;
    refreshToken: string;
  } | null>(null);
  
  useEffect(() => {
    // Check if we have a session recovery (password reset) token in the URL
    const handlePasswordRecovery = async () => {
      setIsLoading(true);
      const hash = location.hash;
      
      if (hash && hash.includes('type=recovery')) {
        // 解析 URL 哈希参数
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (!accessToken) {
          toast.error('找不到重置令牌，请重新请求密码重置');
          setIsLoading(false);
          return;
        }
        
        // 清理 URL 中的哈希，防止泄露，但保留 token 数据用于后续使用
        window.history.replaceState({}, '', window.location.pathname + window.location.search);
        
        // 保存 token 数据，但不立即建立会话
        // 只有当用户提交新密码时才使用这些 token
        setResetTokenData({
          accessToken,
          refreshToken: refreshToken || ''
        });
      }
      
      setIsLoading(false);
    };
    
    handlePasswordRecovery();
  }, [location, navigate]);
  
  // Show loading state while checking token
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center">
          <div className="w-full max-w-md flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-black mb-4" />
            <p className="text-gray-600">正在验证您的重置链接...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center">
        <div className="w-full max-w-md">
          {resetTokenData ? (
            <ResetPasswordConfirmForm tokenData={resetTokenData} />
          ) : (
            <>
              <h1 className="text-3xl font-bold text-center mb-6">重置密码</h1>
              <p className="text-gray-600 text-center mb-8">
                请输入您注册时使用的邮箱，我们将发送重置链接给您
              </p>
              <ResetPasswordForm />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
