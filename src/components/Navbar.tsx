
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
    toast.success('登出成功');
    navigate('/');
  };

  return (
    <nav className="border-b border-gray-200 py-4 px-6 bg-white">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <Link to="/" className="text-2xl font-bold text-gray-900">NIC.BN</Link>
          
          <div className="hidden md:flex space-x-6">
            <Link to="/marketplace" className="text-gray-700 hover:text-gray-900">域名市场</Link>
            
            {user && (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-gray-900">我的控制台</Link>
                <Link to="/user-center" className="text-gray-700 hover:text-gray-900">用户中心</Link>
              </>
            )}
            
            {/* Add admin link for users with admin role */}
            {user && user.app_metadata?.role === 'admin' && (
              <Link to="/admin" className="text-gray-700 hover:text-gray-900">管理员</Link>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-gray-700">您好, {user.email}</span>
              <Button variant="outline" onClick={handleLogout}>登出</Button>
            </>
          ) : (
            <Button onClick={() => setIsAuthModalOpen(true)}>登录 / 注册</Button>
          )}
        </div>
      </div>

      <AuthModal open={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </nav>
  );
};
