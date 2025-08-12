
import { Navbar } from '@/components/Navbar';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { ResetPasswordConfirmForm } from '@/components/auth/ResetPasswordConfirmForm';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export const ResetPassword = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [resetToken, setResetToken] = useState<string | null>(null);
  
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
          throw new Error('找不到重置令牌');
        }
        
        // 建立恢复会话，确保后续更新密码立即生效
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
        
        // 清理 URL 中的哈希，防止泄露
        window.history.replaceState({}, '', window.location.pathname + window.location.search);
        setResetToken(accessToken);
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
          {resetToken ? (
            <ResetPasswordConfirmForm token={resetToken} />
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
