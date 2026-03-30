import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type') as 'recovery' | 'signup' | 'email_change' | 'magiclink' | null;

    if (!tokenHash || !type) {
      setError('无效的链接参数，请重新申请');
      return;
    }

    setError('此链接已迁移到新系统，请重新申请操作');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center p-8 bg-card rounded-xl shadow-lg border border-border max-w-sm w-full space-y-4">
          <Globe className="w-10 h-10 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold text-foreground">链接已失效</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button className="w-full" onClick={() => navigate('/reset-password')}>
            重新申请重置密码
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">正在验证，请稍候…</p>
    </div>
  );
};
