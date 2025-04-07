
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
  const { user, isLoading, checkAdminStatus } = useAuth();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(adminOnly);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAccess = async () => {
      if (!isLoading && !user) {
        toast.error('请先登录以访问此页面');
        navigate('/');
        return;
      }

      if (!isLoading && user && adminOnly) {
        setIsCheckingAdmin(true);
        // Verify admin status through the context
        const isAdmin = await checkAdminStatus();
        setHasAdminAccess(isAdmin);
        setIsCheckingAdmin(false);
        
        if (!isAdmin) {
          toast.error('您没有访问此页面的权限');
          navigate('/dashboard');
        }
      }
    };

    verifyAccess();
  }, [user, isLoading, navigate, adminOnly, checkAdminStatus]);

  if (isLoading || isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return null;
  
  // For admin routes, ensure admin status is verified
  if (adminOnly && !hasAdminAccess) return null;

  return <>{children}</>;
};
