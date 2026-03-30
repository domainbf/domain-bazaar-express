
import React, { useState, useCallback } from "react";
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
import { LogOut, Settings, User, Bell, Menu, X, MessageSquare, Globe, Tag, Gavel } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchDomainListings } from '@/hooks/useDomainListings';
import { useTheme } from 'next-themes';

interface NavbarProps {
  unreadCount?: number;
  unreadMessages?: number;
}

export const Navbar = ({ unreadCount = 0, unreadMessages: unreadMessagesProp = 0 }: NavbarProps) => {
  const { user, logOut, isAdmin } = useAuth();
  const { unreadMessages: fetchedUnreadMessages } = useUnreadMessages();
  const unreadMessages = fetchedUnreadMessages || unreadMessagesProp;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { config: siteConfig } = useSiteSettings();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const logoSrc = (isDark && siteConfig.logo_dark_url) ? siteConfig.logo_dark_url : (siteConfig.logo_url || '/lovable-uploads/nic.png');
  const actualUnreadCount = unreadCount;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const queryClient = useQueryClient();

  // Prefetch marketplace data on nav link hover for instant navigation
  const handleMarketplaceHover = useCallback(() => {
    prefetchDomainListings(queryClient);
    import('../pages/Marketplace').catch(() => {});
  }, [queryClient]);

  // Prefetch route chunks on hover for other key links
  const prefetchRoute = useCallback((importFn: () => Promise<unknown>) => {
    importFn().catch(() => {});
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      await logOut();
      navigate('/');
      toast({ title: "登出成功", description: "您已成功登出" });
    } catch (error) {
      console.error('Logout error:', error);
      toast({ variant: "destructive", title: "登出失败", description: "请稍后重试" });
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
        <div className="flex items-center space-x-1">
          <ThemeToggle />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => handleNavigation('/dashboard')} className="h-10 w-10 rounded-full hover:bg-accent transition-colors">
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>控制面板</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => handleNavigation('/user-center')} className="h-10 w-10 rounded-full hover:bg-accent transition-colors">
                <User className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>用户中心</p></TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleNavigation('/user-center?tab=messages')}
                className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-accent transition-colors"
                title="消息"
                data-testid="navbar-messages"
              >
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                {unreadMessages > 0 && (
                  <Badge className="bg-destructive absolute -top-1 -right-1 px-1.5 py-0 text-xs font-bold flex items-center justify-center min-w-[1.25rem] h-5">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </Badge>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>站内消息 {unreadMessages > 0 && `(${unreadMessages})`}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleNavigation('/user-center?tab=notifications')}
                className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-accent transition-colors"
                title="通知"
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
                {actualUnreadCount > 0 && (
                  <Badge className="bg-destructive absolute -top-1 -right-1 px-1.5 py-0 text-xs font-bold flex items-center justify-center min-w-[1.25rem] h-5">
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
                <Button variant="ghost" size="sm" onClick={() => handleNavigation('/admin')} className="px-3 py-1 text-sm bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                  管理
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>管理员面板</p></TooltipContent>
            </Tooltip>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleLogout} disabled={isLoggingOut} className="h-10 w-10 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut className={`h-5 w-5 ${isLoggingOut ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>退出登录</p></TooltipContent>
          </Tooltip>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={() => handleNavigation('/auth')} className="px-5">
            登录
          </Button>
          <Button size="sm" onClick={() => handleNavigation('/auth')} className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-5">
            注册
          </Button>
        </div>
      )}
    </>
  );

  return (
    <nav className="w-full bg-background/95 backdrop-blur-md shadow-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
          <img 
            src={logoSrc} 
            alt={siteConfig.site_name || '域见•你'} 
            className="h-10 w-auto" 
            onError={(e) => {
              const target = e.currentTarget;
              const nextElement = target.nextElementSibling as HTMLElement;
              target.style.display = 'none';
              if (nextElement) nextElement.style.display = 'block';
            }}
          />
          <span className="text-2xl font-bold text-foreground" style={{ display: 'none' }}>
            {siteConfig.site_name || '域见•你'}
          </span>
        </Link>

        {/* Desktop Center Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            to="/marketplace"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
            data-testid="nav-marketplace"
            onMouseEnter={handleMarketplaceHover}
          >
            <Globe className="h-4 w-4" />
            域名市场
          </Link>
          <Link
            to="/auctions"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
            data-testid="nav-auctions"
            onMouseEnter={() => prefetchRoute(() => import('../pages/AuctionsPage'))}
          >
            <Gavel className="h-4 w-4" />
            域名竞拍
          </Link>
          <Link
            to="/sell"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
            data-testid="nav-sell"
            onMouseEnter={() => prefetchRoute(() => import('../pages/SellDomain'))}
          >
            <Tag className="h-4 w-4" />
            出售域名
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center">
          <TooltipProvider>
            <NavigationItems />
          </TooltipProvider>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="h-10 w-10">
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 py-4 space-y-2">
            <Button variant="ghost" className="w-full justify-start" onClick={() => handleNavigation('/marketplace')}>
              <Globe className="h-4 w-4 mr-2" />域名市场
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => handleNavigation('/auctions')}>
              <Gavel className="h-4 w-4 mr-2" />域名竞拍
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => handleNavigation('/sell')}>
              <Tag className="h-4 w-4 mr-2" />出售域名
            </Button>
            {user ? (
              <>
                <div className="border-t border-border my-2" />
                <Button variant="ghost" className="w-full justify-start" onClick={() => handleNavigation('/user-center')}>
                  <User className="h-4 w-4 mr-2" />用户中心
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => handleNavigation('/user-center?tab=notifications')}>
                  <Bell className="h-4 w-4 mr-2" />通知
                  {actualUnreadCount > 0 && (
                    <Badge className="ml-auto bg-destructive text-destructive-foreground">
                      {actualUnreadCount > 99 ? '99+' : actualUnreadCount}
                    </Badge>
                  )}
                </Button>
                {isAdmin && (
                  <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => handleNavigation('/admin')}>
                    管理员面板
                  </Button>
                )}
                <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout} disabled={isLoggingOut}>
                  <LogOut className={`h-4 w-4 mr-2 ${isLoggingOut ? 'animate-spin' : ''}`} />退出登录
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="w-full justify-center" onClick={() => handleNavigation('/auth')}>
                  登录
                </Button>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => handleNavigation('/auth')}>
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
