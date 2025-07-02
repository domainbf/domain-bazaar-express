
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingContextType {
  isGlobalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  loadingMessage: string;
  setLoadingMessage: (message: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('加载中...');

  const setGlobalLoading = (loading: boolean) => {
    setIsGlobalLoading(loading);
  };

  return (
    <LoadingContext.Provider value={{
      isGlobalLoading,
      setGlobalLoading,
      loadingMessage,
      setLoadingMessage
    }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
