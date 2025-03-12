
import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      toast.error('Please sign in to access this page');
      navigate('/');
      return;
    }

    if (!isLoading && user && adminOnly) {
      // Check if user has admin role
      const isAdmin = user.app_metadata?.role === 'admin';
      if (!isAdmin) {
        toast.error('You do not have permission to access this page');
        navigate('/dashboard');
      }
    }
  }, [user, isLoading, navigate, adminOnly]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return null;
  
  // Admin check for sensitive routes
  if (adminOnly && user.app_metadata?.role !== 'admin') return null;

  return <>{children}</>;
};
