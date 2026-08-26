import { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { runBackendHealthCheck } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LayoutDashboard, Globe, CheckSquare, Layers, Gavel,
  DollarSign, Shield, AlertTriangle, Percent,
  Users, Star, Home, BookOpen, Search, Sliders, CreditCard,
  Settings, Activity, Menu, ChevronRight, ChevronDown, LogOut, RefreshCw,
  MessageSquare, Package, Scale, Bell, Headphones, Inbox,
  ScrollText, GitMerge, SearchCode, ImageIcon, Wallet, Clock, Plus,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// ── Lazy-loaded admin sections: keeps the initial admin bundle small ───────
const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const PendingVerifications = lazy(() => import('@/components/admin/PendingVerifications').then(m => ({ default: m.PendingVerifications })));
const DomainManagerPanel = lazy(() => import('@/components/admin/DomainManagerPanel').then(m => ({ default: m.DomainManagerPanel })));
const AllDomainListings = lazy(() => import('@/components/admin/AllDomainListings').then(m => ({ default: m.AllDomainListings })));
const UserManagement = lazy(() => import('@/components/admin/UserManagement').then(m => ({ default: m.UserManagement })));
const ContentManagement = lazy(() => import('@/components/admin/ContentManagement').then(m => ({ default: m.ContentManagement })));
const SeoConfiguration = lazy(() => import('@/components/admin/SeoConfiguration').then(m => ({ default: m.SeoConfiguration })));
const SiteSettings = lazy(() => import('@/components/admin/SiteSettings').then(m => ({ default: m.SiteSettings })));
const HomeContentManagement = lazy(() => import('@/components/admin/HomeContentManagement').then(m => ({ default: m.HomeContentManagement })));
const FrontendContentManager = lazy(() => import('@/components/admin/FrontendContentManager').then(m => ({ default: m.FrontendContentManager })));
const BulkDomainOperations = lazy(() => import('@/components/admin/BulkDomainOperations').then(m => ({ default: m.BulkDomainOperations })));
const QuickSettingsPanel = lazy(() => import('@/components/admin/QuickSettingsPanel').then(m => ({ default: m.QuickSettingsPanel })));
const AdminActivityLog = lazy(() => import('@/components/admin/AdminActivityLog').then(m => ({ default: m.AdminActivityLog })));
const PaymentGatewaySettings = lazy(() => import('@/components/admin/PaymentGatewaySettings').then(m => ({ default: m.PaymentGatewaySettings })));
const OffersManagement = lazy(() => import('@/components/admin/OffersManagement').then(m => ({ default: m.OffersManagement })));
const CommissionSettings = lazy(() => import('@/components/admin/CommissionSettings').then(m => ({ default: m.CommissionSettings })));
const DisputeCenter = lazy(() => import('@/components/disputes/DisputeCenter').then(m => ({ default: m.DisputeCenter })));
const EscrowService = lazy(() => import('@/components/escrow/EscrowService').then(m => ({ default: m.EscrowService })));
const AdminTransactionManagement = lazy(() => import('@/components/admin/AdminTransactionManagement').then(m => ({ default: m.AdminTransactionManagement })));
const AdminAuctionManagement = lazy(() => import('@/components/admin/AdminAuctionManagement').then(m => ({ default: m.AdminAuctionManagement })));
const AdminReviewManagement = lazy(() => import('@/components/admin/AdminReviewManagement').then(m => ({ default: m.AdminReviewManagement })));
const AdminLegalPagesManager = lazy(() => import('@/components/admin/AdminLegalPagesManager').then(m => ({ default: m.AdminLegalPagesManager })));
const AdminMessagesView = lazy(() => import('@/components/admin/AdminMessagesView').then(m => ({ default: m.AdminMessagesView })));
const AdminTickets = lazy(() => import('@/components/admin/AdminTickets').then(m => ({ default: m.AdminTickets })));
const AdminNotificationSender = lazy(() => import('@/components/admin/AdminNotificationSender').then(m => ({ default: m.AdminNotificationSender })));
const AdminFeedback = lazy(() => import('@/components/admin/AdminFeedback').then(m => ({ default: m.AdminFeedback })));
const AdminUnifiedSearch = lazy(() => import('@/components/admin/AdminUnifiedSearch').then(m => ({ default: m.AdminUnifiedSearch })));
const AdminAuditLogs = lazy(() => import('@/components/admin/AdminAuditLogs').then(m => ({ default: m.AdminAuditLogs })));
const MergeStrategyManager = lazy(() => import('@/components/admin/MergeStrategyManager').then(m => ({ default: m.MergeStrategyManager })));
const AdminLogoManagement = lazy(() => import('@/components/admin/AdminLogoManagement').then(m => ({ default: m.AdminLogoManagement })));
const AdminTelemetry = lazy(() => import('@/components/admin/AdminTelemetry').then(m => ({ default: m.AdminTelemetry })));
const AdminDiagnostics = lazy(() => import('@/components/admin/AdminDiagnostics').then(m => ({ default: m.AdminDiagnostics })));
const AdminOrderOperations = lazy(() => import('@/components/admin/AdminOrderOperations').then(m => ({ default: m.AdminOrderOperations })));
const AdminKycReview = lazy(() => import('@/components/admin/AdminKycReview').then(m => ({ default: m.AdminKycReview })));
const AdminWithdrawals = lazy(() => import('@/components/admin/AdminWithdrawals').then(m => ({ default: m.AdminWithdrawals })));

interface NavItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
  keywords?: string;
}

interface NavGroup {
  key: string;
  title: string;
  items: NavItem[];
}

const COLLAPSED_KEY = 'admin-nav-collapsed';
const RECENT_KEY = 'admin-nav-recent';

const SectionSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-52" />
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
    </div>
    <Skeleton className="h-64 w-full" />
  </div>
);

export const AdminPanel = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [pendingDisputes, setPendingDisputes] = useState(0);
  const [pendingOffers, setPendingOffers] = useState(0);
  const [pendingTickets, setPendingTickets] = useState(0);
  const [pendingKyc, setPendingKyc] = useState(0);
  const [newFeedback, setNewFeedback] = useState(0);
  const [navQuery, setNavQuery] = useState('');
  const [collapsed, setCollapsed] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(COLLAPSED_KEY) || '[]'); } catch { return []; }
  });
  const [recent, setRecent] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
  });

  // ProtectedRoute (adminOnly) already verified auth + admin status.
  useEffect(() => {
    if (user && isAdmin) loadBadges();
  }, [user, isAdmin]);

  useEffect(() => {
    runBackendHealthCheck();
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) setActiveTab(tab);
  }, [searchParams]);

  const loadBadges = async () => {
    try {
      const [verRes, disputeRes, offerRes, ticketRes, kycRes, feedbackRes] = await Promise.all([
        supabase.from('domain_verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('disputes').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('domain_offers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        (supabase as any).from('seller_kyc').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('user_feedback').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      ]);
      setPendingVerifications(verRes.count ?? 0);
      setPendingDisputes(disputeRes.count ?? 0);
      setPendingOffers(offerRes.count ?? 0);
      setPendingTickets(ticketRes.count ?? 0);
      setPendingKyc(kycRes?.count ?? 0);
      setNewFeedback(feedbackRes?.count ?? 0);
    } catch {}
  };

  const navGroups: NavGroup[] = [
    {
      key: 'overview',
      title: '数据概览',
      items: [
        { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard, keywords: 'dashboard 首页 统计' },
        { id: 'unified-search', label: '统一搜索/导出', icon: SearchCode, keywords: 'search export csv' },
      ]
    },
    {
      key: 'domains',
      title: '域名管理',
      items: [
        { id: 'domains', label: '全部域名', icon: Globe, keywords: 'domain 列表' },
        { id: 'domain-manager', label: '域名上架管理', icon: Plus, keywords: 'domain 新增 编辑 排序 已售' },
        { id: 'verifications', label: '待审验证', icon: CheckSquare, badge: pendingVerifications, keywords: 'verify dns' },
        { id: 'auctions', label: '拍卖管理', icon: Gavel, keywords: 'auction 竞价' },
        { id: 'bulk', label: '批量操作', icon: Layers, keywords: 'bulk 导入' },
        { id: 'logos', label: 'Logo 管理', icon: ImageIcon, keywords: 'logo 徽章 图标' },
      ]
    },
    {
      key: 'orders',
      title: '交易与订单',
      items: [
        { id: 'transactions', label: '全部交易', icon: DollarSign, keywords: 'order 订单' },
        { id: 'order-ops', label: '订单运维', icon: RefreshCw, keywords: '收据 推进 阶段' },
        { id: 'offers', label: '报价管理', icon: MessageSquare, badge: pendingOffers, keywords: 'offer 出价' },
        { id: 'merge-strategy', label: '重复合并策略', icon: GitMerge, keywords: '去重 合并' },
        { id: 'escrow', label: '资金托管', icon: Shield, keywords: 'escrow 担保' },
        { id: 'disputes', label: '纠纷申诉', icon: AlertTriangle, badge: pendingDisputes, keywords: 'dispute 争议' },
      ]
    },
    {
      key: 'finance',
      title: '资金与风控',
      items: [
        { id: 'commission', label: '手续费配置', icon: Percent, keywords: 'fee 佣金' },
        { id: 'withdrawals', label: '提现审核', icon: Wallet, keywords: 'withdraw 打款' },
        { id: 'kyc', label: '实名认证审核', icon: Shield, badge: pendingKyc, keywords: 'kyc 实名' },
        { id: 'payment', label: '支付通道配置', icon: CreditCard, keywords: 'payment 支付 密钥' },
      ]
    },
    {
      key: 'users',
      title: '用户与信誉',
      items: [
        { id: 'users', label: '全部用户', icon: Users, keywords: 'user 账号' },
        { id: 'reviews', label: '评价管理', icon: Star, keywords: 'review 评分' },
      ]
    },
    {
      key: 'content',
      title: '内容与站点',
      items: [
        { id: 'homepage', label: '首页内容', icon: Home, keywords: 'home banner' },
        { id: 'content', label: '页面内容', icon: BookOpen, keywords: 'page cms' },
        { id: 'legal', label: '法律页面', icon: Scale, keywords: 'terms privacy' },
        { id: 'seo', label: 'SEO 配置', icon: Search, keywords: 'seo meta' },
        { id: 'frontend', label: '前台组件', icon: Package, keywords: '组件 模块开关' },
      ]
    },
    {
      key: 'comms',
      title: '通讯与支持',
      items: [
        { id: 'tickets', label: '支持工单', icon: Headphones, badge: pendingTickets, keywords: 'ticket 客服' },
        { id: 'messages', label: '用户消息', icon: MessageSquare, keywords: 'message 私信' },
        { id: 'notifications', label: '系统通知', icon: Bell, keywords: 'notify 推送' },
        { id: 'feedback', label: '用户反馈', icon: Inbox, badge: newFeedback, keywords: 'feedback 意见' },
      ]
    },
    {
      key: 'system',
      title: '系统与日志',
      items: [
        { id: 'settings', label: '站点设置', icon: Settings, keywords: 'settings 全局' },
        { id: 'quick-settings', label: '快速设置', icon: Sliders, keywords: '快捷 开关' },
        { id: 'activity', label: '活动日志', icon: Activity, keywords: 'log 活动' },
        { id: 'audit-logs', label: '报价审计日志', icon: ScrollText, keywords: 'audit 审计' },
        { id: 'telemetry', label: '路由遥测', icon: Activity, keywords: 'telemetry 监控' },
        { id: 'diagnostics', label: '后端诊断', icon: Activity, keywords: 'diagnostic 健康检查' },
      ]
    },
  ];

  const allItems = useMemo(() => navGroups.flatMap(g => g.items), [navGroups]);

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setSearchParams({ tab: id });
    setSidebarOpen(false);
    setRecent(prev => {
      const next = [id, ...prev.filter(x => x !== id)].slice(0, 5);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const toggleGroup = (key: string) => {
    setCollapsed(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const activeItem = allItems.find(i => i.id === activeTab);
  const activeGroup = navGroups.find(g => g.items.some(i => i.id === activeTab));

  const totalPending = pendingVerifications + pendingDisputes + pendingOffers + pendingTickets + pendingKyc + newFeedback;

  const q = navQuery.trim().toLowerCase();
  const filteredGroups = navGroups
    .map(group => ({
      ...group,
      items: group.items.filter(i =>
        !q || i.label.toLowerCase().includes(q) || (i.keywords ?? '').toLowerCase().includes(q)
      ),
    }))
    .filter(g => g.items.length > 0);

  const NavButton = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        onClick={() => handleTabChange(item.id)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
          isActive
            ? 'bg-primary text-primary-foreground font-medium'
            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left truncate">{item.label}</span>
        {item.badge && item.badge > 0 ? (
          <Badge
            variant={isActive ? 'secondary' : 'destructive'}
            className="h-5 min-w-5 text-xs flex items-center justify-center px-1"
          >
            {item.badge}
          </Badge>
        ) : null}
      </button>
    );
  };

  const recentItems = recent
    .map(id => allItems.find(i => i.id === id))
    .filter((i): i is NavItem => Boolean(i));

  const SidebarContent = () => (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-1">
        <div className="flex items-center gap-3 px-2 py-3 mb-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">管理员后台</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          {totalPending > 0 && (
            <Badge variant="destructive" className="h-5 text-[10px]">{totalPending}</Badge>
          )}
        </div>

        <div className="relative mb-2 px-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={navQuery}
            onChange={(e) => setNavQuery(e.target.value)}
            placeholder="搜索菜单..."
            className="w-full h-8 pl-8 pr-2 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <Separator className="mb-3" />

        {!q && recentItems.length > 0 && (
          <div className="mb-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">
              <Clock className="h-3 w-3" /> 最近访问
            </p>
            {recentItems.map(item => <NavButton key={`recent-${item.id}`} item={item} />)}
          </div>
        )}

        {filteredGroups.map(group => {
          const isCollapsed = !q && collapsed.includes(group.key);
          return (
            <div key={group.key} className="mb-3">
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1.5 hover:text-foreground transition-colors"
              >
                {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                <span className="flex-1 text-left">{group.title}</span>
                <span className="text-[10px] normal-case opacity-60">{group.items.length}</span>
              </button>
              {!isCollapsed && group.items.map(item => <NavButton key={item.id} item={item} />)}
            </div>
          );
        })}

        {filteredGroups.length === 0 && (
          <p className="text-xs text-muted-foreground px-2 py-4">没有匹配的菜单</p>
        )}

        <Separator className="mb-3" />

        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          返回前台
        </button>
      </div>
    </ScrollArea>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboard />;
      case 'unified-search': return <AdminUnifiedSearch />;
      case 'activity': return <AdminActivityLog />;
      case 'audit-logs': return <AdminAuditLogs />;
      case 'telemetry': return <AdminTelemetry />;
      case 'diagnostics': return <AdminDiagnostics />;
      case 'merge-strategy': return <MergeStrategyManager />;
      case 'domains': return <AllDomainListings />;
      case 'domain-manager': return <DomainManagerPanel />;
      case 'verifications': return <PendingVerifications />;
      case 'auctions': return <AdminAuctionManagement />;
      case 'bulk': return <BulkDomainOperations />;
      case 'logos': return <AdminLogoManagement />;
      case 'transactions': return <AdminTransactionManagement />;
      case 'order-ops': return <AdminOrderOperations />;
      case 'offers': return <OffersManagement />;
      case 'escrow': return <EscrowService isAdmin={true} />;
      case 'disputes': return <DisputeCenter isAdmin={true} />;
      case 'commission': return <CommissionSettings />;
      case 'reviews': return <AdminReviewManagement />;
      case 'users': return <UserManagement />;
      case 'kyc': return <AdminKycReview />;
      case 'withdrawals': return <AdminWithdrawals />;
      case 'homepage': return <HomeContentManagement />;
      case 'content': return <ContentManagement />;
      case 'legal': return <AdminLegalPagesManager />;
      case 'seo': return <SeoConfiguration />;
      case 'frontend': return <FrontendContentManager />;
      case 'tickets': return <AdminTickets />;
      case 'messages': return <AdminMessagesView />;
      case 'notifications': return <AdminNotificationSender />;
      case 'feedback': return <AdminFeedback onBadgeRefresh={loadBadges} />;
      case 'payment': return <PaymentGatewaySettings />;
      case 'quick-settings': return <QuickSettingsPanel />;
      case 'settings': return <SiteSettings />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center h-14 px-4 gap-3">
          {isMobile && (
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>
          )}

          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm hidden sm:block">管理控制台</span>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground ml-2 min-w-0">
            <ChevronRight className="h-4 w-4 shrink-0" />
            {activeGroup && (
              <>
                <span className="hidden sm:inline truncate">{activeGroup.title}</span>
                <ChevronRight className="h-4 w-4 shrink-0 hidden sm:inline" />
              </>
            )}
            <span className="font-medium text-foreground truncate">{activeItem?.label ?? '仪表盘'}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadBadges}>
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">刷新</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">返回前台</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {!isMobile && (
          <aside className="w-56 shrink-0 bg-background border-r h-[calc(100vh-3.5rem)] sticky top-14 overflow-hidden">
            <SidebarContent />
          </aside>
        )}

        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-4 md:p-6">
            <Suspense fallback={<SectionSkeleton />}>
              {renderContent()}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};
