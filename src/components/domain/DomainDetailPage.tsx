
import { Navbar } from "@/components/Navbar";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { DomainDetailHeader } from "@/components/domain/DomainDetailHeader";
import { DomainDetailMainContent } from "@/components/domain/DomainDetailMainContent";
import { DomainDetailSidebar } from "@/components/domain/DomainDetailSidebar";
import { DomainShareButtons } from "@/components/domain/DomainShareButtons";
import { useDomainDetail } from "@/components/domain/useDomainDetail";
import { SimilarDomainsGrid } from "@/components/domain/SimilarDomainsGrid";
import { PriceHistoryChart } from "@/components/domain/PriceHistoryChart";
import { DomainValuationTool } from "@/components/domain/DomainValuationTool";
import NotFound from "@/pages/NotFound";

export const DomainDetailPage = () => {
  const { domain, similarDomains, priceHistory, isLoading, error } = useDomainDetail();

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

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <DomainDetailHeader domain={domain} />
        
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 space-y-8">
            <DomainDetailMainContent domain={domain} />
            <PriceHistoryChart data={priceHistory} />
          </div>
          <div className="mt-8 lg:mt-0 space-y-8">
            <DomainDetailSidebar domain={domain} />
            <DomainShareButtons domainName={domain.name} />
          </div>
        </div>

        <div className="mt-16">
          <DomainValuationTool />
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">相似域名</h2>
          <SimilarDomainsGrid domains={similarDomains} />
        </div>
      </main>
    </div>
  );
};
