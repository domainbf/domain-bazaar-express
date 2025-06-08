
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
    const checkAccess = async () => {
      // 等待认证状态加载完成
      if (isLoading) return;
      
      setIsChecking(true);
      
      try {
        // 检查用户是否已登录
        if (!user) {
          toast.error('请先登录以访问此页面');
          navigate('/');
          return;
        }

        // 检查管理员权限（如果需要）
        if (adminOnly && !isAdmin) {
          toast.error('您没有访问此页面的权限');
          navigate('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Access check failed:', error);
        toast.error('验证权限时发生错误');
        navigate('/');
      } finally {
        setIsChecking(false);
      }
    };

    checkAccess();
  }, [user, isLoading, isAdmin, adminOnly, navigate]);

  // 显示加载状态
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // 如果用户未登录或没有权限，不渲染子组件
  if (!user || (adminOnly && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
};
