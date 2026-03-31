import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from 'next-themes';
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { LoadingProvider } from './contexts/LoadingContext.tsx'
import './i18n'

// Only retry on network errors, not on 4xx/5xx API errors
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  if (error instanceof Error) {
    // Don't retry on auth / not-found errors
    const msg = error.message.toLowerCase();
    if (msg.includes('401') || msg.includes('403') || msg.includes('404')) return false;
  }
  return true;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 5000), // 500ms, 1000ms, max 5s
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,   // revalidate on network restore
      staleTime: 10 * 60 * 1000, // 10 min default stale
      gcTime: 30 * 60 * 1000,    // 30 min garbage-collect
    },
    mutations: {
      retry: false,
    },
  },
});

const handleGlobalError = (event: ErrorEvent) => {
  console.error("Global error caught:", event.error);
  if (import.meta.env.DEV) console.trace();
};

const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  console.error("Unhandled promise rejection:", event.reason);
  if (import.meta.env.DEV) console.trace();
};

window.addEventListener('error', handleGlobalError);
window.addEventListener('unhandledrejection', handleUnhandledRejection);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="nic-theme">
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LoadingProvider>
            <AuthProvider>
              <App />
              <Toaster position="top-right" richColors closeButton />
            </AuthProvider>
          </LoadingProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </ThemeProvider>,
)
