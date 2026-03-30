import { ReactNode, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { user, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  // Only show spinner if auth hasn't resolved within 250 ms.
  // This prevents a flash of the loading screen for users who
  // already have a valid cached session (the common case).
  const [showSpinner, setShowSpinner] = useState(false);
  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => setShowSpinner(true), 250);
    return () => clearTimeout(t);
  }, [isLoading]);

  if (isLoading) {
    if (!showSpinner) return null; // render nothing for the first 250 ms
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 rounded-full border-2 border-border border-t-foreground animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
