
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, MessageSquare, ShieldCheck } from "lucide-react";
import { Domain } from "@/types/domain";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Props {
  domain: Domain;
  onPurchase: () => void;
  onOffer: () => void;
}

export const DomainDetailSidebar: React.FC<Props> = ({
  domain,
  onPurchase,
  onOffer,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // 检查当前用户是否是域名所有者
  const isOwner = user?.id === domain.owner_id;

  const handleVerifyDomain = () => {
    if (isOwner) {
      navigate(`/domain-verification/${domain.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 购买/报价面板 - 只对非所有者显示 */}
      {!isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>购买选项</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full"
              size="lg"
              onClick={onPurchase}
              disabled={domain.status !== "available"}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              立即购买 {(domain as any).currency === 'CNY' ? '¥' : '$'}{domain.price.toLocaleString()}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={onOffer}
              disabled={domain.status !== "available"}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              提交报价
            </Button>
            <div className="text-xs text-muted-foreground text-center">
              所有交易都受到平台保护
            </div>
          </CardContent>
        </Card>
      )}

      {/* 所有者操作面板 - 只对所有者显示 */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>域名管理</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!domain.is_verified && domain.verification_status !== 'verified' && (
              <Button
                className="w-full"
                onClick={handleVerifyDomain}
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                验证域名所有权
              </Button>
            )}
            
            {domain.is_verified && (
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <ShieldCheck className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-green-800">域名已验证</span>
                </div>
                <p className="text-sm text-green-600">您的域名所有权已通过验证</p>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground text-center">
              这是您的域名，您可以在用户中心管理更多设置
            </div>
          </CardContent>
        </Card>
      )}

      {/* 域名信息 */}
      <Card>
        <CardHeader>
          <CardTitle>域名信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">域名长度</span>
            <span>{domain.name.length} 字符</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">创建时间</span>
            <span>{new Date(domain.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">状态</span>
            <Badge variant={domain.status === "available" ? "default" : "secondary"}>
              {domain.status === "available" ? "可购买" : "不可用"}
            </Badge>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">验证状态</span>
            <Badge variant={domain.is_verified ? "default" : "secondary"}>
              {domain.is_verified ? "已验证" : domain.verification_status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
