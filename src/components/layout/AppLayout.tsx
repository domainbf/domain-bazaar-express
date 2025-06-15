
import React from 'react';
import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Navbar } from '@/components/Navbar';
import { Toaster } from '@/components/ui/sonner';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <ErrorBoundary>
        <Navbar />
        <main className="flex-1">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
        <Toaster position="top-right" />
      </ErrorBoundary>
    </div>
  );
};
