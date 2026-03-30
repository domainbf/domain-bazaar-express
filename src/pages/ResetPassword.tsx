import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { ResetPasswordConfirmForm } from '@/components/auth/ResetPasswordConfirmForm';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Globe, ArrowLeft, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

export const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [resetTokenData, setResetTokenData] = useState<{
    accessToken: string;
    refreshToken: string;
  } | null>(null);
  const [recoverySessionReady, setRecoverySessionReady] = useState(false);

  useEffect(() => {
    let settled = false;

    // Method 1: Listen for Supabase PASSWORD_RECOVERY auth event.
    // This fires automatically when Supabase processes a valid recovery link
    // that contains proper JWT tokens in the URL hash (the standard flow via
    // the /auth/v1/verify endpoint).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        settled = true;
        setRecoverySessionReady(true);
        setResetTokenData({
          accessToken: session?.access_token ?? '',
          refreshToken: session?.refresh_token ?? '',
        });
        // Clean the URL so the tokens don't stay visible
        window.history.replaceState({}, '', window.location.pathname);
        setIsLoading(false);
      }
    });

    // Method 2: Manually parse hash params as a fallback (handles both the
    // standard redirect-back format and any legacy formats).
    const hash = location.hash;
    if (hash && hash.includes('type=recovery')) {
      const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') ?? '';

      if (accessToken) {
        settled = true;
        setResetTokenData({ accessToken, refreshToken });
        window.history.replaceState({}, '', window.location.pathname);
        setIsLoading(false);
      } else {
        // Hash had type=recovery but no access_token — invalid/expired link
        settled = true;
        toast.error('重置链接无效或已过期，请重新申请');
        setIsLoading(false);
      }
    }

    // If nothing was found in the hash, stop loading after a short grace
    // period (in case the onAuthStateChange fires just after mount).
    const timeout = setTimeout(() => {
      if (!settled) {
        setIsLoading(false);
      }
    }, 1500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = resetTokenData ? '设置新密码' : '找回密码';
  const subtitle = resetTokenData
    ? '请设置一个安全的新密码，设置后原密码立即失效'
    : '输入您的注册邮箱，我们将发送密码重置链接';

  return (
    <div className="min-h-screen bg-muted/50 flex flex-col">
      {/* Header */}
      <header className="bg-background border-b border-border px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img
              src="/lovable-uploads/nic.png"
              alt="域见•你"
              className="h-10 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <span className="text-2xl font-bold text-foreground" style={{ display: 'none' }}>域见•你</span>
          </Link>
          <Link to="/auth" className="text-muted-foreground hover:text-foreground text-sm font-medium flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            返回登录
          </Link>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">正在验证重置链接...</p>
          </div>
        ) : (
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {/* Auth Card */}
            <div className="bg-background rounded-xl shadow-lg border border-border overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-br from-foreground to-foreground/90 text-background dark:from-card dark:to-muted dark:text-foreground px-8 py-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 25% 25%, currentColor 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }} />
                </div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-primary-foreground/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    {resetTokenData
                      ? <ShieldCheck className="w-8 h-8" />
                      : <Globe className="w-8 h-8" />
                    }
                  </div>
                  <h1 className="text-2xl font-bold mb-2">{title}</h1>
                  <p className="text-primary-foreground/70 text-sm">{subtitle}</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="px-6 sm:px-8 py-8">
                {resetTokenData ? (
                  <ResetPasswordConfirmForm
                    tokenData={resetTokenData}
                    sessionReady={recoverySessionReady}
                  />
                ) : (
                  <ResetPasswordForm />
                )}
              </div>
            </div>

            {/* Trust badges */}
            <motion.div
              className="mt-8 grid grid-cols-3 gap-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              {[
                { label: '加密传输', desc: 'SSL 全程保护' },
                { label: '数据安全', desc: '企业级存储' },
                { label: '隐私合规', desc: '严格保密' },
              ].map(({ label, desc }) => (
                <div key={label} className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-background/20 dark:bg-foreground/20 rounded-full flex items-center justify-center mb-2">
                    <ShieldCheck className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-background border-t border-border px-4 py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} 域见•你 - 专业域名交易平台
      </footer>
    </div>
  );
};
