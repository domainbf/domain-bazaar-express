import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/apiClient';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, RefreshCw, Bell, Users, User, CheckCircle2, AlertCircle } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string;
}

interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  type: string;
  user_id: string;
  is_read: boolean;
  created_at: string;
  user_name?: string;
}

const NOTIFICATION_TYPES = [
  { value: 'system', label: '系统通知', description: '平台系统消息' },
  { value: 'promotion', label: '活动通知', description: '优惠活动推广' },
  { value: 'security', label: '安全提醒', description: '账户安全相关' },
  { value: 'update', label: '更新公告', description: '功能更新说明' },
  { value: 'warning', label: '警告通知', description: '违规警告提示' },
];

export const AdminNotificationSender = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [recentNotifs, setRecentNotifs] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'system',
    sendToAll: true,
    selectedUserId: '',
    actionUrl: '',
  });

  const [stats, setStats] = useState({ total: 0, unread: 0, users: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, notifsRes] = await Promise.allSettled([
        supabase.from('profiles').select('id, full_name, username').limit(200),
        supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      if (usersRes.status === 'fulfilled' && usersRes.value.data) {
        const u = usersRes.value.data.map((p: any) => ({
          id: p.id,
          full_name: p.full_name,
          username: p.username,
          email: p.username || p.id.slice(0, 8),
        }));
        setUsers(u);
        setStats(prev => ({ ...prev, users: u.length }));
      }

      if (notifsRes.status === 'fulfilled' && notifsRes.value.data) {
        const ns = notifsRes.value.data as NotificationRecord[];
        setRecentNotifs(ns);
        setStats(prev => ({
          ...prev,
          total: ns.length,
          unread: ns.filter(n => !n.is_read).length,
        }));
      }
    } catch (error: any) {
      toast.error('加载数据失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('请填写通知标题和内容');
      return;
    }
    if (!form.sendToAll && !form.selectedUserId) {
      toast.error('请选择接收用户');
      return;
    }

    setIsSending(true);
    try {
      const targetUserIds = form.sendToAll
        ? users.map(u => u.id)
        : [form.selectedUserId];

      if (targetUserIds.length === 0) {
        toast.error('没有可发送的用户');
        return;
      }

      const rows = targetUserIds.map(user_id => ({
        user_id,
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        is_read: false,
        action_url: form.actionUrl.trim() || null,
      }));

      const BATCH_SIZE = 50;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('notifications').insert(batch as any);
        if (error) throw error;
      }

      toast.success(
        form.sendToAll
          ? `已向 ${targetUserIds.length} 位用户发送通知`
          : '通知已发送'
      );

      setForm(prev => ({ ...prev, title: '', message: '', actionUrl: '' }));
      loadData();
    } catch (error: any) {
      toast.error('发送失败: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteNotif = async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      setRecentNotifs(prev => prev.filter(n => n.id !== id));
      toast.success('通知已删除');
    } catch (error: any) {
      toast.error('删除失败: ' + error.message);
    }
  };

  const formatTime = (t: string) => {
    return new Date(t).toLocaleString('zh-CN', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getTypeLabel = (type: string) =>
    NOTIFICATION_TYPES.find(t => t.value === type)?.label || type;

  const getTypeBadgeVariant = (type: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      system: 'default',
      promotion: 'secondary',
      security: 'destructive',
      update: 'outline',
      warning: 'destructive',
    };
    return map[type] || 'outline';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">系统通知</h2>
          <p className="text-muted-foreground">向用户发送系统通知，通知即时推送到用户消息中心</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.users}</p>
                <p className="text-xs text-muted-foreground">注册用户</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">近期通知</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.unread}</p>
                <p className="text-xs text-muted-foreground">未读通知</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              发送通知
            </CardTitle>
            <CardDescription>填写通知内容并选择发送对象</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>通知标题 *</Label>
              <Input
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="例：平台维护通知"
                data-testid="input-notif-title"
              />
            </div>

            <div className="space-y-2">
              <Label>通知内容 *</Label>
              <Textarea
                value={form.message}
                onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="请输入通知的详细内容..."
                className="min-h-[100px]"
                data-testid="textarea-notif-message"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>通知类型</Label>
                <Select
                  value={form.type}
                  onValueChange={v => setForm(prev => ({ ...prev, type: v }))}
                >
                  <SelectTrigger data-testid="select-notif-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>跳转链接（选填）</Label>
                <Input
                  value={form.actionUrl}
                  onChange={e => setForm(prev => ({ ...prev, actionUrl: e.target.value }))}
                  placeholder="/domains"
                  data-testid="input-notif-url"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>发送对象</Label>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm flex-1">
                  {form.sendToAll ? '全部用户' : '指定用户'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">指定用户</span>
                  <Switch
                    checked={form.sendToAll}
                    onCheckedChange={v => setForm(prev => ({ ...prev, sendToAll: v }))}
                    data-testid="switch-notif-all"
                  />
                  <span className="text-xs text-muted-foreground">全部用户</span>
                </div>
              </div>

              {form.sendToAll ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 dark:bg-blue-950/20 border border-blue-500/30 dark:border-blue-900">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    将向全部 <strong>{users.length}</strong> 位注册用户发送通知
                  </span>
                </div>
              ) : (
                <Select
                  value={form.selectedUserId}
                  onValueChange={v => setForm(prev => ({ ...prev, selectedUserId: v }))}
                >
                  <SelectTrigger data-testid="select-notif-user">
                    <SelectValue placeholder="选择用户..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name || u.username || u.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Button
              onClick={handleSend}
              disabled={isSending || isLoading}
              className="w-full"
              data-testid="btn-send-notification"
            >
              {isSending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  发送中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {form.sendToAll ? `向全部 ${users.length} 位用户发送` : '发送通知'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              近期发出的通知
            </CardTitle>
            <CardDescription>最近 50 条通知记录</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : recentNotifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                <Bell className="h-8 w-8 opacity-30" />
                <p className="text-sm">暂无通知记录</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {recentNotifs.map(n => (
                    <div key={n.id} className="px-4 py-3 hover:bg-muted/30 group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{n.title}</span>
                            <Badge variant={getTypeBadgeVariant(n.type)} className="h-4 text-xs px-1">
                              {getTypeLabel(n.type)}
                            </Badge>
                            {n.is_read ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-amber-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.message}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatTime(n.created_at)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                          onClick={() => handleDeleteNotif(n.id)}
                        >
                          <span className="text-destructive text-xs">×</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
