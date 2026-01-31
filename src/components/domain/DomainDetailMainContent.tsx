import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { Domain } from "@/types/domain";
import { PriceHistoryChart } from "./PriceHistoryChart";
import { DomainAnalytics } from "./DomainAnalytics";
import { SimilarDomainsGrid } from "./SimilarDomainsGrid";
import { DomainOwnerInfo } from "./DomainOwnerInfo";
import { OfferHistory } from "./OfferHistory";
import { DomainValuationReport } from "./DomainValuationReport";
import { DomainWhoisInfo } from "./DomainWhoisInfo";

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
  <div className="space-y-6">
    {/* 域名所有者信息 */}
    {domain.owner && (
      <DomainOwnerInfo owner={domain.owner} />
    )}

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

    {/* WHOIS 信息 */}
    <DomainWhoisInfo domainName={domain.name} />

    {/* 出价历史 */}
    <OfferHistory domainId={domain.id} currentPrice={domain.price} />

    {/* 域名估值报告 */}
    <DomainValuationReport domainName={domain.name} currentPrice={domain.price} />

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
          <SimilarDomainsGrid domains={similarDomains} currentDomainName={domain.name} />
        </CardContent>
      </Card>
    )}
  </div>
);

