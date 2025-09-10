import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Eye, Search, TrendingUp } from 'lucide-react';

export const UserBehaviorAnalysis: React.FC = () => {
  const [stats, setStats] = useState({
    totalViews: 1543,
    totalSearches: 892,
    totalOffers: 234,
    uniqueUsers: 156
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Eye className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <div className="text-sm text-gray-600">总浏览量</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Search className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{stats.totalSearches.toLocaleString()}</div>
            <div className="text-sm text-gray-600">搜索次数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{stats.totalOffers.toLocaleString()}</div>
            <div className="text-sm text-gray-600">报价次数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{stats.uniqueUsers.toLocaleString()}</div>
            <div className="text-sm text-gray-600">活跃用户</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};