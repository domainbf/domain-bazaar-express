import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Target, Activity } from 'lucide-react';

export const MarketTrendsAnalysis: React.FC = () => {
  const marketStats = {
    totalListings: 2847,
    averagePrice: 15680,
    monthlyGrowth: 12.5,
    hotCategories: 3
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{marketStats.totalListings.toLocaleString()}</div>
            <div className="text-sm text-gray-600">总上架域名</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">¥{marketStats.averagePrice.toLocaleString()}</div>
            <div className="text-sm text-gray-600">平均价格</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{marketStats.monthlyGrowth}%</div>
            <div className="text-sm text-gray-600">月度增长</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Activity className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{marketStats.hotCategories}</div>
            <div className="text-sm text-gray-600">热门分类</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};