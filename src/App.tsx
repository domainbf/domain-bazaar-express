
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from "sonner";
import { useEffect, Suspense, lazy } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Route-based code splitting
const Index = lazy(() => import('./pages/Index'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const Marketplace = lazy(() => import('./pages/Marketplace').then(m => ({ default: m.Marketplace })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const AdminPanel = lazy(() => import('./pages/AdminPanel').then(m => ({ default: m.AdminPanel })));
const DomainVerification = lazy(() => import('./pages/DomainVerification').then(m => ({ default: m.DomainVerification })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const UserCenter = lazy(() => import('./pages/UserCenter').then(m => ({ default: m.UserCenter })));
const UserProfilePage = lazy(() => import('./pages/UserProfile').then(m => ({ default: m.UserProfilePage })));
const DomainDetailPage = lazy(() => import('./components/domain/DomainDetailPage').then(m => ({ default: m.DomainDetailPage })));
const DomainManagement = lazy(() => import('./components/usercenter/DomainManagement').then(m => ({ default: m.DomainManagement })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const FAQPage = lazy(() => import('./pages/FAQPage').then(m => ({ default: m.FAQPage })));
const SecurityCenter = lazy(() => import('./pages/SecurityCenter'));
const Community = lazy(() => import('./pages/Community'));
const NotFound = lazy(() => import('./pages/NotFound'));

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-red-600 mb-4">页面加载出错</h2>
        <p className="text-gray-600 mb-6">
          抱歉，页面遇到了问题。请尝试刷新页面或返回首页。
        </p>
        <div className="space-y-3">
          <button
            onClick={resetErrorBoundary}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            重试
          </button>
          <button
            onClick={handleGoHome}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}

// 优化的加载组件
function RouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <LoadingSpinner size="lg" text="加载中..." />
    </div>
  );
}

// 路由过渡包装器
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div className="animate-in fade-in duration-300">
      <Routes location={location}>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/*" element={<AuthPage />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/domain/:domainName" element={<DomainDetailPage />} />
        <Route path="/domains/:domainName" element={<DomainDetailPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/user-center" 
          element={
            <ProtectedRoute>
              <UserCenter />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/user-center/*" 
          element={
            <ProtectedRoute>
              <UserCenter />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/domain-management" 
          element={
            <ProtectedRoute>
              <DomainManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/domain-verification/:domainId" 
          element={
            <ProtectedRoute>
              <DomainVerification />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route path="/profile/:profileId" element={<UserProfilePage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/*" element={<ResetPassword />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/security-center" element={<SecurityCenter />} />
        <Route path="/community" element={<Community />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

function App() {
  useEffect(() => {
    // 预加载关键路由（延迟执行以避免阻塞初始渲染）
    const timer = setTimeout(() => {
      import('./pages/Marketplace').catch(() => {});
      import('./pages/Dashboard').catch(() => {});
      import('./components/domain/DomainDetailPage').catch(() => {});
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <Suspense fallback={<RouteLoadingFallback />}>
        <AnimatedRoutes />
        <Toaster position="top-right" />
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
