import { Routes, Route } from 'react-router-dom';
import { Toaster } from "sonner";
import { useEffect } from 'react';
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

function App() {
  useEffect(() => {
    // Initialize admin user on first load
    initializeAdminUser().catch(console.error);
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthPage />} />
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
          path="/admin" 
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
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:profileId" element={<UserProfilePage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FAQPage />} />
        {/* 404 页面必须放在最后 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}

export default App;
