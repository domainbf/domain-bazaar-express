
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'sonner'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from './App.tsx'
import './index.css'
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
  // Prevent default to avoid console spam in production
  if (import.meta.env.PROD) {
    event.preventDefault();
  }
};

window.addEventListener('error', handleGlobalError);

// Unhandled promise rejection handling
const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  console.error("Unhandled promise rejection:", event.reason);
  // Prevent default to avoid console spam in production
  if (import.meta.env.PROD) {
    event.preventDefault();
  }
};

window.addEventListener('unhandledrejection', handleUnhandledRejection);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster position="top-right" />
  </React.StrictMode>,
)
