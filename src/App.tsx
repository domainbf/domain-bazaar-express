
import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, Suspense, lazy, memo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { CustomScripts } from './components/common/CustomScripts';
import { PWAInstallBanner } from './components/pwa/PWAInstallBanner';

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
const SellDomainPage = lazy(() => import('./pages/SellDomain').then(m => ({ default: m.SellDomainPage })));
const NotFound = lazy(() => import('./pages/NotFound'));
const TransactionDetail = lazy(() => import('./pages/TransactionDetail'));

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center p-8 bg-card rounded-lg shadow-lg max-w-md w-full border border-border">
        <h2 className="text-2xl font-bold text-destructive mb-4">页面加载出错</h2>
        <p className="text-muted-foreground mb-6">抱歉，页面遇到了问题。请尝试刷新页面或返回首页。</p>
        <div className="space-y-3">
          <button onClick={resetErrorBoundary} className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
            重试
          </button>
          <button onClick={() => window.location.href = '/'} className="w-full px-4 py-3 border border-border rounded-lg hover:bg-accent transition-colors text-foreground">
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}

// Minimal skeleton loading — no spinner, just structure
const RouteLoadingFallback = memo(() => (
  <div className="min-h-screen bg-background">
    <div className="h-14 border-b border-border bg-card animate-pulse" />
    <div className="max-w-6xl mx-auto px-4 pt-8">
      <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  </div>
));
RouteLoadingFallback.displayName = 'RouteLoadingFallback';

// Routes component — memoized to avoid re-renders from parent
const AnimatedRoutes = memo(() => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div key={location.pathname} className="animate-in fade-in duration-200">
      <Routes location={location}>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/*" element={<AuthPage />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/domain/:domainName" element={<DomainDetailPage />} />
        <Route path="/domains/:domainName" element={<DomainDetailPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/user-center" element={<ProtectedRoute><UserCenter /></ProtectedRoute>} />
        <Route path="/user-center/*" element={<ProtectedRoute><UserCenter /></ProtectedRoute>} />
        <Route path="/domain-management" element={<ProtectedRoute><DomainManagement /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminPanel /></ProtectedRoute>} />
        <Route path="/admin/*" element={<ProtectedRoute adminOnly={true}><AdminPanel /></ProtectedRoute>} />
        <Route path="/domain-verification/:domainId" element={<ProtectedRoute><DomainVerification /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:profileId" element={<UserProfilePage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/*" element={<ResetPassword />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/security-center" element={<SecurityCenter />} />
        <Route path="/community" element={<Community />} />
        <Route path="/sell" element={<SellDomainPage />} />
        <Route path="/transaction/:id" element={<ProtectedRoute><TransactionDetail /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
});
AnimatedRoutes.displayName = 'AnimatedRoutes';

function App() {
  useEffect(() => {
    // Preload critical routes after first paint
    const timer = setTimeout(() => {
      import('./pages/Marketplace').catch(() => {});
      import('./components/domain/DomainDetailPage').catch(() => {});
    }, 1500);
    
    // Preload secondary routes after idle
    const timer2 = setTimeout(() => {
      import('./pages/AuthPage').catch(() => {});
      import('./pages/UserCenter').catch(() => {});
      import('./pages/Dashboard').catch(() => {});
    }, 4000);
    
    return () => { clearTimeout(timer); clearTimeout(timer2); };
  }, []);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <CustomScripts />
      <PWAInstallBanner />
      <Suspense fallback={<RouteLoadingFallback />}>
        <AnimatedRoutes />
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
