
import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingSpinner } from './LoadingSpinner';

interface SafeComponentProps {
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  fallback?: React.ReactNode;
  className?: string;
}

export const SafeComponent: React.FC<SafeComponentProps> = ({
  children,
  loading = false,
  error = null,
  fallback = null,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-600 mb-4">{error}</div>
        {fallback}
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={className}>
        {children}
      </div>
    </ErrorBoundary>
  );
};
