import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from '@/components/auth/AuthForm';
import { ResetPasswordRequestForm } from '@/components/auth/ResetPasswordRequestForm';
import { Globe, ShieldCheck, Users, TrendingUp, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AuthPage = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showResetPassword, setShowResetPassword] = useState(false);

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
          <Link to="/" className="text-muted-foreground hover:text-foreground text-sm font-medium flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <motion.div 
          className="w-full max-w-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {/* Auth Card */}
          <div className="bg-background rounded-xl shadow-lg border border-border overflow-hidden">
            {/* Card Header */}
            <div className="border-b border-border px-8 py-8 text-center relative overflow-hidden bg-muted/20">
              <motion.div 
                className="relative z-10"
                key={mode + String(showResetPassword)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-16 h-16 border-2 border-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-foreground/70" />
                </div>
                <h1 className="text-2xl font-bold mb-2 text-foreground">{getTitle()}</h1>
                <p className="text-muted-foreground text-sm">{getSubtitle()}</p>
              </motion.div>
            </div>
            
            {/* Card Body */}
            <div className="px-6 sm:px-8 py-8">
              <AnimatePresence mode="wait">
                {showResetPassword ? (
                  <motion.div
                    key="reset"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ResetPasswordRequestForm 
                      onCancel={() => setShowResetPassword(false)}
                      onSuccess={() => setShowResetPassword(false)}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key={mode}
                    initial={{ opacity: 0, x: mode === 'signup' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: mode === 'signup' ? -20 : 20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <AuthForm 
                      mode={mode}
                      onChangeMode={setMode}
                      onForgotPassword={() => setShowResetPassword(true)}
                      onSuccess={handleSuccess}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Trust Badges */}
          <motion.div 
            className="mt-8 grid grid-cols-3 gap-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {[
              { icon: ShieldCheck, label: '安全加密' },
              { icon: Users, label: '专业服务' },
              { icon: TrendingUp, label: '优质域名' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center group">
                <div className="w-10 h-10 border border-border rounded-full flex items-center justify-center mb-2 group-hover:border-foreground/40 transition-colors duration-200">
                  <Icon className="w-5 h-5 text-foreground/60" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-background border-t border-border px-4 py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} 域见•你 - 专业域名交易平台
      </footer>
    </div>
  );
};

export default AuthPage;
