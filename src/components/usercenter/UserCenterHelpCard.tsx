
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, ClipboardList, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const UserCenterHelpCard: React.FC<Props> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <Card className="mb-6 bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-800 flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          用户中心使用帮助
        </CardTitle>
        <CardDescription className="text-blue-600">
          在这里您可以管理您的域名、查看交易记录并更新个人资料
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white p-3 rounded border border-blue-100">
            <h3 className="font-bold text-blue-800 mb-1 flex items-center gap-1">
              <ClipboardList className="h-4 w-4" />
              我的域名
            </h3>
            <p className="text-gray-600">管理您拥有的域名，上架或下架它们</p>
          </div>
          <div className="bg-white p-3 rounded border border-blue-100">
            <h3 className="font-bold text-blue-800 mb-1 flex items-center gap-1">
              <ClipboardList className="h-4 w-4" />
              交易记录
            </h3>
            <p className="text-gray-600">查看您的所有域名买卖交易记录</p>
          </div>
          <div className="bg-white p-3 rounded border border-blue-100">
            <h3 className="font-bold text-blue-800 mb-1 flex items-center gap-1">
              <Bell className="h-4 w-4" />
              通知中心
            </h3>
            <p className="text-gray-600">查看系统发送给您的所有通知和消息</p>
          </div>
          <div className="bg-white p-3 rounded border border-blue-100">
            <h3 className="font-bold text-blue-800 mb-1 flex items-center gap-1">
              <User className="h-4 w-4" />
              个人资料
            </h3>
            <p className="text-gray-600">更新您的个人信息和账户设置</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-blue-700"
          >
            关闭帮助
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

