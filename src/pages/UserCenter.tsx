import { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserCenterStatsGrid } from '@/components/usercenter/UserCenterStatsGrid';
import { UserCenterTabsContent } from '@/components/usercenter/UserCenterTabsContent';
import { ProfileSettings } from '@/components/usercenter/ProfileSettings';
import { AccountSecurity } from '@/components/usercenter/AccountSecurity';
import { Button } from "@/components/ui/button";
import {
  ClipboardList, User, Bell, MessageSquare, ArrowLeft,
  Shield, Sparkles, ChevronRight, Globe, Settings, HeadphonesIcon
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useNotifications } from '@/hooks/useNotifications';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from 'framer-motion';

const VALID_TABS = ['domains', 'transactions', 'messages', 'profile', 'notifications', 'profile-settings', 'profile-security'];

const SECTION_LABELS: Record<string, string> = {
  domains: '我的域名',
  transactions: '交易记录',
  messages: '站内消息',
  notifications: '消息通知',
  profile: '个人中心',
  'profile-settings': '个人资料',
  'profile-security': '账户安全',
};

export const UserCenter = () => {
  const { user, profile, isLoading: isAuthLoading, isAdmin } = useAuth();
  const { config: siteConfig } = useSiteSettings();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('domains');
  const isMobile = useIsMobile();

  const { unreadCount, refreshNotifications } = useNotifications();
  const { unreadMessages } = useUnreadMessages();

  const displayName = useMemo(
    () => profile?.full_name || profile?.username || user?.email?.split('@')[0] || '用户',
    [profile?.full_name, profile?.username, user?.email]
  );
  const avatarInitial = useMemo(() => displayName.charAt(0).toUpperCase(), [displayName]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      toast.error('会话已失效，请重新登录');
      navigate('/auth', { replace: true });
    }
  }, [isAuthLoading, user, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && VALID_TABS.includes(tabParam)) setActiveTab(tabParam);
  }, []);

  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      const newTab = event.detail?.tab;
      if (newTab && VALID_TABS.includes(newTab)) {
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
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-3 text-foreground">需要登录</h2>
            <p className="text-muted-foreground mb-5 text-sm">请登录后访问用户中心</p>
            <Button onClick={() => navigate('/auth')}>前往登录</Button>
          </div>
        </div>
      </div>
    );
  }

  const desktopTabs = [
    { value: 'domains', label: '我的域名', icon: Globe },
    { value: 'transactions', label: '交易记录', icon: ClipboardList },
    { value: 'messages', label: '站内消息', icon: MessageSquare, badge: unreadMessages },
    { value: 'notifications', label: '消息通知', icon: Bell, badge: unreadCount },
    { value: 'profile', label: '个人资料', icon: User },
  ];

  /* ─── MOBILE LAYOUT ─────────────────────────────────────────── */
  if (isMobile) {
    const isSubPage = activeTab === 'profile-settings' || activeTab === 'profile-security';
    return (
      <div className="min-h-screen bg-muted/30" style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
        {/* Mobile top bar — compact section header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center h-12 px-4 gap-3">
            <button
              onClick={() => isSubPage ? handleTabChange('profile') : navigate('/')}
              className="text-muted-foreground hover:text-foreground transition-colors -ml-1"
              data-testid="mobile-back-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[15px] font-semibold text-foreground flex-1">
              {SECTION_LABELS[activeTab] || '用户中心'}
            </h1>
            {activeTab === 'notifications' && unreadCount > 0 && (
              <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
            {activeTab === 'messages' && unreadMessages > 0 && (
              <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </Badge>
            )}
          </div>
        </div>

        {/* Content: profile gets its own special layout */}
        {activeTab === 'profile' ? (
          <MobileProfileSection
            user={user}
            profile={profile}
            isAdmin={isAdmin}
            displayName={displayName}
            avatarInitial={avatarInitial}
            unreadCount={unreadCount}
            onTabChange={handleTabChange}
            navigate={navigate}
          />
        ) : (
          <div className="px-4 pt-4">
            {/* Stats strip only on domains/transactions */}
            {(activeTab === 'domains' || activeTab === 'transactions') && (
              <div className="mb-4">
                <UserCenterStatsGrid profile={profile} user={user} compact />
              </div>
            )}
            <MobileTabContent activeTab={activeTab} />
          </div>
        )}

      </div>
    );
  }

  /* ─── DESKTOP LAYOUT ─────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar unreadCount={unreadCount} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Desktop profile header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 rounded-xl overflow-hidden shadow-md border border-border bg-gradient-to-br from-foreground to-foreground/90 text-background dark:from-card dark:via-muted/60 dark:to-card dark:text-foreground"
        >
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-background/20 dark:border-foreground/20 shadow-xl">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="bg-background/20 dark:bg-foreground/20 text-background dark:text-foreground text-xl sm:text-2xl font-bold">
                      {avatarInitial}
                    </AvatarFallback>
                  </Avatar>
                  {profile?.seller_verified && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-background dark:border-foreground/20">
                      <Shield className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold">{displayName}</h1>
                    {isAdmin && (
                      <Badge className="bg-background/20 dark:bg-foreground/20 text-background dark:text-foreground border-none text-[10px] px-1.5">
                        <Sparkles className="w-3 h-3 mr-0.5" />管理员
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-background/70 dark:text-foreground/70 mt-0.5">{user?.email}</p>
                  {profile?.is_seller && (
                    <Badge className="mt-2 bg-background/15 dark:bg-foreground/15 text-background dark:text-foreground border-none text-xs">
                      认证卖家
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => navigate('/')}
                  variant="secondary"
                  className="bg-background/10 dark:bg-foreground/10 text-background dark:text-foreground hover:bg-background/20 dark:hover:bg-foreground/20 border-none"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />返回首页
                </Button>
                {isAdmin && (
                  <Button
                    onClick={() => navigate('/admin')}
                    className="bg-background dark:bg-foreground text-foreground dark:text-background hover:bg-background/90 dark:hover:bg-foreground/90"
                  >
                    <Shield className="w-4 h-4 mr-2" />管理面板
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Desktop stats */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <UserCenterStatsGrid profile={profile} user={user} />
        </motion.div>

        {/* Desktop tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="border-b border-border bg-background">
                <TabsList className="flex w-full justify-start bg-transparent h-auto p-0">
                  {desktopTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="flex items-center gap-2 rounded-none border-b-2 border-transparent
                          data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary
                          transition-all py-4 px-6"
                      >
                        <div className="relative">
                          <Icon className="w-4 h-4" />
                          {tab.badge != null && tab.badge > 0 && (
                            <Badge
                              variant="destructive"
                              className="absolute -top-2 -right-3 h-4 min-w-4 flex items-center justify-center text-[10px] p-0"
                            >
                              {tab.badge > 99 ? '99+' : tab.badge}
                            </Badge>
                          )}
                        </div>
                        <span>{tab.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>
              <div className="p-6">
                <UserCenterTabsContent />
              </div>
            </Tabs>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────
   Mobile: Profile page (iOS Settings style)
──────────────────────────────────────────────────────────────────── */
function MobileProfileSection({
  user, profile, isAdmin, displayName, avatarInitial, unreadCount, onTabChange, navigate,
}: {
  user: any; profile: any; isAdmin: boolean; displayName: string; avatarInitial: string;
  unreadCount: number; onTabChange: (tab: string) => void; navigate: (path: string) => void;
}) {
  const { config: siteConfig } = useSiteSettings();
  const sections = [
    {
      title: '账户功能',
      items: [
        { label: '我的域名', icon: Globe, tab: 'domains', desc: '管理在售域名' },
        { label: '交易记录', icon: ClipboardList, tab: 'transactions', desc: '报价、成交、托管' },
        { label: '消息通知', icon: Bell, tab: 'notifications', badge: unreadCount, desc: '系统与交易通知' },
      ],
    },
    {
      title: '账户设置',
      items: [
        { label: '个人资料', icon: User, tab: 'profile-settings', desc: '修改姓名、头像' },
        { label: '账户安全', icon: Shield, tab: 'profile-security', desc: '密码、两步验证' },
        ...(isAdmin ? [{ label: '管理面板', icon: Settings, tab: '__admin', desc: '后台管理' }] : []),
      ],
    },
  ];

  const handleItemTap = (tab: string) => {
    if (tab === '__admin') { navigate('/admin'); return; }
    onTabChange(tab);
  };

  return (
    <div className="px-4 pt-4 pb-6 space-y-5">
      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-card rounded-2xl border border-border overflow-hidden"
      >
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 px-5 py-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-[60px] w-[60px] border-2 border-background dark:border-foreground/20-foreground/20 shadow-lg">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-background/20 dark:bg-foreground/20 text-background dark:text-foreground text-xl font-bold">
                  {avatarInitial}
                </AvatarFallback>
              </Avatar>
              {profile?.seller_verified && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-background dark:border-foreground/20">
                  <Shield className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold text-primary-foreground truncate">{displayName}</span>
                {isAdmin && (
                  <Badge className="bg-background/20 dark:bg-foreground/20 text-background dark:text-foreground border-none text-[10px] px-1.5 h-5 shrink-0">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" />管理员
                  </Badge>
                )}
              </div>
              <p className="text-xs text-primary-foreground/60 mt-0.5 truncate">{user?.email}</p>
              {profile?.is_seller && (
                <Badge className="mt-1.5 bg-primary-foreground/15 text-primary-foreground border-none text-[10px] h-5">
                  认证卖家
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <UserCenterStatsGrid profile={profile} user={user} compact mobileRow />
      </motion.div>

      {/* Settings sections */}
      {sections.map((section, si) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 + si * 0.06 }}
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
            {section.title}
          </p>
          <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {section.items.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleItemTap(item.tab)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 active:bg-muted transition-colors text-left"
                  data-testid={`mobile-nav-${item.tab}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  {item.badge != null && item.badge > 0 && (
                    <Badge variant="destructive" className="text-[10px] h-5 px-1.5 shrink-0">
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                </button>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Log out */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <button
            onClick={() => siteConfig.contact_email ? window.open(`mailto:${siteConfig.contact_email}`, '_blank') : undefined}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 active:bg-muted transition-colors text-left"
            data-testid="mobile-nav-support"
          >
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <HeadphonesIcon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">联系支持</p>
              <p className="text-xs text-muted-foreground">{siteConfig.contact_email || '请在后台配置联系邮箱'}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Mobile: Tab content wrapper (no card wrapper, full bleed)
──────────────────────────────────────────────────────────────────── */
function MobileTabContent({ activeTab }: { activeTab: string }) {
  if (activeTab === 'profile-settings') {
    return <div className="pb-4"><ProfileSettings /></div>;
  }
  if (activeTab === 'profile-security') {
    return <div className="pb-4"><AccountSecurity /></div>;
  }
  return (
    <Tabs value={activeTab} className="w-full">
      <UserCenterTabsContent />
    </Tabs>
  );
}

export default UserCenter;
