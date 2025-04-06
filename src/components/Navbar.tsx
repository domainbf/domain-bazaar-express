
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { useState } from 'react';
import { AuthModal } from './AuthModal';
import { Loader2, User } from 'lucide-react';

export const Navbar = () => {
  const { user, profile, signOut, isLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      toast.success('登出成功');
      navigate('/');
    } finally {
      setIsSigningOut(false);
    }
  };

  // Get user display name
  const getUserDisplayName = () => {
    // Using optional chaining to safely access properties
    if (profile?.first_name) return profile.first_name;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email.split('@')[0];
    return '用户';
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
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="animate-spin h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">加载中...</span>
            </div>
          ) : user ? (
            <>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-700" />
                <span className="text-gray-700">您好, {getUserDisplayName()}</span>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin w-4 h-4" />
                    登出中...
                  </span>
                ) : '登出'}
              </Button>
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
