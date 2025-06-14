
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { Domain } from "@/types/domain";
import { PriceHistoryChart } from "@/components/domain/PriceHistoryChart";
import { DomainAnalytics } from "@/components/domain/DomainAnalytics";
import { SimilarDomainsGrid } from "@/components/domain/SimilarDomainsGrid";

interface Props {
  domain: Domain;
  priceHistory: any[];
  similarDomains: Domain[];
}

export const DomainDetailMainContent: React.FC<Props> = ({
  domain,
  priceHistory,
  similarDomains,
}) => (
  <div className="lg:col-span-2 space-y-6">
    {/* 域名描述 */}
    {domain.description && (
      <Card>
        <CardHeader>
          <CardTitle>域名描述</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {domain.description}
          </p>
        </CardContent>
      </Card>
    )}

    {/* 价格历史图表 */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          价格历史
        </CardTitle>
      </CardHeader>
      <CardContent>
        <PriceHistoryChart data={priceHistory} />
      </CardContent>
    </Card>

    {/* 域名分析 */}
    <Card>
      <CardHeader>
        <CardTitle>域名分析</CardTitle>
      </CardHeader>
      <CardContent>
        <DomainAnalytics domainId={domain.id} createdAt={domain.created_at} />
      </CardContent>
    </Card>

    {/* 相似域名推荐 */}
    {similarDomains.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle>相似域名推荐</CardTitle>
        </CardHeader>
        <CardContent>
          <SimilarDomainsGrid domains={similarDomains} />
        </CardContent>
      </Card>
    )}
  </div>
);

