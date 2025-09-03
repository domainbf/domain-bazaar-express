
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast"
import { LogOut, Settings, User, Bell, Menu, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface NavbarProps {
  unreadCount?: number;
}

export const Navbar = ({ unreadCount = 0 }: NavbarProps) => {
  const { user, logOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [actualUnreadCount, setActualUnreadCount] = useState(unreadCount);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 获取实际的未读通知数量
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (user) {
        try {
          const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);
          
          if (!error && count !== null) {
            setActualUnreadCount(count);
          }
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      }
    };

    if (user && unreadCount === 0) {
      fetchUnreadCount();
    } else {
      setActualUnreadCount(unreadCount);
    }
  }, [user, unreadCount]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      await logOut();
      navigate('/');
      toast({
        title: "登出成功",
        description: "您已成功登出",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "登出失败",
        description: "请稍后重试",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const NavigationItems = () => (
    <>
      {user ? (
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleNavigation('/dashboard')} 
                className="h-10 w-10 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>控制面板</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleNavigation('/user-center')} 
                className="h-10 w-10 rounded-full hover:bg-gray-100 transition-colors"
              >
                <User className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>用户中心</p></TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleNavigation('/user-center?tab=notifications')}
                className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 transition-colors"
                title="通知"
              >
                <Bell className="w-5 h-5 text-gray-700" />
                {actualUnreadCount > 0 && (
                  <Badge className="bg-red-500 absolute -top-1 -right-1 px-1.5 py-0 text-xs font-bold flex items-center justify-center min-w-[1.25rem] h-5">
                    {actualUnreadCount > 99 ? '99+' : actualUnreadCount}
                  </Badge>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>通知 {actualUnreadCount > 0 && `(${actualUnreadCount})`}</p>
            </TooltipContent>
          </Tooltip>

          {isAdmin && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleNavigation('/admin')} 
                  className="px-3 py-1 text-sm bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                >
                  管理
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>管理员面板</p></TooltipContent>
            </Tooltip>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout} 
                disabled={isLoggingOut}
                className="h-10 w-10 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className={`h-5 w-5 ${isLoggingOut ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>退出登录</p></TooltipContent>
          </Tooltip>
        </div>
      ) : (
        <div className="flex items-center space-x-3">
          <Button variant="ghost" onClick={() => handleNavigation('/auth')}>
            登录
          </Button>
          <Button 
            onClick={() => handleNavigation('/auth')}
            className="bg-black text-white hover:bg-gray-800 transition-colors"
          >
            注册
          </Button>
        </div>
      )}
    </>
  );

  return (
    <nav className="w-full bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
          <img 
            src="/lovable-uploads/nic.png" 
            alt="NIC.BN" 
            className="h-10 w-auto" 
            onError={(e) => {
              // 如果图片加载失败，显示文字logo
              const target = e.currentTarget;
              const nextElement = target.nextElementSibling as HTMLElement;
              target.style.display = 'none';
              if (nextElement) {
                nextElement.style.display = 'block';
              }
            }}
          />
          <span 
            className="text-2xl font-bold text-gray-900"
            style={{ display: 'none' }}
          >
            NIC.BN
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center">
          <TooltipProvider>
            <NavigationItems />
          </TooltipProvider>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="h-10 w-10"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-4 space-y-2">
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  onClick={() => handleNavigation('/dashboard')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  控制面板
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  onClick={() => handleNavigation('/user-center')}
                >
                  <User className="h-4 w-4 mr-2" />
                  用户中心
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  onClick={() => handleNavigation('/user-center?tab=notifications')}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  通知
                  {actualUnreadCount > 0 && (
                    <Badge className="ml-auto bg-red-500 text-white">
                      {actualUnreadCount > 99 ? '99+' : actualUnreadCount}
                    </Badge>
                  )}
                </Button>
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-700" 
                    onClick={() => handleNavigation('/admin')}
                  >
                    管理员面板
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600" 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogOut className={`h-4 w-4 mr-2 ${isLoggingOut ? 'animate-spin' : ''}`} />
                  退出登录
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  onClick={() => handleNavigation('/auth')}
                >
                  登录
                </Button>
                <Button 
                  className="w-full bg-black text-white hover:bg-gray-800"
                  onClick={() => handleNavigation('/auth')}
                >
                  注册
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
