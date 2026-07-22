import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCheck, Inbox, RefreshCw, Search, Bell } from 'lucide-react';

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'unread', label: '未读' },
  { key: 'transaction', label: '订单进度' },
  { key: 'receipt', label: '收据 / 邮件' },
] as const;

type FilterKey = typeof FILTERS[number]['key'];

const isReceipt = (n: any) =>
  /收据|receipt|邮件|发送失败/i.test(`${n?.title || ''} ${n?.message || ''}`);

export default function NotificationsCenter() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, refreshNotifications } =
    useNotifications();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return notifications.filter((n: any) => {
      if (filter === 'unread' && n.is_read) return false;
      if (filter === 'transaction' && n.type !== 'transaction') return false;
      if (filter === 'receipt' && !isReceipt(n)) return false;
      if (s && !`${n.title} ${n.message}`.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [notifications, filter, q]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5" /> 通知中心
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            共 {notifications.length} 条 · 未读 <b>{unreadCount}</b>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshNotifications}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> 刷新
          </Button>
          <Button size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <CheckCheck className="w-4 h-4 mr-1.5" /> 全部标记为已读
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key === 'unread' && unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </Button>
        ))}
        <div className="relative ml-auto flex-1 min-w-[180px] max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索通知..."
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {filtered.length} 条{filter === 'all' ? '通知' : `匹配「${FILTERS.find((f) => f.key === filter)?.label}」`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">加载中...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
              暂无通知
            </div>
          ) : (
            filtered.map((n: any) => (
              <div
                key={n.id}
                className={`px-4 py-3 flex items-start gap-3 transition-colors ${
                  !n.is_read ? 'bg-muted/40' : ''
                }`}
              >
                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!n.is_read ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm truncate">{n.title}</div>
                    <div className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
                      {new Date(n.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5 whitespace-pre-line">
                    {n.message}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {n.type && (
                      <Badge variant="outline" className="text-[10px]">
                        {n.type === 'transaction' ? '订单进度' : isReceipt(n) ? '收据 / 邮件' : n.type}
                      </Badge>
                    )}
                    {n.action_url && (
                      <Link to={n.action_url} onClick={() => !n.is_read && markAsRead(n.id)}>
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                          查看详情 →
                        </Button>
                      </Link>
                    )}
                    {!n.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto py-0.5 px-1.5 text-xs"
                        onClick={() => markAsRead(n.id)}
                      >
                        标记已读
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
