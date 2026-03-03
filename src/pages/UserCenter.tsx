import { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserCenterHelpCard } from '@/components/usercenter/UserCenterHelpCard';
import { UserCenterStatsGrid } from '@/components/usercenter/UserCenterStatsGrid';
import { UserCenterTabsContent } from '@/components/usercenter/UserCenterTabsContent';
import { QuickActions } from '@/components/usercenter/QuickActions';
import { Button } from "@/components/ui/button";
import { HelpCircle, ClipboardList, User, Bell, MessageSquare, FileQuestion, ArrowLeft, Shield, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { useNotifications } from '@/hooks/useNotifications';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Card, CardContent } from "@/components/ui/card";
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from 'framer-motion';

export const UserCenter = () => {
  const { user, profile, isLoading: isAuthLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('domains');
  const [showHelp, setShowHelp] = useState(false);
  const isMobile = useIsMobile();

  const { unreadCount, refreshNotifications } = useNotifications();

  const displayName = useMemo(() => {
    return profile?.full_name || profile?.username || user?.email?.split('@')[0] || '用户';
  }, [profile?.full_name, profile?.username, user?.email]);

  const avatarInitial = useMemo(() => {
    return displayName.charAt(0).toUpperCase();
  }, [displayName]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      toast.error('会话已失效，请重新登录');
      navigate('/auth', { replace: true });
    }
  }, [isAuthLoading, user, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['domains', 'transactions', 'profile', 'notifications'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      const newTab = event.detail?.tab;
      if (newTab && ['domains', 'transactions', 'profile', 'notifications'].includes(newTab)) {
        setActiveTab(newTab);
        if (newTab === 'notifications') refreshNotifications();
      }
    };
    window.addEventListener('tabChange', handleTabChange as EventListener);
    return () => window.removeEventListener('tabChange', handleTabChange as EventListener);
  }, [refreshNotifications]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    window.history.replaceState({}, '', `/user-center?tab=${value}`);
    if (value === 'notifications') refreshNotifications();
  }, [refreshNotifications]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">正在加载用户中心...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4 text-foreground">需要登录</h2>
            <p className="text-muted-foreground mb-4">请登录后访问用户中心</p>
            <Button onClick={() => navigate('/auth')}>前往登录</Button>
          </div>
        </div>
      </div>
    );
  }

  const tabItems = [
    { value: 'domains', label: '我的域名', shortLabel: '域名', icon: ClipboardList },
    { value: 'transactions', label: '交易记录', shortLabel: '交易', icon: ClipboardList },
    { value: 'notifications', label: '消息通知', shortLabel: '通知', icon: Bell, badge: unreadCount },
    { value: 'profile', label: '个人资料', shortLabel: '我的', icon: User },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar unreadCount={unreadCount} />
      
      <div className={isMobile ? 'pb-20' : ''}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* 用户信息头部 - 增强视觉设计 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="mb-6 overflow-hidden border-none shadow-md">
              <div className="bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground">
                <CardContent className="p-5 sm:p-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-3 border-primary-foreground/20 shadow-xl ring-2 ring-primary-foreground/10 ring-offset-2 ring-offset-primary">
                          <AvatarImage src={profile?.avatar_url || ''} />
                          <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xl sm:text-2xl font-bold backdrop-blur-sm">
                            {avatarInitial}
                          </AvatarFallback>
                        </Avatar>
                        {profile?.seller_verified && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-primary">
                            <Shield className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h1 className="text-xl sm:text-2xl font-bold">{displayName}</h1>
                          {isAdmin && (
                            <Badge className="bg-primary-foreground/20 text-primary-foreground border-none text-[10px] px-1.5">
                              <Sparkles className="w-3 h-3 mr-0.5" />
                              管理员
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-primary-foreground/70 mt-0.5">{user?.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {profile?.is_seller && (
                            <Badge className="bg-primary-foreground/15 text-primary-foreground border-none text-xs">
                              认证卖家
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <Button 
                        onClick={() => navigate('/')}
                        variant="secondary" 
                        size={isMobile ? "sm" : "default"}
                        className="flex items-center gap-2 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 border-none"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        {!isMobile && "返回首页"}
                      </Button>
                      
                      <Button
                        variant="secondary"
                        size={isMobile ? "sm" : "default"}
                        onClick={() => setShowHelp(!showHelp)}
                        className="flex items-center gap-2 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 border-none"
                      >
                        <HelpCircle className="h-4 w-4" />
                        {!isMobile && "帮助"}
                      </Button>
                      
                      {isAdmin && (
                        <Button 
                          onClick={() => navigate('/admin')}
                          size={isMobile ? "sm" : "default"}
                          className="flex items-center gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                        >
                          <Shield className="w-4 h-4" />
                          {isMobile ? "管理" : "管理面板"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </motion.div>

          <UserCenterHelpCard open={showHelp} onClose={() => setShowHelp(false)} />
          
          {/* 快捷操作面板 */}
          {!isMobile && (
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <QuickActions onViewNotifications={() => handleTabChange('notifications')} />
            </motion.div>
          )}
          
          {/* 统计数据网格 */}
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <UserCenterStatsGrid profile={profile} user={user} />
          </motion.div>

          {/* 主要功能标签页 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Card className="shadow-sm overflow-hidden">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="border-b border-border bg-background">
                  <TabsList className={`w-full justify-start bg-transparent h-auto p-0 ${isMobile ? 'grid grid-cols-4' : 'flex'}`}>
                    {tabItems.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <TabsTrigger 
                          key={tab.value}
                          value={tab.value} 
                          className={`
                            flex items-center gap-2 rounded-none border-b-2 border-transparent
                            data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary
                            transition-all
                            ${isMobile ? 'flex-col py-3 px-2 text-xs' : 'py-4 px-6'}
                          `}
                        >
                          <div className="relative">
                            <Icon className="w-4 h-4" />
                            {tab.badge && tab.badge > 0 && (
                              <Badge 
                                variant="destructive" 
                                className="absolute -top-2 -right-3 h-4 min-w-4 flex items-center justify-center text-[10px] p-0"
                              >
                                {tab.badge > 99 ? '99+' : tab.badge}
                              </Badge>
                            )}
                          </div>
                          <span>{isMobile ? tab.shortLabel : tab.label}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>

                <div className={isMobile ? "p-4" : "p-6"}>
                  <UserCenterTabsContent />
                </div>
              </Tabs>
            </Card>
          </motion.div>
          
          {/* 帮助和支持区域 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="mt-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className={isMobile ? "p-4 text-center" : "p-6 text-center"}>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <MessageSquare className={isMobile ? "w-4 h-4 text-primary" : "w-5 h-5 text-primary"} />
                  <h3 className={isMobile ? "text-base font-semibold" : "text-lg font-semibold"}>需要帮助？</h3>
                </div>
                <p className={`text-muted-foreground ${isMobile ? "text-sm mb-3" : "mb-4"}`}>
                  我们的客户服务团队随时为您提供支持
                </p>
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center">
                  <Link to="/contact">
                    <Button variant="outline" size={isMobile ? "sm" : "default"} className="flex items-center gap-2 w-full sm:w-auto">
                      <MessageSquare className="w-4 h-4" />
                      联系客服
                    </Button>
                  </Link>
                  <Link to="/faq">
                    <Button variant="outline" size={isMobile ? "sm" : "default"} className="flex items-center gap-2 w-full sm:w-auto">
                      <FileQuestion className="w-4 h-4" />
                      常见问题
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {isMobile && <BottomNavigation unreadCount={unreadCount} />}
    </div>
  );
};

export default UserCenter;
