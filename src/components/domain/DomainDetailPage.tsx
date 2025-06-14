
import { Navbar } from "@/components/Navbar";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { DomainDetailHeader } from "@/components/domain/DomainDetailHeader";
import { DomainDetailMainContent } from "@/components/domain/DomainDetailMainContent";
import { DomainDetailSidebar } from "@/components/domain/DomainDetailSidebar";
import { DomainShareButtons } from "@/components/domain/DomainShareButtons";
import { useDomainDetail } from "@/components/domain/useDomainDetail";
import { DomainValuationTool } from "@/components/domain/DomainValuationTool";
import NotFound from "@/pages/NotFound";
import { useState } from "react";

export const DomainDetailPage = () => {
  const { domain, similarDomains, priceHistory, isLoading, error } = useDomainDetail();
  const [isFavorited, setIsFavorited] = useState(false);

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
    setIsFavorited(!isFavorited);
  };

  const handlePurchase = () => {
    console.log(`Purchasing ${domain.name}`);
  };

  const handleOffer = () => {
    console.log(`Making an offer for ${domain.name}`);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <DomainDetailHeader 
          domain={domain} 
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
    </div>
  );
};
