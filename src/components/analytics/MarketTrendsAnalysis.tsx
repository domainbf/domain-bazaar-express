
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';

interface TrendData {
  period: string;
  avgPrice: number;
  totalSales: number;
  volume: number;
  growth: number;
}

interface CategoryData {
  category: string;
  value: number;
  growth: number;
  color: string;
}

interface TopDomain {
  name: string;
  price: number;
  category: string;
  soldDate: string;
}

export const MarketTrendsAnalysis: React.FC = () => {
  const [timeframe, setTimeframe] = useState('30d');
  const [category, setCategory] = useState('all');
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [topDomains, setTopDomains] = useState<TopDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeframe, category]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // 模拟加载市场趋势数据
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 价格趋势数据
      const mockTrendData: TrendData[] = [
        { period: '2024-01-01', avgPrice: 12000, totalSales: 45, volume: 540000, growth: 5.2 },
        { period: '2024-01-08', avgPrice: 12500, totalSales: 52, volume: 650000, growth: 4.2 },
        { period: '2024-01-15', avgPrice: 13200, totalSales: 48, volume: 633600, growth: 5.6 },
        { period: '2024-01-22', avgPrice: 12800, totalSales: 61, volume: 780800, growth: -3.0 },
        { period: '2024-01-29', avgPrice: 13500, totalSales: 58, volume: 783000, growth: 5.5 },
        { period: '2024-02-05', avgPrice: 14200, totalSales: 64, volume: 908800, growth: 5.2 },
        { period: '2024-02-12', avgPrice: 13800, totalSales: 59, volume: 814200, growth: -2.8 }
      ];
      
      // 分类数据
      const mockCategoryData: CategoryData[] = [
        { category: '精品域名', value: 35, growth: 8.2, color: '#8884d8' },
        { category: '短域名', value: 25, growth: 12.5, color: '#82ca9d' },
        { category: '数字域名', value: 20, growth: -2.1, color: '#ffc658' },
        { category: '品牌域名', value: 15, growth: 6.7, color: '#ff7300' },
        { category: '其他', value: 5, growth: -1.5, color: '#8dd1e1' }
      ];
      
      // 热门域名
      const mockTopDomains: TopDomain[] = [
        { name: 'ai-tech.com', price: 85000, category: '精品域名', soldDate: '2024-02-10' },
        { name: 'crypto.net', price: 72000, category: '品牌域名', soldDate: '2024-02-08' },
        { name: '888.cn', price: 65000, category: '数字域名', soldDate: '2024-02-05' },
        { name: 'web3.io', price: 58000, category: '精品域名', soldDate: '2024-02-03' },
        { name: 'nft.co', price: 45000, category: '品牌域名', soldDate: '2024-02-01' }
      ];
      
      setTrendData(mockTrendData);
      setCategoryData(mockCategoryData);
      setTopDomains(mockTopDomains);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    const csvContent = [
      'Period,Average Price,Total Sales,Volume,Growth%',
      ...trendData.map(d => 
        `${d.period},${d.avgPrice},${d.totalSales},${d.volume},${d.growth}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market_trends_${timeframe}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalVolume = trendData.reduce((sum, item) => sum + item.volume, 0);
  const averageGrowth = trendData.length > 0 
    ? trendData.reduce((sum, item) => sum + item.growth, 0) / trendData.length 
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="h-64 flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">加载中...</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              市场趋势分析
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">近7天</SelectItem>
                  <SelectItem value="30d">近30天</SelectItem>
                  <SelectItem value="90d">近90天</SelectItem>
                  <SelectItem value="1y">近1年</SelectItem>
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有分类</SelectItem>
                  <SelectItem value="premium">精品域名</SelectItem>
                  <SelectItem value="short">短域名</SelectItem>
                  <SelectItem value="numeric">数字域名</SelectItem>
                  <SelectItem value="brandable">品牌域名</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 关键指标 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总交易额</p>
                <p className="text-2xl font-bold">¥{(totalVolume / 10000).toFixed(0)}万</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center mt-2">
              <Badge variant={averageGrowth > 0 ? 'default' : 'destructive'}>
                {averageGrowth > 0 ? '+' : ''}{averageGrowth.toFixed(1)}%
              </Badge>
              <span className="text-xs text-muted-foreground ml-2">较上期</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">平均价格</p>
                <p className="text-2xl font-bold">
                  ¥{trendData.length > 0 
                    ? Math.round(trendData.reduce((sum, item) => sum + item.avgPrice, 0) / trendData.length).toLocaleString()
                    : '0'
                  }
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总成交数</p>
                <p className="text-2xl font-bold">
                  {trendData.reduce((sum, item) => sum + item.totalSales, 0)}
                </p>
              </div>
              <PieChart className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">活跃度</p>
                <p className="text-2xl font-bold">85%</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 价格趋势图表 */}
      <Card>
        <CardHeader>
          <CardTitle>价格趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="avgPrice" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="平均价格"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 分类分布 */}
        <Card>
          <CardHeader>
            <CardTitle>分类分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <RechartsPieChart
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </RechartsPieChart>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {categoryData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.value}%</span>
                    <Badge variant={item.growth > 0 ? 'default' : 'destructive'} className="text-xs">
                      {item.growth > 0 ? '+' : ''}{item.growth}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 热门成交域名 */}
        <Card>
          <CardHeader>
            <CardTitle>热门成交域名</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topDomains.map((domain, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{domain.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {domain.category} • {new Date(domain.soldDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      ¥{domain.price.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 交易量趋势 */}
      <Card>
        <CardHeader>
          <CardTitle>交易量趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalSales" fill="#82ca9d" name="成交数量" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
