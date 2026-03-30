import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { ResetPasswordConfirmForm } from '@/components/auth/ResetPasswordConfirmForm';
import { useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Globe, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const ResetPassword = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const resetToken = searchParams.get('token');

  const title = resetToken ? '设置新密码' : '找回密码';
  const subtitle = resetToken
    ? '请设置一个安全的新密码，设置后原密码立即失效'
    : '输入您的注册邮箱，我们将发送密码重置链接';

  return (
    <div className="min-h-screen bg-muted/50 flex flex-col">
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

      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <div className="bg-background rounded-xl shadow-lg border border-border overflow-hidden">
            <div className="bg-gradient-to-br from-foreground to-foreground/90 text-background dark:from-card dark:to-muted dark:text-foreground px-8 py-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 25% 25%, currentColor 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }} />
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary-foreground/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  {resetToken
                    ? <ShieldCheck className="w-8 h-8" />
                    : <Globe className="w-8 h-8" />
                  }
                </div>
                <h1 className="text-2xl font-bold mb-2">{title}</h1>
                <p className="text-primary-foreground/70 text-sm">{subtitle}</p>
              </div>
            </div>

            <div className="px-6 sm:px-8 py-8">
              {resetToken ? (
                <ResetPasswordConfirmForm token={resetToken} />
              ) : (
                <ResetPasswordForm />
              )}
            </div>
          </div>

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
      </div>

      <footer className="bg-background border-t border-border px-4 py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} 域见•你 - 专业域名交易平台
      </footer>
    </div>
  );
};
