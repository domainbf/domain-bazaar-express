
import { Navbar } from "@/components/Navbar";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { DomainDetailHeader } from "@/components/domain/DomainDetailHeader";
import { DomainDetailMainContent } from "@/components/domain/DomainDetailMainContent";
import { DomainDetailSidebar } from "@/components/domain/DomainDetailSidebar";
import { DomainShareButtons } from "@/components/domain/DomainShareButtons";
import { useDomainDetail } from "@/components/domain/useDomainDetail";
import { useDomainAnalytics } from "@/hooks/useDomainAnalytics";
import { DomainValuationTool } from "@/components/domain/DomainValuationTool";
import NotFound from "@/pages/NotFound";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DomainOfferForm } from "@/components/domain/DomainOfferForm";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const DomainDetailPage = () => {
  const { domain, similarDomains, priceHistory, isLoading, error } = useDomainDetail();
  const { analytics, isFavorited, recordView, toggleFavorite } = useDomainAnalytics(domain?.id || '');
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Record view when domain loads - 只记录一次
  useEffect(() => {
    if (domain?.id) {
      recordView();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain?.id]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <LoadingSpinner size="lg" text="加载域名信息中..." />
        </div>
      </>
    );
  }

  if (error || !domain) {
    return <NotFound />;
  }

  const handleToggleFavorite = () => {
    toggleFavorite();
  };

  const handlePurchase = () => {
    // 检查是否是所有者
    if (user?.id === domain.owner_id) {
      console.log('您不能购买自己的域名');
      return;
    }
    console.log(`Purchasing ${domain.name}`);
  };

  const handleOffer = () => {
    // 检查是否是所有者
    if (user?.id === domain.owner_id) {
      console.log('您不能对自己的域名报价');
      return;
    }
    setIsOfferModalOpen(true);
  };

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 返回按钮 */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-accent"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        
        <DomainDetailHeader
          domain={{
            ...domain,
            views: analytics?.views || 0,
            favorites: analytics?.favorites || 0,
            offers: analytics?.offers || 0
          }} 
          isFavorited={isFavorited} 
          onToggleFavorite={handleToggleFavorite} 
        />
        
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 space-y-8">
            <DomainDetailMainContent 
              domain={domain} 
              priceHistory={priceHistory} 
              similarDomains={similarDomains} 
            />
          </div>
          <div className="mt-8 lg:mt-0 space-y-8">
            <DomainDetailSidebar 
              domain={domain}
              onPurchase={handlePurchase}
              onOffer={handleOffer}
            />
            <DomainShareButtons domainName={domain.name} />
          </div>
        </div>

        <div className="mt-16">
          <DomainValuationTool />
        </div>

      </main>

      {/* 只有非所有者才能看到报价对话框 */}
      {user?.id !== domain.owner_id && (
        <Dialog open={isOfferModalOpen} onOpenChange={setIsOfferModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>为 {domain.name} 提交报价</DialogTitle>
              <DialogDescription>
                您的报价将发送给域名所有者。如果他们感兴趣，将通过您提供的邮箱与您联系。
              </DialogDescription>
            </DialogHeader>
            <DomainOfferForm
              domain={domain.name}
              domainId={domain.id}
              sellerId={domain.owner_id}
              onClose={() => setIsOfferModalOpen(false)}
              isAuthenticated={!!user}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
