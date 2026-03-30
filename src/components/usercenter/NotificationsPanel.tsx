
import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Notification } from '@/types/domain';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Check, Search, Trash2, CheckCheck } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const NotificationsPanel = () => {
  const { user } = useAuth();
  const { notifications, isLoading, markAsRead, markAllAsRead, unreadCount, refreshNotifications } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || notification.type === filterType;
    return matchesSearch && matchesType;
  });

  // Group notifications by date
  const groupedNotifications: Record<string, Notification[]> = {};
  filteredNotifications.forEach(notification => {
    const date = new Date(notification.created_at);
    const dateString = new Date().toDateString() === date.toDateString()
      ? '今天'
      : new Date(Date.now() - 86400000).toDateString() === date.toDateString()
        ? '昨天'
        : date.toLocaleDateString('zh-CN');
    
    if (!groupedNotifications[dateString]) {
      groupedNotifications[dateString] = [];
    }
    groupedNotifications[dateString].push(notification);
  });

  const handleDeleteNotification = async (notificationId: string) => {
    setDeletingIds(prev => new Set(prev).add(notificationId));
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;
      toast.success('通知已删除');
      refreshNotifications();
    } catch (error: any) {
      toast.error('删除失败');
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user?.id)
        .eq('is_read', true);

      if (error) throw error;
      toast.success('已清除所有已读通知');
      refreshNotifications();
    } catch (error: any) {
      toast.error('清除失败');
    }
  };

  const getNotificationTypeBadge = (type: string) => {
    switch (type) {
      case 'offer': return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">报价</Badge>;
      case 'verification': return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">验证</Badge>;
      case 'transaction': return <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20">交易</Badge>;
      case 'message': return <Badge className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20">消息</Badge>;
      case 'dispute': return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">纠纷</Badge>;
      case 'escrow': return <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20">托管</Badge>;
      case 'auction': return <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20">拍卖</Badge>;
      case 'system': return <Badge variant="secondary">系统</Badge>;
      default: return <Badge variant="secondary">通知</Badge>;
    }
  };

  const readCount = notifications.filter(n => n.is_read).length;

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          通知中心 
          {unreadCount > 0 && (
            <Badge className="bg-primary/10 text-primary border-primary/20">{unreadCount} 未读</Badge>
          )}
        </h2>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="flex items-center gap-1">
              <CheckCheck className="h-4 w-4" />
              全部已读
            </Button>
          )}
          {readCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleDeleteAllRead} className="flex items-center gap-1 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
              清除已读
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="搜索通知..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="筛选类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="offer">报价通知</SelectItem>
            <SelectItem value="transaction">交易通知</SelectItem>
            <SelectItem value="message">站内消息</SelectItem>
            <SelectItem value="escrow">托管通知</SelectItem>
            <SelectItem value="dispute">纠纷通知</SelectItem>
            <SelectItem value="auction">拍卖通知</SelectItem>
            <SelectItem value="verification">认证通知</SelectItem>
            <SelectItem value="system">系统通知</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground text-lg font-medium mb-2">暂无通知</p>
            <p className="text-muted-foreground/70">您还没有收到任何通知</p>
          </CardContent>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">没有找到符合条件的通知</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([date, notifs]) => (
            <div key={date} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{date}</h3>
              <div className="space-y-2">
                {notifs.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`hover:bg-muted/50 transition-colors ${!notification.is_read ? 'border-l-4 border-l-primary' : ''} ${deletingIds.has(notification.id) ? 'opacity-50' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <Link 
                            to={notification.action_url || '#'} 
                            className="block"
                            onClick={() => {
                              if (!notification.is_read) {
                                markAsRead(notification.id);
                              }
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium">{notification.title}</h4>
                                {getNotificationTypeBadge(notification.type)}
                                {!notification.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground/60 shrink-0 ml-2">
                                {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-muted-foreground mt-1 text-sm">{notification.message}</p>
                          </Link>
                        </div>
                        
                        {/* 操作按钮 */}
                        <div className="flex items-center gap-1 shrink-0">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => markAsRead(notification.id)}
                              title="标为已读"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteNotification(notification.id)}
                            disabled={deletingIds.has(notification.id)}
                            title="删除通知"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
