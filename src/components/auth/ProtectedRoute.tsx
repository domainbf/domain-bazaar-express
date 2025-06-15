
import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  useEffect(() => {
    const checkAccess = () => {
      // 等待认证状态加载完成
      if (isLoading) return;

      setIsChecking(true);

      try {
        // 检查用户是否已登录
        if (!user) {
          console.log('User not authenticated, redirecting to /auth');
          toast.error('请先登录以访问此页面');
          navigate('/auth', { replace: true }); // 重点修正为 /auth
          return;
        }

        // 检查管理员权限（如果需要）
        if (adminOnly && !isAdmin) {
          console.log('User is not admin, redirecting to dashboard');
          toast.error('您没有访问此页面的权限');
          navigate('/dashboard', { replace: true });
          return;
        }

        console.log('Access granted for user:', user.email);
      } catch (error) {
        console.error('Access check failed:', error);
        toast.error('验证权限时发生错误');
        navigate('/auth', { replace: true }); // 错误时也统一跳 /auth
      } finally {
        // 添加一个小的延迟以确保状态更新
        setTimeout(() => {
          setIsChecking(false);
        }, 100);
      }
    };

    checkAccess();
  }, [user, isLoading, isAdmin, adminOnly, navigate]);

  // 显示加载状态
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

  // 如果用户未登录或没有权限，不渲染子组件
  if (!user || (adminOnly && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">访问被拒绝</h1>
          <p className="text-muted-foreground mb-4">
            {!user ? '请先登录' : '您没有访问此页面的权限'}
          </p>
          <button 
            onClick={() => navigate('/', { replace: true })}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
