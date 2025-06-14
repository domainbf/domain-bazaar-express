
import { useEffect } from 'react';
import { useDomainAnalytics } from '@/hooks/useDomainAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Heart, Star, TrendingUp, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface DomainAnalyticsProps {
  domainId: string;
  createdAt?: string;
}

export const DomainAnalytics = ({ domainId, createdAt }: DomainAnalyticsProps) => {
  const { 
    analytics, 
    isLoading, 
    trends, 
    recordView, 
    toggleFavorite,
    isFavorited 
  } = useDomainAnalytics(domainId);
  const isMobile = useIsMobile();

  useEffect(() => {
    recordView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const daysSinceListing = () => {
    if (!createdAt) return 'N/A';
    const created = new Date(createdAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <LoadingSpinner />
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">域名数据</h2>
        <Button
          variant={isFavorited ? "default" : "outline"}
          size="sm"
          onClick={() => toggleFavorite()}
          className="flex items-center gap-1"
        >
          <Heart className={`h-4 w-4 ${isFavorited ? 'fill-white' : ''}`} />
          {isFavorited ? '已收藏' : '收藏'}
        </Button>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-4`}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1 text-gray-500">
              <Eye className="h-4 w-4" />
              浏览量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics?.views || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1 text-gray-500">
              <Heart className="h-4 w-4" />
              收藏数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics?.favorites || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1 text-gray-500">
              <TrendingUp className="h-4 w-4" />
              报价数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics?.offers || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1 text-gray-500">
              <Clock className="h-4 w-4" />
              在售天数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{daysSinceListing()}</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>浏览量趋势</span>
            <Badge variant="outline" className="font-normal">
              过去30天
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trends}
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.getDate().toString();
                  }}
                  minTickGap={15}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [value, '浏览量']} labelFormatter={formatDate} />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ r: 1 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
