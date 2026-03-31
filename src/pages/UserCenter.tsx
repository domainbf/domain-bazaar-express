import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserCenterStatsGrid } from '@/components/usercenter/UserCenterStatsGrid';
import { UserCenterTabsContent } from '@/components/usercenter/UserCenterTabsContent';
import { ComponentErrorBoundary } from '@/components/common/ComponentErrorBoundary';
import { ProfileSettings } from '@/components/usercenter/ProfileSettings';
import { AccountSecurity } from '@/components/usercenter/AccountSecurity';
import { Button } from "@/components/ui/button";
import {
  ClipboardList, User, Bell, MessageSquare, ArrowLeft,
  Shield, Sparkles, ChevronRight, Globe, Settings, HeadphonesIcon
} from 'lucide-react';
import { SupportTickets } from '@/components/support/SupportTickets';
import { Badge } from "@/components/ui/badge";
import { useNotifications } from '@/hooks/useNotifications';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from 'framer-motion';

const VALID_TABS = ['domains', 'transactions', 'messages', 'profile', 'notifications', 'profile-settings', 'profile-security', 'support'];

const SECTION_LABELS: Record<string, string> = {
  domains: '我的域名',
  transactions: '交易记录',
  messages: '站内消息',
  notifications: '消息通知',
  profile: '个人资料',
  'profile-settings': '个人资料',
  'profile-security': '账户安全',
  support: '联系支持',
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

  const sidebarNavGroups = [
    {
      title: '资产管理',
      items: [
        { value: 'domains', label: '我的域名', icon: Globe },
        { value: 'transactions', label: '交易记录', icon: ClipboardList },
      ],
    },
    {
      title: '消息中心',
      items: [
        { value: 'messages', label: '站内消息', icon: MessageSquare, badge: unreadMessages },
        { value: 'notifications', label: '消息通知', icon: Bell, badge: unreadCount },
      ],
    },
    {
      title: '账户',
      items: [
        { value: 'profile-settings', label: '个人资料', icon: User },
        { value: 'profile-security', label: '账户安全', icon: Shield },
        { value: 'support', label: '联系支持', icon: HeadphonesIcon },
      ],
    },
  ];

  /* ─── MOBILE LAYOUT ─────────────────────────────────────────── */
  if (isMobile) {
    const isSubPage = activeTab === 'profile-settings' || activeTab === 'profile-security';
    const isContentTab = ['domains', 'transactions', 'notifications', 'messages', 'support'].includes(activeTab);
    const handleBack = () => {
      if (isSubPage || isContentTab) handleTabChange('profile');
      else navigate('/');
    };
    return (
      <div className="min-h-screen bg-muted/30" style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
        {/* Mobile top bar — compact section header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center h-12 px-4 gap-3">
            <button
              onClick={handleBack}
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
          <ComponentErrorBoundary fallbackMessage="个人中心加载失败，请刷新重试">
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
          </ComponentErrorBoundary>
        ) : (
          <div className="px-4 pt-4">
            {/* Stats strip only on domains/transactions */}
            {(activeTab === 'domains' || activeTab === 'transactions') && (
              <div className="mb-4">
                <ComponentErrorBoundary fallbackMessage="统计数据加载失败">
                  <UserCenterStatsGrid profile={profile} user={user} compact />
                </ComponentErrorBoundary>
              </div>
            )}
            <ComponentErrorBoundary fallbackMessage="页面内容加载失败，请刷新重试">
              <MobileTabContent activeTab={activeTab} />
            </ComponentErrorBoundary>
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
        <div className="flex gap-6 items-start">

          {/* ── Left Sidebar ──────────────────────────────────────── */}
          <motion.aside
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="w-60 shrink-0 space-y-3"
          >
            {/* Profile card */}
            <div className="rounded-xl border border-border bg-gradient-to-br from-foreground to-foreground/90 dark:from-card dark:via-muted/60 dark:to-card text-background dark:text-foreground overflow-hidden shadow-md">
              <div className="p-5">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="relative">
                    <Avatar className="h-16 w-16 border-2 border-background/20 dark:border-foreground/20 shadow-lg">
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-background/20 dark:bg-foreground/20 text-background dark:text-foreground text-2xl font-bold">
                        {avatarInitial}
                      </AvatarFallback>
                    </Avatar>
                    {profile?.seller_verified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-background/30">
                        <Shield className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 w-full">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <span className="font-bold text-base truncate max-w-[140px]">{displayName}</span>
                      {isAdmin && (
                        <Badge className="bg-background/20 dark:bg-foreground/20 text-background dark:text-foreground border-none text-[10px] px-1.5 h-4 shrink-0">
                          <Sparkles className="w-2.5 h-2.5 mr-0.5" />管理员
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-background/60 dark:text-foreground/60 truncate">{user?.email}</p>
                    {profile?.is_seller && (
                      <Badge className="bg-background/15 dark:bg-foreground/15 text-background dark:text-foreground border-none text-[10px] h-5">
                        认证卖家
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Mini stats row */}
              <ComponentErrorBoundary fallbackMessage="">
                <UserCenterStatsGrid profile={profile} user={user} compact mobileRow />
              </ComponentErrorBoundary>

              {/* Quick profile link */}
              {user?.id && (
                <div className="px-4 pb-4">
                  <button
                    onClick={() => navigate(`/profile/${user.id}`)}
                    className="w-full text-xs text-background/50 dark:text-foreground/50 hover:text-background/80 dark:hover:text-foreground/80 flex items-center justify-center gap-1 py-1 transition-colors"
                  >
                    <Globe className="w-3 h-3" />
                    查看公开主页
                  </button>
                </div>
              )}
            </div>

            {/* Navigation groups */}
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              {sidebarNavGroups.map((group, gi) => (
                <div key={group.title}>
                  {gi > 0 && <div className="h-px bg-border mx-3" />}
                  <div className="px-2 py-1.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
                      {group.title}
                    </p>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.value;
                      return (
                        <button
                          key={item.value}
                          onClick={() => handleTabChange(item.value)}
                          className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium transition-all mb-0.5
                            ${isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                        >
                          <div className="relative shrink-0">
                            <Icon className="w-4 h-4" />
                            {(item as any).badge > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[9px] rounded-full h-3.5 min-w-3.5 flex items-center justify-center px-0.5">
                                {(item as any).badge > 99 ? '99+' : (item as any).badge}
                              </span>
                            )}
                          </div>
                          <span className="flex-1 text-left">{item.label}</span>
                          {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Return home + Admin */}
            <div className="space-y-2">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />返回首页
              </Button>
              {isAdmin && (
                <Button
                  onClick={() => navigate('/admin')}
                  size="sm"
                  className="w-full"
                >
                  <Shield className="w-4 h-4 mr-2" />管理面板
                </Button>
              )}
            </div>
          </motion.aside>

          {/* ── Main Content ──────────────────────────────────────── */}
          <motion.div
            className="flex-1 min-w-0"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
          >
            {/* Stats grid — full width above content */}
            <ComponentErrorBoundary fallbackMessage="统计数据加载失败">
              <UserCenterStatsGrid profile={profile} user={user} />
            </ComponentErrorBoundary>

            {/* Tab content card */}
            <div className="mt-5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                {/* Section header */}
                <div className="px-6 py-4 border-b border-border bg-background/60">
                  <h2 className="text-base font-semibold text-foreground">
                    {SECTION_LABELS[activeTab] || '用户中心'}
                  </h2>
                </div>
                <div className="p-6">
                  <ComponentErrorBoundary fallbackMessage="页面内容加载失败，请刷新重试">
                    {activeTab === 'support' ? (
                      <SupportTicketsSafe />
                    ) : activeTab === 'profile-settings' || activeTab === 'profile' ? (
                      <ProfileSettings />
                    ) : activeTab === 'profile-security' ? (
                      <AccountSecurity />
                    ) : (
                      <UserCenterTabsContent />
                    )}
                  </ComponentErrorBoundary>
                </div>
              </Tabs>
            </div>
          </motion.div>

        </div>
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
      title: '我的账户',
      items: [
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
        <div className="bg-gradient-to-br from-foreground to-foreground/90 dark:from-card dark:via-muted dark:to-card px-5 py-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-[60px] w-[60px] border-2 border-background/30 dark:border-foreground/20 shadow-lg">
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
                <span className="text-lg font-bold text-background dark:text-foreground truncate">{displayName}</span>
                {isAdmin && (
                  <Badge className="bg-background/20 dark:bg-foreground/20 text-background dark:text-foreground border-none text-[10px] px-1.5 h-5 shrink-0">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" />管理员
                  </Badge>
                )}
              </div>
              <p className="text-xs text-background/60 dark:text-foreground/60 mt-0.5 truncate">{user?.email}</p>
              {profile?.is_seller && (
                <Badge className="mt-1.5 bg-background/15 dark:bg-foreground/15 text-background dark:text-foreground border-none text-[10px] h-5">
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
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-foreground" />
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
            onClick={() => onTabChange('support')}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 active:bg-muted transition-colors text-left"
            data-testid="mobile-nav-support"
          >
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <HeadphonesIcon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">联系支持</p>
              <p className="text-xs text-muted-foreground">提交工单，24小时内回复</p>
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
class SupportTicketsSafe extends React.Component<Record<string, never>, { hasError: boolean }> {
  constructor(props: Record<string, never>) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 py-20 px-6 text-center gap-3">
          <HeadphonesIcon className="w-10 h-10 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">支持系统暂时不可用，请稍后再试</p>
        </div>
      );
    }
    return <SupportTickets />;
  }
}

function MobileTabContent({ activeTab }: { activeTab: string }) {
  if (activeTab === 'profile-settings') {
    return <div className="pb-4"><ProfileSettings /></div>;
  }
  if (activeTab === 'profile-security') {
    return <div className="pb-4"><AccountSecurity /></div>;
  }
  if (activeTab === 'support') {
    return (
      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <SupportTicketsSafe />
      </div>
    );
  }
  return (
    <Tabs value={activeTab} className="w-full">
      <UserCenterTabsContent />
    </Tabs>
  );
}

export default UserCenter;
