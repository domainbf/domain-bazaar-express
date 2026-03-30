
import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, Suspense, lazy, memo } from 'react';

import { ErrorBoundary } from 'react-error-boundary';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { CustomScripts } from './components/common/CustomScripts';
import { PWAInstallBanner } from './components/pwa/PWAInstallBanner';
import { TopProgressBar } from './components/common/TopProgressBar';
import { GlobalBottomNav } from './components/mobile/GlobalBottomNav';

// Route-based code splitting
const Index = lazy(() => import('./pages/Index'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const Marketplace = lazy(() => import('./pages/Marketplace').then(m => ({ default: m.Marketplace })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const AdminPanel = lazy(() => import('./pages/AdminPanel').then(m => ({ default: m.AdminPanel })));
const DomainVerification = lazy(() => import('./pages/DomainVerification').then(m => ({ default: m.DomainVerification })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const AuthCallback = lazy(() => import('./pages/AuthCallback').then(m => ({ default: m.AuthCallback })));
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
const AuctionsPage = lazy(() => import('./pages/AuctionsPage').then(m => ({ default: m.AuctionsPage })));
const ValuationPage = lazy(() => import('./pages/ValuationPage'));
const DomainMonitorPage = lazy(() => import('./pages/DomainMonitorPage'));
const EscrowPage = lazy(() => import('./pages/EscrowPage'));
const SellerPage = lazy(() => import('./pages/SellerPage'));
const BulkListingPage = lazy(() => import('./pages/BulkListingPage'));
const DisputePage = lazy(() => import('./pages/DisputePage'));
const PlatformServicesPage = lazy(() => import('./pages/PlatformServicesPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const DisclaimerPage = lazy(() => import('./pages/DisclaimerPage'));

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  // Detect chunk-load / dynamic-import failures (stale service worker cache)
  const isChunkError = !!(
    error?.message?.includes('dynamically imported module') ||
    error?.message?.includes('Loading chunk') ||
    error?.message?.includes('Failed to fetch') ||
    error?.name === 'ChunkLoadError'
  );

  // Auto-reload once when a chunk error is detected
  useEffect(() => {
    if (!isChunkError) return;
    const reloaded = sessionStorage.getItem('_chunk_reload');
    if (!reloaded) {
      sessionStorage.setItem('_chunk_reload', '1');
      window.location.reload();
    }
  }, [isChunkError]);

  if (isChunkError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center p-8 bg-card rounded-lg shadow-lg max-w-md w-full border border-border">
          <h2 className="text-xl font-bold text-foreground mb-3">正在更新…</h2>
          <p className="text-muted-foreground text-sm mb-4">检测到新版本，页面将自动刷新。</p>
          <button onClick={() => window.location.reload()} className="w-full px-4 py-3 bg-foreground text-background rounded-lg font-medium">
            立即刷新
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center p-8 bg-card rounded-lg shadow-lg max-w-md w-full border border-border">
        <h2 className="text-2xl font-bold text-destructive mb-4">页面加载出错</h2>
        <p className="text-muted-foreground mb-4">抱歉，页面遇到了问题。请尝试刷新页面或返回首页。</p>
        {error?.message && (
          <p className="text-xs text-muted-foreground/60 bg-muted rounded px-3 py-2 mb-4 text-left font-mono break-all">
            {error.message}
          </p>
        )}
        <div className="space-y-3">
          <button onClick={resetErrorBoundary} className="w-full px-4 py-3 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-medium">
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

// Minimal skeleton loading — theme-aware, no hard-coded colors
const RouteLoadingFallback = memo(() => (
  <div className="min-h-screen bg-background">
    <div className="h-14 border-b border-border skeleton-shimmer" />
    <div className="max-w-6xl mx-auto px-4 pt-8">
      <div className="h-8 w-48 rounded-lg skeleton-shimmer mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-14 rounded-full skeleton-shimmer" />
              <div className="h-6 w-6 rounded-full skeleton-shimmer" />
            </div>
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="h-10 w-4/5 rounded-lg skeleton-shimmer" />
              <div className="h-4 w-20 rounded skeleton-shimmer" />
              <div className="h-3 w-3/4 rounded skeleton-shimmer" />
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
              <div className="flex-1 h-8 rounded-lg skeleton-shimmer" />
              <div className="flex-1 h-8 rounded-lg skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
));
RouteLoadingFallback.displayName = 'RouteLoadingFallback';

// Routes component — NO key on wrapper: avoids full subtree remounts on every navigation
// Each page's own mount animation handles the visual transition
const AnimatedRoutes = memo(() => {
  const location = useLocation();


  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <>
      <TopProgressBar />
      <div key={location.pathname} className="animate-in">
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
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/security-center" element={<SecurityCenter />} />
        <Route path="/community" element={<Community />} />
        <Route path="/sell" element={<SellDomainPage />} />
        <Route path="/transaction/:id" element={<ProtectedRoute><TransactionDetail /></ProtectedRoute>} />
        <Route path="/auctions" element={<AuctionsPage />} />
        <Route path="/valuation" element={<ValuationPage />} />
        <Route path="/domain-monitor" element={<DomainMonitorPage />} />
        <Route path="/escrow" element={<EscrowPage />} />
        <Route path="/seller" element={<SellerPage />} />
        <Route path="/bulk-listing" element={<BulkListingPage />} />
        <Route path="/dispute" element={<DisputePage />} />
        <Route path="/platform-services" element={<PlatformServicesPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </div>
    </>
  );
});
AnimatedRoutes.displayName = 'AnimatedRoutes';

function App() {
  useEffect(() => {
    // Preload bottom-nav pages immediately (these are the most visited)
    import('./pages/Marketplace').catch(() => {});
    import('./pages/AuctionsPage').catch(() => {});
    import('./pages/UserCenter').catch(() => {});

    // Preload secondary routes after first paint settles
    const timer = setTimeout(() => {
      import('./components/domain/DomainDetailPage').catch(() => {});
      import('./pages/AuthPage').catch(() => {});
      import('./pages/Dashboard').catch(() => {});
      import('./pages/SellDomain').catch(() => {});
    }, 800);
    
    // Preload remaining pages in idle time
    const timer2 = setTimeout(() => {
      import('./pages/FAQPage').catch(() => {});
      import('./pages/ContactPage').catch(() => {});
      import('./pages/ValuationPage').catch(() => {});
      import('./pages/HelpPage').catch(() => {});
    }, 3000);
    
    return () => { clearTimeout(timer); clearTimeout(timer2); };
  }, []);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <CustomScripts />
      <PWAInstallBanner />
      <Suspense fallback={<RouteLoadingFallback />}>
        <AnimatedRoutes />
      </Suspense>
      {/* GlobalBottomNav must be OUTSIDE the animated routes wrapper.
          The animate-slide-up transform creates a new containing block
          which breaks position:fixed on children. Rendering here ensures
          the nav is always fixed to the viewport on mobile. */}
      <GlobalBottomNav />
    </ErrorBoundary>
  );
}

export default App;
