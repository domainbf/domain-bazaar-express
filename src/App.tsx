
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "sonner";
import Index from './pages/Index'; // Fixed import
import { Marketplace } from './pages/Marketplace';
import { Dashboard } from './pages/Dashboard';
import { AdminPanel } from './pages/AdminPanel';
import { DomainVerification } from './pages/DomainVerification';
import { Profile } from './pages/Profile';
import { ResetPassword } from './pages/ResetPassword';
import { UserCenter } from './pages/UserCenter';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
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
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </Router>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
