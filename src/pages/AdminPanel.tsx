import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { apiGet } from '@/lib/apiClient';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { PendingVerifications } from '@/components/admin/PendingVerifications';
import { AllDomainListings } from '@/components/admin/AllDomainListings';
import { UserManagement } from '@/components/admin/UserManagement';
import { ContentManagement } from '@/components/admin/ContentManagement';
import { SeoConfiguration } from '@/components/admin/SeoConfiguration';
import { SiteSettings } from '@/components/admin/SiteSettings';
import { HomeContentManagement } from '@/components/admin/HomeContentManagement';
import { FrontendContentManager } from '@/components/admin/FrontendContentManager';
import { BulkDomainOperations } from '@/components/admin/BulkDomainOperations';
import { QuickSettingsPanel } from '@/components/admin/QuickSettingsPanel';
import { AdminActivityLog } from '@/components/admin/AdminActivityLog';
import { PaymentGatewaySettings } from '@/components/admin/PaymentGatewaySettings';
import { OffersManagement } from '@/components/admin/OffersManagement';
import { CommissionSettings } from '@/components/admin/CommissionSettings';
import { DisputeCenter } from '@/components/disputes/DisputeCenter';
import { EscrowService } from '@/components/escrow/EscrowService';
import { AdminTransactionManagement } from '@/components/admin/AdminTransactionManagement';
import { AdminAuctionManagement } from '@/components/admin/AdminAuctionManagement';
import { AdminReviewManagement } from '@/components/admin/AdminReviewManagement';
import { AdminLegalPagesManager } from '@/components/admin/AdminLegalPagesManager';
import { AdminMessagesView } from '@/components/admin/AdminMessagesView';
import { AdminTickets } from '@/components/admin/AdminTickets';
import { AdminNotificationSender } from '@/components/admin/AdminNotificationSender';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard, Globe, CheckSquare, Layers, Gavel,
  DollarSign, FileText, Shield, AlertTriangle, Percent,
  Users, Star, Home, BookOpen, Search, Sliders, CreditCard,
  Settings, Activity, Menu, ChevronRight, LogOut, RefreshCw,
  MessageSquare, Package, Scale, Bell, Mail, Headphones
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

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

  // ProtectedRoute (adminOnly) already verified auth + admin status.
  // No need for a second is_admin RPC — just load badges immediately.
  useEffect(() => {
    if (user && isAdmin) loadBadges();
  }, [user, isAdmin]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) setActiveTab(tab);
  }, [searchParams]);

  const loadBadges = async () => {
    try {
      const stats = await apiGet('/data/admin/stats');
      setPendingVerifications(stats?.pendingVerifications ?? 0);
      setPendingDisputes(stats?.openDisputes ?? 0);
      setPendingOffers(stats?.pendingOffers ?? 0);
      setPendingTickets(stats?.openTickets ?? 0);
    } catch {}
  };

  const navGroups: NavGroup[] = [
    {
      title: '数据概览',
      items: [
        { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
        { id: 'activity', label: '活动日志', icon: Activity },
      ]
    },
    {
      title: '域名管理',
      items: [
        { id: 'domains', label: '全部域名', icon: Globe },
        { id: 'verifications', label: '待审验证', icon: CheckSquare, badge: pendingVerifications },
        { id: 'auctions', label: '拍卖管理', icon: Gavel },
        { id: 'bulk', label: '批量操作', icon: Layers },
      ]
    },
    {
      title: '交易管理',
      items: [
        { id: 'transactions', label: '全部交易', icon: DollarSign },
        { id: 'offers', label: '报价管理', icon: MessageSquare, badge: pendingOffers },
        { id: 'escrow', label: '资金托管', icon: Shield },
        { id: 'disputes', label: '纠纷申诉', icon: AlertTriangle, badge: pendingDisputes },
        { id: 'commission', label: '手续费配置', icon: Percent },
        { id: 'reviews', label: '评价管理', icon: Star },
      ]
    },
    {
      title: '用户管理',
      items: [
        { id: 'users', label: '全部用户', icon: Users },
      ]
    },
    {
      title: '内容管理',
      items: [
        { id: 'homepage', label: '首页内容', icon: Home },
        { id: 'content', label: '页面内容', icon: BookOpen },
        { id: 'legal', label: '法律页面', icon: Scale },
        { id: 'seo', label: 'SEO 配置', icon: Search },
        { id: 'frontend', label: '前台组件', icon: Package },
      ]
    },
    {
      title: '通讯管理',
      items: [
        { id: 'tickets', label: '支持工单', icon: Headphones, badge: pendingTickets },
        { id: 'messages', label: '用户消息', icon: MessageSquare },
        { id: 'notifications', label: '系统通知', icon: Bell },
      ]
    },
    {
      title: '系统设置',
      items: [
        { id: 'payment', label: '支付配置', icon: CreditCard },
        { id: 'quick-settings', label: '快速设置', icon: Sliders },
        { id: 'settings', label: '站点设置', icon: Settings },
      ]
    },
  ];

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setSearchParams({ tab: id });
    setSidebarOpen(false);
  };

  const activeItem = navGroups.flatMap(g => g.items).find(i => i.id === activeTab);

  const SidebarContent = () => (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-1">
        {/* 管理员标识 */}
        <div className="flex items-center gap-3 px-2 py-3 mb-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">管理员后台</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <Separator className="mb-3" />

        {navGroups.map(group => (
          <div key={group.title} className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">
              {group.title}
            </p>
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
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
            })}
          </div>
        ))}

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
      case 'activity': return <AdminActivityLog />;
      case 'domains': return <AllDomainListings />;
      case 'verifications': return <PendingVerifications />;
      case 'auctions': return <AdminAuctionManagement />;
      case 'bulk': return <BulkDomainOperations />;
      case 'transactions': return <AdminTransactionManagement />;
      case 'offers': return <OffersManagement />;
      case 'escrow': return <EscrowService isAdmin={true} />;
      case 'disputes': return <DisputeCenter isAdmin={true} />;
      case 'commission': return <CommissionSettings />;
      case 'reviews': return <AdminReviewManagement />;
      case 'users': return <UserManagement />;
      case 'homepage': return <HomeContentManagement />;
      case 'content': return <ContentManagement />;
      case 'legal': return <AdminLegalPagesManager />;
      case 'seo': return <SeoConfiguration />;
      case 'frontend': return <FrontendContentManager />;
      case 'tickets': return <AdminTickets />;
      case 'messages': return <AdminMessagesView />;
      case 'notifications': return <AdminNotificationSender />;
      case 'payment': return <PaymentGatewaySettings />;
      case 'quick-settings': return <QuickSettingsPanel />;
      case 'settings': return <SiteSettings />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center h-14 px-4 gap-3">
          {/* 移动端菜单 */}
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

          {/* 品牌 */}
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm hidden sm:block">管理控制台</span>
          </div>

          {/* 面包屑 */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground ml-2">
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground">{activeItem?.label ?? '仪表盘'}</span>
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
        {/* 桌面端侧边栏 */}
        {!isMobile && (
          <aside className="w-56 shrink-0 bg-background border-r h-[calc(100vh-3.5rem)] sticky top-14 overflow-hidden">
            <SidebarContent />
          </aside>
        )}

        {/* 主内容区 */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-4 md:p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};
