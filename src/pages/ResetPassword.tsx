
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
        // Extract the access token from URL fragment
        try {
          // The URL fragment looks like: #access_token=eyJhbGc...&type=recovery
          const accessToken = hash.split('&')[0].split('=')[1];
          
          if (!accessToken) {
            throw new Error('找不到重置令牌');
          }
          
          // Set the new session with the recovery token
          await supabase.auth.getSession(); // Makes sure to get the current session
          setResetToken(accessToken);
          
        } catch (error: any) {
          console.error('处理密码恢复令牌时出错:', error);
          toast.error('无效的密码重置链接，请重新请求重置密码');
          navigate('/auth');
        }
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
