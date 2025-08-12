
import { Routes, Route } from 'react-router-dom';
import { Toaster } from "sonner";
import { useEffect, useState, Suspense, lazy } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { initializeAdminUser } from './utils/adminInitialization';

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
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const FAQPage = lazy(() => import('./pages/FAQPage').then(m => ({ default: m.FAQPage })));
const NotFound = lazy(() => import('./pages/NotFound'));

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
        <h2 className="text-2xl font-bold text-red-600 mb-4">页面加载出错</h2>
        <p className="text-gray-600 mb-4">
          抱歉，页面遇到了问题。请尝试刷新页面。
        </p>
        <div className="space-y-2">
          <button
            onClick={resetErrorBoundary}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            重试
          </button>
          <button
            onClick={() => window.location.href = 'https://nic.bn/'}
            className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        await initializeAdminUser().catch(() => {
          // 静默处理初始化错误，不影响应用启动
          console.warn('Admin user initialization failed, continuing...');
        });
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setAppReady(true);
      }
    };

    const timer = setTimeout(initApp, 50);
    
    return () => clearTimeout(timer);
  }, []);

  if (!appReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">正在启动应用</h3>
          <p className="text-gray-600">正在加载系统资源...</p>
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center p-8">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">页面加载中</h3>
            <p className="text-gray-600">正在加载资源，请稍候...</p>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/*" element={<AuthPage />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/domain/:domainId" element={<DomainDetailPage />} />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster position="top-right" />
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
