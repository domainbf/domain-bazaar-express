
import { TabsContent } from "@/components/ui/tabs";
import { DomainManagement } from "@/components/usercenter/DomainManagement";
import { TransactionHistory } from "@/components/usercenter/TransactionHistory";
import { NotificationsPanel } from "@/components/usercenter/NotificationsPanel";
import { ProfileSettings } from "@/components/usercenter/ProfileSettings";
import React from "react";

export const UserCenterTabsContent: React.FC = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <TabsContent value="domains">
      <DomainManagement />
    </TabsContent>
    <TabsContent value="transactions">
      <TransactionHistory />
    </TabsContent>
    <TabsContent value="notifications">
      <NotificationsPanel />
    </TabsContent>
    <TabsContent value="profile">
      <ProfileSettings />
    </TabsContent>
  </div>
);

