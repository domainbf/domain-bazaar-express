
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { useState } from 'react';
import { AuthModal } from './AuthModal';

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <nav className="border-b border-gray-200 py-4 px-6 bg-white">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <Link to="/" className="text-2xl font-bold text-gray-900">DomainMarket</Link>
          
          <div className="hidden md:flex space-x-6">
            <Link to="/marketplace" className="text-gray-700 hover:text-gray-900">Marketplace</Link>
            
            {user && (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-gray-900">Dashboard</Link>
                <Link to="/user-center" className="text-gray-700 hover:text-gray-900">User Center</Link>
              </>
            )}
            
            {/* Add admin link for users with admin role */}
            {user && user.app_metadata?.role === 'admin' && (
              <Link to="/admin" className="text-gray-700 hover:text-gray-900">Admin</Link>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-gray-700">Hello, {user.email}</span>
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <Button onClick={() => setIsAuthModalOpen(true)}>Login / Register</Button>
          )}
        </div>
      </div>

      <AuthModal open={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </nav>
  );
};
