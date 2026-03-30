import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, User, Eye, Heart, MessageSquare, RefreshCw, Search, Clock, DollarSign, Shield,
  Download, ChevronLeft, ChevronRight, Calendar
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  resource_id?: string;
  metadata?: any;
  created_at: string;
  user_agent?: string;
}

const activityConfig: Record<string, { icon: any; label: string; color: string }> = {
  'login': { icon: User, label: '用户登录', color: 'bg-blue-500/15 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  'view_domain': { icon: Eye, label: '查看域名', color: 'bg-muted text-muted-foreground' },
  'create_offer': { icon: MessageSquare, label: '提交报价', color: 'bg-purple-500/15 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  'favorite_domain': { icon: Heart, label: '收藏域名', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  'purchase': { icon: DollarSign, label: '完成购买', color: 'bg-green-500/15 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  'verify_domain': { icon: Shield, label: '域名验证', color: 'bg-yellow-500/15 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

const PAGE_SIZE = 20;

export const EnhancedActivityLog = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadActivities();
  }, [page, filterType]);

  useRealtimeSubscription(
    ["user_activities"],
    (_event) => { loadActivities(); }
  );

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('user_activities')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      
      if (filterType !== 'all') {
        query = query.eq('activity_type', filterType);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      setActivities(data || []);
      setTotalCount(count || 0);

      // Batch fetch user profiles
      const userIds = [...new Set((data || []).map(a => a.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name')
          .in('id', userIds);
        
        const map: Record<string, string> = {};
        profiles?.forEach(p => {
          map[p.id] = p.full_name || p.username || p.id.slice(0, 8);
        });
        setUserMap(map);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (!searchQuery) return true;
    const userName = userMap[activity.user_id] || activity.user_id || '';
    return activity.activity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (date: string) => {
    const now = new Date();
    const d = new Date(date);
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}天前`;
    return d.toLocaleDateString('zh-CN');
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const exportLog = () => {
    const csv = [
      ['时间', '类型', '用户', '资源ID'].join(','),
      ...filteredActivities.map(a => [
        new Date(a.created_at).toLocaleString('zh-CN'),
        activityConfig[a.activity_type]?.label || a.activity_type,
        userMap[a.user_id] || a.user_id?.slice(0, 8),
        a.resource_id || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              操作审计日志
            </CardTitle>
            <CardDescription>实时监控用户活动 · 共 {totalCount} 条记录</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportLog}>
              <Download className="h-4 w-4 mr-1" />
              导出
            </Button>
            <Button variant="outline" size="sm" onClick={loadActivities} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户或活动类型..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(0); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="活动类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="login">用户登录</SelectItem>
              <SelectItem value="view_domain">查看域名</SelectItem>
              <SelectItem value="create_offer">提交报价</SelectItem>
              <SelectItem value="favorite_domain">收藏域名</SelectItem>
              <SelectItem value="purchase">完成购买</SelectItem>
              <SelectItem value="verify_domain">域名验证</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[420px]">
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
            <div className="space-y-2">
              {filteredActivities.map((activity) => {
                const config = activityConfig[activity.activity_type] || { icon: Activity, label: activity.activity_type, color: 'bg-muted text-muted-foreground' };
                const Icon = config.icon;
                const userName = userMap[activity.user_id] || activity.user_id?.slice(0, 8) || '匿名';

                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                    <div className={`p-2 rounded-full shrink-0 ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{userName}</span>
                        <Badge variant="outline" className="text-xs">{config.label}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                          <Clock className="h-3 w-3" />
                          {formatTime(activity.created_at)}
                        </span>
                      </div>
                      {activity.resource_id && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          资源: {activity.resource_id.slice(0, 12)}...
                        </p>
                      )}
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Object.entries(activity.metadata).slice(0, 3).map(([key, val]) => (
                            <Badge key={key} variant="secondary" className="text-[10px] py-0">
                              {key}: {String(val).slice(0, 20)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <span className="text-xs text-muted-foreground">
              第 {page + 1} / {totalPages} 页
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
