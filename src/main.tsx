
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.tsx'
import './i18n' // Import i18n first for translations to be available

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Error handling for the entire application
const handleGlobalError = (event: ErrorEvent) => {
  console.error("Global error caught:", event.error);
  // You might want to log this error to an error tracking service
  event.preventDefault(); // Prevents the default browser error handling
};

window.addEventListener('error', handleGlobalError);

// Unhandled promise rejection handling
const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  console.error("Unhandled promise rejection:", event.reason);
  // You might want to log this error to an error tracking service
  event.preventDefault(); // Prevents the default browser error handling
};

window.addEventListener('unhandledrejection', handleUnhandledRejection);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
