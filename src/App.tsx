
import { Routes, Route } from 'react-router-dom';
import { Toaster } from "sonner";
import { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import Index from './pages/Index';
import { Marketplace } from './pages/Marketplace';
import { Dashboard } from './pages/Dashboard';
import { AdminPanel } from './pages/AdminPanel';
import { DomainVerification } from './pages/DomainVerification';
import { Profile } from './pages/Profile';
import { ResetPassword } from './pages/ResetPassword';
import { UserCenter } from './pages/UserCenter';
import { UserProfilePage } from './pages/UserProfile';
import { DomainDetailPage } from './components/domain/DomainDetailPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { initializeAdminUser } from './utils/adminInitialization';
import NotFound from './pages/NotFound';
import { ContactPage } from './pages/ContactPage';
import { FAQPage } from './pages/FAQPage';
import AuthPage from './pages/AuthPage';

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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">正在初始化应用...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
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
    </ErrorBoundary>
  );
}

export default App;
