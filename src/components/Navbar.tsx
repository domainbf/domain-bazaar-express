
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { useState } from 'react';
import { AuthModal } from './AuthModal';
import { Loader2, User, Settings } from 'lucide-react';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

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
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-md">
                    <User className="h-4 w-4 text-gray-700" />
                    <span className="text-gray-700">您好, {getUserDisplayName()}</span>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-2 p-2 md:w-[240px]">
                      <li className="row-span-1">
                        <NavigationMenuLink asChild>
                          <Link to="/user-center" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="text-sm font-medium leading-none">用户中心</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">管理个人资料和域名</p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li className="row-span-1">
                        <NavigationMenuLink asChild>
                          <Link to="/dashboard" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="text-sm font-medium leading-none">我的控制台</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">查看报表和域名数据</p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      {user.app_metadata?.role === 'admin' && (
                        <li className="row-span-1">
                          <NavigationMenuLink asChild>
                            <Link to="/admin" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                              <div className="text-sm font-medium leading-none">管理员</div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">管理系统和用户</p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      )}
                      <li className="row-span-1">
                        <button 
                          onClick={handleLogout}
                          disabled={isSigningOut}
                          className="block w-full select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none text-left transition-colors hover:bg-red-50 hover:text-red-600 focus:bg-accent focus:text-accent-foreground"
                        >
                          {isSigningOut ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="animate-spin w-4 h-4" />
                              <span>登出中...</span>
                            </div>
                          ) : (
                            <div className="text-sm font-medium leading-none">登出账号</div>
                          )}
                        </button>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          ) : (
            <Button onClick={() => setIsAuthModalOpen(true)}>登录 / 注册</Button>
          )}
        </div>
      </div>

      <AuthModal open={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </nav>
  );
};
