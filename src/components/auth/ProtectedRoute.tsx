
import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { user, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      toast.error('您需要登录才能访问此页面');
      navigate('/');
    }
    
    if (!isLoading && adminOnly && !isAdmin) {
      toast.error('您没有权限访问此页面');
      navigate('/user-center');
    }
  }, [user, isLoading, isAdmin, adminOnly, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }
  
  if (adminOnly && !isAdmin) {
    return null;
  }

  return <>{children}</>;
};
