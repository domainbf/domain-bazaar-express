
import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { user, isLoading, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      toast.error('Please sign in to access this page');
      navigate('/');
      return;
    }

    if (!isLoading && user && adminOnly) {
      // Check if user has admin role (using profile.role or any other admin check)
      const isAdmin = profile?.role === 'admin';
      if (!isAdmin) {
        toast.error('You do not have permission to access this page');
        navigate('/dashboard');
      }
    }
  }, [user, isLoading, navigate, adminOnly, profile]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return user ? <>{children}</> : null;
};
