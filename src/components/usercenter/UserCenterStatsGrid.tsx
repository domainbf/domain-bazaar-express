
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";
import React from "react";
import { UserProfile } from "@/types/userProfile";

interface Props {
  profile?: UserProfile;
  user: any;
}

export const UserCenterStatsGrid: React.FC<Props> = ({ profile, user }) => (
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
    <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5" />
          账户状态
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{profile?.account_level || "基础用户"}</p>
        <p className="text-xs opacity-80 mt-1">
          注册时间: {new Date(user?.created_at || Date.now()).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">我的域名</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{profile?.domains_count || 0}</p>
        <p className="text-xs text-gray-500 mt-1">在售域名</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">成功交易</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{profile?.completed_transactions || 0}</p>
        <p className="text-xs text-gray-500 mt-1">已完成交易</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">余额</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">${profile?.balance || "0.00"}</p>
        <p className="text-xs text-gray-500 mt-1">账户余额</p>
      </CardContent>
    </Card>
  </div>
);

