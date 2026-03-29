import { TabsContent } from "@/components/ui/tabs";
import { DomainManagement } from "@/components/usercenter/DomainManagement";
import { TransactionHistory } from "@/components/usercenter/TransactionHistory";
import { MyTransactions } from "@/components/usercenter/MyTransactions";
import { NotificationsPanel } from "@/components/usercenter/NotificationsPanel";
import { ProfileSettings } from "@/components/usercenter/ProfileSettings";
import { AccountSecurity } from "@/components/usercenter/AccountSecurity";
import { FavoriteDomains } from "@/components/usercenter/FavoriteDomains";
import { WalletPanel } from "@/components/usercenter/WalletPanel";
import { ProfileCompletion } from "@/components/usercenter/ProfileCompletion";
import { EscrowService } from "@/components/escrow/EscrowService";
import { DisputeCenter } from "@/components/disputes/DisputeCenter";
import { MessagesPage } from "@/components/messages/MessageCenter";
import { useState } from "react";
import {
  User, Shield, Link as LinkIcon, ShoppingBag, FileText,
  Wallet, Heart, AlertTriangle
} from "lucide-react";
import { CustomUrlSettings } from "@/components/usercenter/CustomUrlSettings";
import { useIsMobile } from "@/hooks/use-mobile";

/* ─── Transaction sub-tabs ────────────────────────────────────────
   Mobile: horizontally scrollable pill row (no nested Tabs)
   Desktop: normal Tabs component
────────────────────────────────────────────────────────────────── */
const TX_TABS = [
  { id: 'transactions', label: '我的交易', shortLabel: '交易', icon: ShoppingBag },
  { id: 'offers',       label: '交易报价', shortLabel: '报价', icon: FileText },
  { id: 'wallet',       label: '我的钱包', shortLabel: '钱包', icon: Wallet },
  { id: 'escrow',       label: '资金托管', shortLabel: '托管', icon: Shield },
  { id: 'disputes',     label: '纠纷申诉', shortLabel: '纠纷', icon: AlertTriangle },
  { id: 'favorites',    label: '我的收藏', shortLabel: '收藏', icon: Heart },
];

const PROFILE_TABS = [
  { id: 'info',      label: '个人信息', icon: User },
  { id: 'security',  label: '账户安全', icon: Shield },
  { id: 'customurl', label: '个性链接', icon: LinkIcon },
];

function TxContent({ tab }: { tab: string }) {
  if (tab === 'transactions') return <MyTransactions />;
  if (tab === 'offers')       return <TransactionHistory />;
  if (tab === 'escrow')       return <EscrowService />;
  if (tab === 'disputes')     return <DisputeCenter />;
  if (tab === 'wallet')       return <WalletPanel />;
  if (tab === 'favorites')    return <FavoriteDomains />;
  return null;
}

function ProfileContent({ tab }: { tab: string }) {
  if (tab === 'info')      return <ProfileSettings />;
  if (tab === 'security')  return <AccountSecurity />;
  if (tab === 'customurl') return <CustomUrlSettings />;
  return null;
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
  const [txTab, setTxTab] = useState('transactions');
  const [profileTab, setProfileTab] = useState('info');
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      {/* ── Domains ─────────────────────────────────────────────── */}
      <TabsContent value="domains" className="mt-0">
        <DomainManagement />
      </TabsContent>

      {/* ── Transactions ─────────────────────────────────────────── */}
      <TabsContent value="transactions" className="mt-0">
        {isMobile ? (
          <>
            <MobilePillNav
              items={TX_TABS.map(t => ({ id: t.id, shortLabel: t.shortLabel, icon: t.icon }))}
              active={txTab}
              onChange={setTxTab}
            />
            <TxContent tab={txTab} />
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
            <TxContent tab={txTab} />
          </>
        )}
      </TabsContent>

      {/* ── Messages ─────────────────────────────────────────────── */}
      <TabsContent value="messages" className="mt-0">
        <div className={isMobile ? 'h-[calc(100vh-200px)]' : 'h-[600px]'}>
          <MessagesPage />
        </div>
      </TabsContent>

      {/* ── Notifications ────────────────────────────────────────── */}
      <TabsContent value="notifications" className="mt-0">
        <NotificationsPanel />
      </TabsContent>

      {/* ── Profile ──────────────────────────────────────────────── */}
      <TabsContent value="profile" className="mt-0">
        <ProfileCompletion onNavigateTab={() => setProfileTab('info')} />

        {isMobile ? (
          <>
            <MobilePillNav
              items={PROFILE_TABS.map(t => ({ id: t.id, shortLabel: t.label, icon: t.icon }))}
              active={profileTab}
              onChange={setProfileTab}
            />
            <ProfileContent tab={profileTab} />
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
            <ProfileContent tab={profileTab} />
          </>
        )}
      </TabsContent>
    </div>
  );
};
