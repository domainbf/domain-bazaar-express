import { TabsContent } from "@/components/ui/tabs";
import { DomainManagement } from "@/components/usercenter/DomainManagement";
import { TransactionHistory } from "@/components/usercenter/TransactionHistory";
import { MyTransactions } from "@/components/usercenter/MyTransactions";
import { SoldDomainsPanel } from "@/components/usercenter/SoldDomainsPanel";
import { NotificationsPanel } from "@/components/usercenter/NotificationsPanel";
import { NotificationSettings } from "@/components/usercenter/NotificationSettings";
import { ProfileSettings } from "@/components/usercenter/ProfileSettings";
import { AccountSecurity } from "@/components/usercenter/AccountSecurity";
import { FavoriteDomains } from "@/components/usercenter/FavoriteDomains";
import { WalletPanel } from "@/components/usercenter/WalletPanel";
import { MyOffersPanel } from "@/components/usercenter/MyOffersPanel";
import { ProfileCompletion } from "@/components/usercenter/ProfileCompletion";
import { ActivityLogPanel } from "@/components/usercenter/ActivityLogPanel";
import { SavedSearchesPanel } from "@/components/usercenter/SavedSearchesPanel";
import { EscrowService } from "@/components/escrow/EscrowService";
import { DisputeCenter } from "@/components/disputes/DisputeCenter";
import { MessagesPage } from "@/components/messages/MessageCenter";
import { useEffect, useState } from "react";
import {
  User, Shield, Link as LinkIcon, ShoppingBag, FileText,
  Wallet, Heart, AlertTriangle, CheckCircle2, Inbox, Activity, Bookmark
} from "lucide-react";
import { CustomUrlSettings } from "@/components/usercenter/CustomUrlSettings";
import { useIsMobile } from "@/hooks/use-mobile";
import { ComponentErrorBoundary } from "@/components/common/ComponentErrorBoundary";

/* ─── Transaction sub-tabs ────────────────────────────────────────
   Mobile: horizontally scrollable pill row (no nested Tabs)
   Desktop: normal Tabs component
────────────────────────────────────────────────────────────────── */
const TX_TABS = [
  { id: 'transactions', label: '我的交易', shortLabel: '交易', icon: ShoppingBag },
  { id: 'sold',         label: '已售域名', shortLabel: '已售', icon: CheckCircle2 },
  { id: 'offers',       label: '收到报价', shortLabel: '收到', icon: FileText },
  { id: 'myoffers',     label: '我的报价', shortLabel: '我的报价', icon: Inbox },
  { id: 'wallet',       label: '我的钱包', shortLabel: '钱包', icon: Wallet },
  { id: 'escrow',       label: '资金托管', shortLabel: '托管', icon: Shield },
  { id: 'disputes',     label: '纠纷申诉', shortLabel: '纠纷', icon: AlertTriangle },
  { id: 'favorites',    label: '我的收藏', shortLabel: '收藏', icon: Heart },
  { id: 'searches',     label: '搜索订阅', shortLabel: '订阅', icon: Bookmark },
];

const PROFILE_TABS = [
  { id: 'info',      label: '个人信息', icon: User },
  { id: 'security',  label: '账户安全', icon: Shield },
  { id: 'customurl', label: '个性链接', icon: LinkIcon },
  { id: 'activity',  label: '活动记录', icon: Activity },
];

/* Persist sub-tab selection across visits */
const usePersistedTab = (key: string, fallback: string, valid: string[]) => {
  const [tab, setTab] = useState(() => {
    try {
      const saved = sessionStorage.getItem(key);
      return saved && valid.includes(saved) ? saved : fallback;
    } catch { return fallback; }
  });
  useEffect(() => {
    try { sessionStorage.setItem(key, tab); } catch { /* ignore */ }
  }, [key, tab]);
  return [tab, setTab] as const;
};


function TxContent({ tab }: { tab: string }) {
  return (
    <div className="animate-in">
      {tab === 'transactions' && <MyTransactions />}
      {tab === 'sold'         && <SoldDomainsPanel />}
      {tab === 'offers'       && <TransactionHistory />}
      {tab === 'myoffers'     && <MyOffersPanel />}
      {tab === 'escrow'       && <EscrowService />}
      {tab === 'disputes'     && <DisputeCenter />}
      {tab === 'wallet'       && <WalletPanel />}
      {tab === 'favorites'    && <FavoriteDomains />}
      {tab === 'searches'     && <SavedSearchesPanel />}
    </div>
  );
}


function ProfileContent({ tab }: { tab: string }) {
  return (
    <div className="animate-in">
      {tab === 'info'      && <ProfileSettings />}
      {tab === 'security'  && <AccountSecurity />}
      {tab === 'customurl' && <CustomUrlSettings />}
      {tab === 'activity'  && <ActivityLogPanel />}
    </div>
  );
}

/* Mobile pill selector — horizontal scroll, no overflow clipping */
function MobilePillNav({
  items, active, onChange,
}: {
  items: { id: string; shortLabel: string; icon: React.ElementType }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide -mx-4 px-4">
      {items.map((item) => {
        const Icon = item.icon;
        const sel = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`flex items-center gap-1.5 shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all
              ${sel
                ? 'bg-foreground text-background shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {item.shortLabel}
          </button>
        );
      })}
    </div>
  );
}

export const UserCenterTabsContent = () => {
  const [txTab, setTxTab] = usePersistedTab('uc-tx-tab', 'transactions', TX_TABS.map(t => t.id));
  const [profileTab, setProfileTab] = usePersistedTab('uc-profile-tab', 'info', PROFILE_TABS.map(t => t.id));
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      {/* ── Domains ─────────────────────────────────────────────── */}
      <TabsContent value="domains" className="mt-0">
        <ComponentErrorBoundary fallbackMessage="域名管理模块加载出错，请重试">
          <DomainManagement />
        </ComponentErrorBoundary>
      </TabsContent>

      {/* ── Transactions ─────────────────────────────────────────── */}
      <TabsContent value="transactions" className="mt-0">
        <ComponentErrorBoundary fallbackMessage="交易模块加载出错，请重试">
          {isMobile ? (
            <>
              <MobilePillNav
                items={TX_TABS.map(t => ({ id: t.id, shortLabel: t.shortLabel, icon: t.icon }))}
                active={txTab}
                onChange={setTxTab}
              />
              <TxContent key={txTab} tab={txTab} />
            </>
          ) : (
            <>
              {/* Desktop: classic tab bar */}
              <div className="flex flex-wrap gap-1 mb-5 border-b border-border pb-3">
                {TX_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const sel = txTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setTxTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                        ${sel
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              <TxContent key={txTab} tab={txTab} />
            </>
          )}
        </ComponentErrorBoundary>
      </TabsContent>

      {/* ── Messages ─────────────────────────────────────────────── */}
      <TabsContent value="messages" className="mt-0">
        <ComponentErrorBoundary fallbackMessage="消息模块加载出错，请重试">
          <div className={isMobile ? 'h-[calc(100vh-200px)]' : 'h-[600px]'}>
            <MessagesPage />
          </div>
        </ComponentErrorBoundary>
      </TabsContent>

      {/* ── Notifications ────────────────────────────────────────── */}
      <TabsContent value="notifications" className="mt-0">
        <ComponentErrorBoundary fallbackMessage="通知模块加载出错，请重试">
          <div className="space-y-6">
            <NotificationsPanel />
            <NotificationSettings />
          </div>
        </ComponentErrorBoundary>
      </TabsContent>

      {/* ── Profile ──────────────────────────────────────────────── */}
      <TabsContent value="profile" className="mt-0">
        <ComponentErrorBoundary fallbackMessage="个人资料模块加载出错，请重试">
          <ProfileCompletion onNavigateTab={() => setProfileTab('info')} />

          {isMobile ? (
            <>
              <MobilePillNav
                items={PROFILE_TABS.map(t => ({ id: t.id, shortLabel: t.label, icon: t.icon }))}
                active={profileTab}
                onChange={setProfileTab}
              />
              <ProfileContent key={profileTab} tab={profileTab} />
            </>
          ) : (
            <>
              <div className="flex gap-1 mb-5 border-b border-border pb-3">
                {PROFILE_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const sel = profileTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setProfileTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                        ${sel
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              <ProfileContent key={profileTab} tab={profileTab} />
            </>
          )}
        </ComponentErrorBoundary>
      </TabsContent>
    </div>
  );
};
