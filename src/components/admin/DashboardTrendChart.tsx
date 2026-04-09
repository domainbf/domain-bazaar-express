import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TrendData {
  date: string;
  users: number;
  domains: number;
  offers: number;
  views: number;
}

const chartConfig = {
  users: { label: "用户", color: "hsl(221, 83%, 53%)" },
  domains: { label: "域名", color: "hsl(142, 71%, 45%)" },
  offers: { label: "报价", color: "hsl(280, 65%, 60%)" },
  views: { label: "浏览", color: "hsl(25, 95%, 53%)" },
};

const COLORS = ['hsl(221, 83%, 53%)', 'hsl(142, 71%, 45%)', 'hsl(280, 65%, 60%)', 'hsl(25, 95%, 53%)', 'hsl(350, 80%, 55%)'];
const CAT_LABELS: Record<string, string> = {
  standard: '标准', premium: '精品', business: '商务',
  numeric: '数字', short: '短域名', brandable: '品牌', keyword: '关键词'
};

export const DashboardTrendChart = () => {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrendData();
  }, []);

  const fetchTrendData = async () => {
    setIsLoading(true);
    try {
      // Generate 7-day trend from actual data
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);

      const [domainsRes, offersRes, catRes] = await Promise.all([
        supabase.from('domain_listings').select('created_at').gte('created_at', sevenDaysAgo.toISOString()),
        supabase.from('domain_offers').select('created_at').gte('created_at', sevenDaysAgo.toISOString()),
        supabase.from('domain_listings').select('category'),
      ]);

      // Build daily counts
      const trends: TrendData[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayDomains = (domainsRes.data ?? []).filter(r => r.created_at?.startsWith(dateStr)).length;
        const dayOffers = (offersRes.data ?? []).filter(r => r.created_at?.startsWith(dateStr)).length;
        trends.push({ date: dateStr.slice(5), users: 0, domains: dayDomains, offers: dayOffers, views: 0 });
      }
      setTrendData(trends);

      // Category distribution
      const catCounts: Record<string, number> = {};
      for (const row of (catRes.data ?? [])) {
        const cat = (row.category as string) || 'standard';
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      }
      setCategoryData(Object.entries(catCounts).map(([name, value]) => ({
        name: CAT_LABELS[name] || name,
        value,
      })));
    } catch (error) {
      console.error('Error fetching trend data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-64 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              7日数据趋势
            </CardTitle>
            <Tabs value={chartType} onValueChange={(v) => setChartType(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="area" className="text-xs px-2 py-1"><TrendingUp className="h-3 w-3" /></TabsTrigger>
                <TabsTrigger value="bar" className="text-xs px-2 py-1"><BarChart3 className="h-3 w-3" /></TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            {chartType === 'area' ? (
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="users" stackId="1" stroke="var(--color-users)" fill="var(--color-users)" fillOpacity={0.3} />
                <Area type="monotone" dataKey="domains" stackId="1" stroke="var(--color-domains)" fill="var(--color-domains)" fillOpacity={0.3} />
                <Area type="monotone" dataKey="offers" stackId="1" stroke="var(--color-offers)" fill="var(--color-offers)" fillOpacity={0.3} />
              </AreaChart>
            ) : (
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="users" fill="var(--color-users)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="domains" fill="var(--color-domains)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="offers" fill="var(--color-offers)" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <PieIcon className="h-5 w-5 text-primary" />
            域名分类分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center -mt-4">
                {categoryData.map((item, index) => (
                  <div key={index} className="flex items-center gap-1 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-muted-foreground">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
              暂无分类数据
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
