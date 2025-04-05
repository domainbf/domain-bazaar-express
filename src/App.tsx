
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from "sonner";
import { useEffect } from 'react';
import Index from './pages/Index';
import { Marketplace } from './pages/Marketplace';
import { Dashboard } from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import { DomainVerification } from './pages/DomainVerification';
import { Profile } from './pages/Profile';
import { ResetPassword } from './pages/ResetPassword';
import { UserCenter } from './pages/UserCenter';
import { UserProfilePage } from './pages/UserProfile';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { initializeAdminUser } from './utils/adminInitialization';

function App() {
  useEffect(() => {
    // Initialize admin user on first load
    initializeAdminUser().catch(console.error);
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/marketplace" element={<Marketplace />} />
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
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}

export default App;
