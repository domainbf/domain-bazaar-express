
import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Notification } from '@/types/domain';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Check, Search, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export const NotificationsPanel = () => {
  const { notifications, isLoading, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Filter notifications
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
        : date.toLocaleDateString();
    
    if (!groupedNotifications[dateString]) {
      groupedNotifications[dateString] = [];
    }
    
    groupedNotifications[dateString].push(notification);
  });

  // Get notification type label
  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'offer': return '报价';
      case 'verification': return '验证';
      case 'transaction': return '交易';
      case 'system': return '系统';
      default: return '通知';
    }
  };

  // Get badge color for notification type
  const getNotificationTypeBadge = (type: string) => {
    switch (type) {
      case 'offer': return <Badge className="bg-blue-500">报价</Badge>;
      case 'verification': return <Badge className="bg-green-500">验证</Badge>;
      case 'transaction': return <Badge className="bg-purple-500">交易</Badge>;
      case 'system': return <Badge>系统</Badge>;
      default: return <Badge>通知</Badge>;
    }
  };

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
            <Badge className="bg-blue-500">{unreadCount} 未读</Badge>
          )}
        </h2>
        
        {unreadCount > 0 && (
          <Button 
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="flex items-center gap-1"
          >
            <Check className="h-4 w-4" />
            全部标为已读
          </Button>
        )}
      </div>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
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
            <SelectItem value="verification">验证通知</SelectItem>
            <SelectItem value="transaction">交易通知</SelectItem>
            <SelectItem value="system">系统通知</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg font-medium mb-2">暂无通知</p>
            <p className="text-gray-400">您还没有收到任何通知</p>
          </CardContent>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">没有找到符合条件的通知</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([date, notifs]) => (
            <div key={date} className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">{date}</h3>
              <div className="space-y-2">
                {notifs.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`hover:bg-gray-50 transition-colors ${!notification.is_read ? 'border-l-4 border-l-blue-500' : ''}`}
                  >
                    <CardContent className="p-4">
                      <Link 
                        to={notification.action_url || '#'} 
                        className="block"
                        onClick={() => {
                          if (!notification.is_read) {
                            markAsRead(notification.id);
                          }
                          if (!notification.action_url) {
                            return;
                          }
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{notification.title}</h4>
                            {getNotificationTypeBadge(notification.type)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <p className="text-gray-600 mt-1">{notification.message}</p>
                      </Link>
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
