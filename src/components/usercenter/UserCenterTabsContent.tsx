
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DomainManagement } from "@/components/usercenter/DomainManagement";
import { TransactionHistory } from "@/components/usercenter/TransactionHistory";
import { NotificationsPanel } from "@/components/usercenter/NotificationsPanel";
import { ProfileSettings } from "@/components/usercenter/ProfileSettings";
import { AccountSecurity } from "@/components/usercenter/AccountSecurity";
import React, { useState } from "react";
import { User, Shield } from "lucide-react";

export const UserCenterTabsContent: React.FC = () => {
  const [profileTab, setProfileTab] = useState('info');

  return (
    <div className="space-y-6">
      <TabsContent value="domains" className="mt-0">
        <DomainManagement />
      </TabsContent>
      <TabsContent value="transactions" className="mt-0">
        <TransactionHistory />
      </TabsContent>
      <TabsContent value="notifications" className="mt-0">
        <NotificationsPanel />
      </TabsContent>
      <TabsContent value="profile" className="mt-0">
        <Tabs value={profileTab} onValueChange={setProfileTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              个人信息
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              账户安全
            </TabsTrigger>
          </TabsList>
          <TabsContent value="info">
            <ProfileSettings />
          </TabsContent>
          <TabsContent value="security">
            <AccountSecurity />
          </TabsContent>
        </Tabs>
      </TabsContent>
    </div>
  );
};

