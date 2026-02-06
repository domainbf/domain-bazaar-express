import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  User, 
  Globe, 
  DollarSign, 
  Shield, 
  Eye, 
  Heart,
  MessageSquare,
  RefreshCw,
  Search,
  Filter,
  Clock
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  resource_id?: string;
  metadata?: any;
  created_at: string;
  user_agent?: string;
}

const activityIcons: Record<string, any> = {
  'login': User,
  'view_domain': Eye,
  'create_offer': MessageSquare,
  'favorite_domain': Heart,
  'purchase': DollarSign,
  'verify_domain': Shield,
  'default': Activity
};

const activityLabels: Record<string, string> = {
  'login': '用户登录',
  'view_domain': '查看域名',
  'create_offer': '提交报价',
  'favorite_domain': '收藏域名',
  'purchase': '完成购买',
  'verify_domain': '域名验证'
};

const activityColors: Record<string, string> = {
  'login': 'bg-blue-100 text-blue-700',
  'view_domain': 'bg-gray-100 text-gray-700',
  'create_offer': 'bg-purple-100 text-purple-700',
  'favorite_domain': 'bg-pink-100 text-pink-700',
  'purchase': 'bg-green-100 text-green-700',
  'verify_domain': 'bg-yellow-100 text-yellow-700'
};

export const AdminActivityLog = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadActivities();
    
    // 设置实时订阅
    const channel = supabase
      .channel('admin-activities')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_activities' },
        (payload) => {
          setActivities(prev => [payload.new as ActivityLog, ...prev].slice(0, 100));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = !searchQuery || 
      activity.activity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.user_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || activity.activity_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const formatTime = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diff = now.getTime() - activityDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return activityDate.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              活动日志
            </CardTitle>
            <CardDescription>实时监控用户活动</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadActivities} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索活动..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="活动类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="login">用户登录</SelectItem>
              <SelectItem value="view_domain">查看域名</SelectItem>
              <SelectItem value="create_offer">提交报价</SelectItem>
              <SelectItem value="favorite_domain">收藏域名</SelectItem>
              <SelectItem value="purchase">完成购买</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>暂无活动记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((activity) => {
                const Icon = activityIcons[activity.activity_type] || activityIcons.default;
                const label = activityLabels[activity.activity_type] || activity.activity_type;
                const colorClass = activityColors[activity.activity_type] || 'bg-gray-100 text-gray-700';

                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`p-2 rounded-full ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {label}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(activity.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        用户 {activity.user_id?.slice(0, 8)}...
                        {activity.resource_id && ` - 资源 ${activity.resource_id.slice(0, 8)}...`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
