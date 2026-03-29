import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { User, Shield, Link as LinkIcon, ShoppingBag, FileText, Wallet, Heart, AlertTriangle } from "lucide-react";
import { CustomUrlSettings } from "@/components/usercenter/CustomUrlSettings";
import { useIsMobile } from "@/hooks/use-mobile";

export const UserCenterTabsContent = () => {
  const [profileTab, setProfileTab] = useState('info');
  const [txTab, setTxTab] = useState('transactions');
  const isMobile = useIsMobile();

  return (
    <div className="space-y-6">
      <TabsContent value="domains" className="mt-0">
        <DomainManagement />
      </TabsContent>

      <TabsContent value="transactions" className="mt-0">
        <Tabs value={txTab} onValueChange={setTxTab} className="w-full">
          <TabsList className={`mb-4 ${isMobile ? 'w-full grid grid-cols-3' : 'flex flex-wrap'}`}>
            <TabsTrigger value="transactions" className={`flex items-center gap-1.5 ${isMobile ? 'text-xs' : ''}`}>
              <ShoppingBag className="h-3.5 w-3.5" />
              {isMobile ? '交易' : '我的交易'}
            </TabsTrigger>
            <TabsTrigger value="offers" className={`flex items-center gap-1.5 ${isMobile ? 'text-xs' : ''}`}>
              <FileText className="h-3.5 w-3.5" />
              {isMobile ? '报价' : '交易报价'}
            </TabsTrigger>
            <TabsTrigger value="wallet" className={`flex items-center gap-1.5 ${isMobile ? 'text-xs' : ''}`}>
              <Wallet className="h-3.5 w-3.5" />
              {isMobile ? '钱包' : '我的钱包'}
            </TabsTrigger>
            {!isMobile && (
              <>
                <TabsTrigger value="escrow" className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  资金托管
                </TabsTrigger>
                <TabsTrigger value="disputes" className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  纠纷申诉
                </TabsTrigger>
                <TabsTrigger value="favorites" className="flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5" />
                  我的收藏
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* 移动端第二行标签 */}
          {isMobile && (
            <TabsList className="mb-4 w-full grid grid-cols-3">
              <TabsTrigger value="escrow" className="text-xs flex items-center gap-1">
                <Shield className="h-3 w-3" />
                托管
              </TabsTrigger>
              <TabsTrigger value="disputes" className="text-xs flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                纠纷
              </TabsTrigger>
              <TabsTrigger value="favorites" className="text-xs flex items-center gap-1">
                <Heart className="h-3 w-3" />
                收藏
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="transactions">
            <MyTransactions />
          </TabsContent>
          <TabsContent value="offers">
            <TransactionHistory />
          </TabsContent>
          <TabsContent value="escrow">
            <EscrowService />
          </TabsContent>
          <TabsContent value="disputes">
            <DisputeCenter />
          </TabsContent>
          <TabsContent value="wallet">
            <WalletPanel />
          </TabsContent>
          <TabsContent value="favorites">
            <FavoriteDomains />
          </TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="messages" className="mt-0">
        <div className="h-[600px]">
          <MessagesPage />
        </div>
      </TabsContent>

      <TabsContent value="notifications" className="mt-0">
        <NotificationsPanel />
      </TabsContent>

      <TabsContent value="profile" className="mt-0">
        <ProfileCompletion onNavigateTab={() => setProfileTab('info')} />
        <Tabs value={profileTab} onValueChange={setProfileTab}>
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              个人信息
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              账户安全
            </TabsTrigger>
            <TabsTrigger value="customurl" className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              个性链接
            </TabsTrigger>
          </TabsList>
          <TabsContent value="info">
            <ProfileSettings />
          </TabsContent>
          <TabsContent value="security">
            <AccountSecurity />
          </TabsContent>
          <TabsContent value="customurl">
            <CustomUrlSettings />
          </TabsContent>
        </Tabs>
      </TabsContent>
    </div>
  );
};
