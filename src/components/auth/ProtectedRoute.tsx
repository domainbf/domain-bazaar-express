
import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { user, isLoading, isAdmin } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const checkAccess = () => {
      if (isLoading) {
        timeoutId = setTimeout(() => {
          console.warn('Auth loading timeout, redirecting to auth page');
          setIsChecking(false);
          navigate('/auth', { replace: true, state: { from: location } });
        }, 5000);
        return;
      }

      try {
        if (!user) {
          toast.error('请先登录以访问此页面');
          navigate('/auth', { replace: true, state: { from: location } });
          return;
        }

        if (adminOnly && !isAdmin) {
          toast.error('您没有访问此页面的权限');
          navigate('/dashboard', { replace: true });
          return;
        }

        setIsChecking(false);
      } catch (error) {
        console.error('Access check failed:', error);
        toast.error('验证权限时发生错误');
        navigate('/auth', { replace: true, state: { from: location } });
      }
    };

    checkAccess();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, isLoading, isAdmin, adminOnly, navigate, location]);

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">正在验证权限...</p>
        </div>
      </div>
    );
  }

  if (!user || (adminOnly && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">访问被拒绝</h1>
          <p className="text-muted-foreground mb-4">
            {!user ? '请先登录' : '您没有访问此页面的权限'}
          </p>
          <div className="space-x-2">
            <button 
              onClick={() => navigate('/auth', { replace: true })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              前往登录
            </button>
            <button 
              onClick={() => navigate('/', { replace: true })}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
