import React, { useState, useEffect, Suspense, ReactElement } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Domain, DomainPriceHistory } from "@/types/domain";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Heart, Eye, MessageSquare, Shield, DollarSign } from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useDomainDetail } from "./useDomainDetail";
import { DomainDetailHeader } from "./DomainDetailHeader";

// 使用 React.lazy 动态导入子内容
const DomainDetailMainContent = React.lazy(() =>
  import("./DomainDetailMainContent").then(mod => ({ default: mod.DomainDetailMainContent }))
);
const DomainDetailSidebar = React.lazy(() =>
  import("./DomainDetailSidebar").then(mod => ({ default: mod.DomainDetailSidebar }))
);
const DomainOfferForm = React.lazy(() =>
  import("@/components/domain/DomainOfferForm").then(mod => ({ default: mod.DomainOfferForm }))
);
const MultiCurrencyPayment = React.lazy(() =>
  import("@/components/payment/MultiCurrencyPayment").then(mod => ({ default: mod.MultiCurrencyPayment }))
);
const DomainShareButtons = React.lazy(() =>
  import("@/components/domain/DomainShareButtons").then(mod => ({ default: mod.DomainShareButtons }))
);

export const DomainDetailPage: React.FC = () => {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate = useNavigate();

  const {
    domain,
    priceHistory,
    similarDomains,
    isLoading,
    error,
    reload,
  } = useDomainDetail(domainId);

  const [showOfferForm, setShowOfferForm] = React.useState(false);
  const [showPaymentForm, setShowPaymentForm] = React.useState(false);
  const [isFavorited, setIsFavorited] = React.useState(false);

  // 收藏逻辑
  const handleFavoriteToggle = async () => {
    if (!domain) return;
    setIsFavorited((cur) => !cur);
    toast.success(isFavorited ? "已取消收藏" : "已添加收藏");
  };

  // 支付
  const handlePurchase = () => {
    if (!domain || domain.status !== "available") {
      toast.error("域名当前不可购买");
      return;
    }
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    toast.success("购买成功！域名转移将在24小时内完成");
    reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-muted-foreground">正在加载域名详情…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !domain) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-destructive">
              {error || "域名不存在"}
            </h1>
            <p className="text-muted-foreground mb-6">{error || "请检查域名地址是否正确，或返回市场浏览其他域名"}</p>
            <div className="space-x-4">
              <Button onClick={() => navigate("/marketplace")}>返回市场</Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                重新加载
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 页面渲染
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 transition-all animate-fade-in">
        {/* Header部分 */}
        <div className="mb-8">
          <DomainDetailHeader
            domain={{
              name: domain.name,
              is_verified: domain.is_verified,
              category: domain.category,
              views: domain.views || 0,
              status: domain.status,
              price: domain.price
            }}
            isFavorited={isFavorited}
            onToggleFavorite={handleFavoriteToggle}
          />
        </div>
        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Suspense
            fallback={
              <div className="lg:col-span-2 bg-white rounded-lg h-80 flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            }
          >
            <DomainDetailMainContent
              domain={domain}
              priceHistory={priceHistory}
              similarDomains={similarDomains}
            />
          </Suspense>
          <Suspense
            fallback={
              <div className="bg-white rounded-lg h-80 flex items-center justify-center">
                <LoadingSpinner size="md" />
              </div>
            }
          >
            <DomainDetailSidebar
              domain={domain}
              onPurchase={handlePurchase}
              onOffer={() => setShowOfferForm(true)}
            />
          </Suspense>
        </div>
      </div>
      {/* 报价弹窗、支付弹窗 */}
      <Suspense fallback={null}>
        {showOfferForm && domain && (
          <DomainOfferForm
            domain={domain}
            onClose={() => setShowOfferForm(false)}
            onSuccess={() => {
              setShowOfferForm(false);
              reload();
            }}
          />
        )}
        {showPaymentForm && domain && (
          <MultiCurrencyPayment
            domain={domain}
            onPaymentSuccess={handlePaymentSuccess}
            onClose={() => setShowPaymentForm(false)}
          />
        )}
      </Suspense>
    </div>
  );
};
