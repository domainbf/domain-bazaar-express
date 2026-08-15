import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Loader2, RefreshCw } from 'lucide-react';

interface ActivityRow {
  id: string;
  activity_type: string;
  resource_id: string | null;
  metadata: any;
  created_at: string;
}

const PAGE_SIZE = 20;

const TYPE_LABELS: Record<string, string> = {
  login: '登录',
  logout: '退出登录',
  view_domain: '浏览域名',
  favorite: '收藏域名',
  unfavorite: '取消收藏',
  offer_created: '提交报价',
  offer_withdrawn: '撤回报价',
  domain_created: '发布域名',
  domain_updated: '更新域名',
  domain_deleted: '删除域名',
  profile_updated: '更新资料',
  transaction_created: '创建订单',
};

const label = (t: string) => TYPE_LABELS[t] || t;

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  return d.toLocaleString('zh-CN');
};

export const ActivityLogPanel = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [type, setType] = useState('all');

  const fetchPage = useCallback(async (page: number, replace: boolean) => {
    if (!user) return;
    const from = page * PAGE_SIZE;
    let q = (supabase as any)
      .from('user_activities')
      .select('id, activity_type, resource_id, metadata, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (type !== 'all') q = q.eq('activity_type', type);
    const { data, error } = await q;
    if (error) {
      setHasMore(false);
      return;
    }
    const list = (data ?? []) as ActivityRow[];
    setHasMore(list.length === PAGE_SIZE);
    setRows(prev => (replace ? list : [...prev, ...list]));
  }, [user, type]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    fetchPage(0, true).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user, fetchPage]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`user-activities-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_activities', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as ActivityRow;
          setRows(prev => (prev.some(r => r.id === row.id) ? prev : [row, ...prev]));
        }
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user]);

  const loadMore = async () => {
    setLoadingMore(true);
    await fetchPage(Math.ceil(rows.length / PAGE_SIZE), false);
    setLoadingMore(false);
  };

  const types = Array.from(new Set(rows.map(r => r.activity_type)));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />活动记录
          <div className="ml-auto flex items-center gap-2">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {types.map(t => <SelectItem key={t} value={t}>{label(t)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fetchPage(0, true)} aria-label="刷新活动记录">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardTitle>
        <p className="text-xs text-muted-foreground">记录你在平台上的关键操作，实时更新。</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">暂无活动记录</div>
        ) : (
          <>
            <ol className="relative space-y-3 pl-4 border-l border-border">
              {rows.map((r) => (
                <li key={r.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{label(r.activity_type)}</p>
                      {r.metadata && Object.keys(r.metadata).length > 0 && (
                        <p className="text-xs text-muted-foreground break-all line-clamp-2">
                          {Object.entries(r.metadata).slice(0, 3).map(([k, v]) => `${k}: ${String(v)}`).join(' · ')}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[11px] font-normal">
                      {formatTime(r.created_at)}
                    </Badge>
                  </div>
                </li>
              ))}
            </ol>
            {hasMore && (
              <div className="pt-4 text-center">
                <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}加载更多
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityLogPanel;
