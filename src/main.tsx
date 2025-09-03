
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { LoadingProvider } from './contexts/LoadingContext.tsx'
import './i18n'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000, // 增加缓存时间
      gcTime: 30 * 60 * 1000, // 增加垃圾回收时间
    },
  },
});

// 全局错误处理
const handleGlobalError = (event: ErrorEvent) => {
  console.error("Global error caught:", event.error);
  if (import.meta.env.DEV) {
    console.trace();
  }
};

const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  console.error("Unhandled promise rejection:", event.reason);
  if (import.meta.env.DEV) {
    console.trace();
  }
};

window.addEventListener('error', handleGlobalError);
window.addEventListener('unhandledrejection', handleUnhandledRejection);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LoadingProvider>
          <AuthProvider>
            <App />
            <Toaster position="top-right" />
          </AuthProvider>
        </LoadingProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
