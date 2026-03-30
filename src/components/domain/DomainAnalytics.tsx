import { DomainAnalytics as DomainAnalyticsType } from '@/types/domain';
import { Badge } from '@/components/ui/badge';
import { Eye, Heart, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

interface TrendData {
  date: string;
  views: number;
}

interface DomainAnalyticsProps {
  domainId: string;
  createdAt?: string;
  analytics: DomainAnalyticsType | null;
  trends: TrendData[];
  isFavorited: boolean;
  toggleFavorite: () => void;
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const daysSinceListing = (createdAt?: string) => {
  if (!createdAt) return 'N/A';
  const created = new Date(createdAt);
  const today = new Date();
  const diffDays = Math.ceil(Math.abs(today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const DomainAnalytics = ({
  createdAt,
  analytics,
  trends,
  isFavorited,
  toggleFavorite,
}: DomainAnalyticsProps) => {
  const isMobile = useIsMobile();

  const stats = [
    { icon: Eye, label: '浏览量', value: analytics?.views ?? 0, color: 'text-blue-600' },
    { icon: Heart, label: '收藏数', value: analytics?.favorites ?? 0, color: 'text-red-500' },
    { icon: TrendingUp, label: '报价数', value: analytics?.offers ?? 0, color: 'text-green-600' },
    { icon: Clock, label: '在售天数', value: daysSinceListing(createdAt), color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-5">
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-3`}>
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex flex-col items-center justify-center p-4 bg-muted/40 rounded-xl border">
            <Icon className={`h-5 w-5 mb-1 ${color}`} />
            <p className="text-2xl font-black">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>浏览量趋势</span>
            <Badge variant="outline" className="font-normal text-xs">过去30天</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatDate}
                  minTickGap={20}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [value, '浏览量']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('zh-CN')}
                  contentStyle={{ fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <button
          onClick={toggleFavorite}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
            isFavorited
              ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
              : 'bg-muted text-muted-foreground border-border hover:bg-accent'
          }`}
        >
          <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
          {isFavorited ? '已收藏此域名' : '收藏此域名'}
        </button>
      </div>
    </div>
  );
};
