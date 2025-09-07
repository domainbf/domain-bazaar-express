
import { TabsContent } from "@/components/ui/tabs";
import { DomainManagement } from "@/components/usercenter/DomainManagement";
import { TransactionHistory } from "@/components/usercenter/TransactionHistory";
import { NotificationsPanel } from "@/components/usercenter/NotificationsPanel";
import { ProfileSettings } from "@/components/usercenter/ProfileSettings";
import React from "react";

export const UserCenterTabsContent: React.FC = () => (
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
      <ProfileSettings />
    </TabsContent>
  </div>
);

