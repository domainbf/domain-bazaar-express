
import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { NetworkStatus } from "@/components/common/NetworkStatus";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorPage } from "@/pages/ErrorPage";
import "./App.css";

// Lazy load pages for better performance
import { lazy } from "react";

const Index = lazy(() => import("./pages/Index"));
const Marketplace = lazy(() => import("./pages/Marketplace").then(m => ({ default: m.Marketplace })));
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.default || m })));
const UserCenter = lazy(() => import("./pages/UserCenter").then(m => ({ default: m.default || m })));
const AdminPanel = lazy(() => import("./pages/AdminPanel").then(m => ({ default: m.default || m })));
const Profile = lazy(() => import("./pages/Profile").then(m => ({ default: m.default || m })));
const UserProfile = lazy(() => import("./pages/UserProfile").then(m => ({ default: m.default || m })));
const DomainVerification = lazy(() => import("./pages/DomainVerification").then(m => ({ default: m.default || m })));
const ResetPassword = lazy(() => import("./pages/ResetPassword").then(m => ({ default: m.default || m })));
const ContactPage = lazy(() => import("./pages/ContactPage").then(m => ({ default: m.default || m })));
const FAQPage = lazy(() => import("./pages/FAQPage").then(m => ({ default: m.default || m })));
const NotFound = lazy(() => import("./pages/NotFound").then(m => ({ default: m.default || m })));

// Import domain detail component
const DomainDetailPage = lazy(() => import("./components/domain/DomainDetailPage").then(m => ({ default: m.DomainDetailPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('40')) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <div className="min-h-screen bg-background">
                <NetworkStatus />
                <Routes>
                  <Route path="/" element={<AppLayout />} errorElement={<ErrorPage />}>
                    <Route 
                      index 
                      element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <Index />
                        </Suspense>
                      } 
                    />
                    <Route 
                      path="marketplace" 
                      element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <Marketplace />
                        </Suspense>
                      } 
                    />
                    <Route 
                      path="dashboard" 
                      element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <Dashboard />
                        </Suspense>
                      } 
                    />
                    <Route 
                      path="user-center" 
                      element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <UserCenter />
                        </Suspense>
                      } 
                    />
                    <Route 
                      path="admin" 
                      element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <AdminPanel />
                        </Suspense>
                      } 
                    />
                    <Route 
                      path="profile/:userId" 
                      element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <UserProfile />
                        </Suspense>
                      } 
                    />
                    <Route 
                      path="profile" 
                      element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <Profile />
                        </Suspense>
                      } 
                    />
                    <Route 
                      path="domain/:domainId" 
                      element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <DomainDetailPage />
                        </Suspense>
                      } 
                    />
                    <Route 
                      path="verify/:domainId" 
                      element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <DomainVerification />
                        </Suspense>
                      } 
                    />
                    <Route 
                      path="reset-password" 
                      element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <ResetPassword />
                        </Suspense>
                      } 
                    />
                    <Route 
                      path="contact" 
                      element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <ContactPage />
                        </Suspense>
                      } 
                    />
                    <Route 
                      path="faq" 
                      element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <FAQPage />
                        </Suspense>
                      } 
                    />
                    <Route 
                      path="*" 
                      element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <NotFound />
                        </Suspense>
                      } 
                    />
                  </Route>
                </Routes>
                <Toaster position="top-right" />
              </div>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
