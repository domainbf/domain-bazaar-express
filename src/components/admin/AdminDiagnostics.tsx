import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Database, Server, Trash2, Activity } from 'lucide-react';
import { subscribeHealth, clearApiRecords, getHealthState, type ApiRequestRecord } from '@/lib/apiHealth';
import { runBackendHealthCheck, apiGet } from '@/lib/apiClient';
import { toast } from 'sonner';

export const AdminDiagnostics = () => {
  const [state, setState] = useState(getHealthState());
  const [isChecking, setIsChecking] = useState(false);
  const [isProbing, setIsProbing] = useState(false);

  useEffect(() => subscribeHealth(setState), []);

  const recheck = async () => {
    setIsChecking(true);
    try { await runBackendHealthCheck(); } finally { setIsChecking(false); }
  };

  const probe = async () => {
    setIsProbing(true);
    try {
      const data = await apiGet<Record<string, string>>('/data/site-settings');
      toast.success(`读取成功：${Object.keys(data || {}).length} 项站点设置`);
    } catch (e: any) {
      toast.error('读取失败：' + (e?.message || '未知错误'));
    } finally {
      setIsProbing(false);
    }
  };

  const usingSupabase = state.mode !== 'express';
  const last: ApiRequestRecord | undefined = state.records[0];

  return (
    <div className="space-y-6" data-testid="admin-diagnostics">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            后端诊断
          </CardTitle>
          <CardDescription>显示当前管理请求实际走的通道，以及最近一次请求的状态码与响应摘要</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="outline"
              className={usingSupabase ? 'text-success border-success/40' : 'text-info border-info/40'}
              data-testid="badge-backend-mode"
            >
              {usingSupabase ? <Database className="w-3 h-3 mr-1" /> : <Server className="w-3 h-3 mr-1" />}
              当前通道：{usingSupabase ? 'Supabase 直连' : '旧接口 /api/data'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              /api/data 探测：{state.expressAvailable === null ? '未检测' : state.expressAvailable ? '可用' : `不可用（${state.checkError ?? '未知'}）`}
            </span>
            <span className="text-xs text-muted-foreground">
              最近检测：{state.lastCheckAt ? new Date(state.lastCheckAt).toLocaleString() : '—'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={recheck} disabled={isChecking} data-testid="button-recheck-backend">
              <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              重新检测
            </Button>
            <Button size="sm" variant="outline" onClick={probe} disabled={isProbing} data-testid="button-probe-settings">
              测试读取站点设置
            </Button>
            <Button size="sm" variant="ghost" onClick={clearApiRecords}>
              <Trash2 className="w-4 h-4 mr-2" />清空记录
            </Button>
          </div>

          <div className="rounded-lg border p-4 text-sm" data-testid="last-request-summary">
            <p className="font-medium mb-2">最近一次管理请求</p>
            {last ? (
              <div className="space-y-1 text-muted-foreground">
                <div><span className="text-foreground font-mono">{last.method} {last.path}</span></div>
                <div>通道：{last.backend === 'supabase' ? 'Supabase' : '/api/data'} · 状态码：
                  <span className={last.ok ? 'text-success' : 'text-destructive'}> {last.status}</span> · 重试 {last.attempts} 次 · {last.durationMs}ms
                </div>
                <div className="break-all font-mono text-xs">{last.summary || '(空响应)'}</div>
              </div>
            ) : (
              <p className="text-muted-foreground">暂无记录，执行一次管理操作后即可看到。</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">最近请求记录</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[360px] pr-3">
            <div className="space-y-2">
              {state.records.length === 0 && (
                <p className="text-sm text-muted-foreground">暂无记录</p>
              )}
              {state.records.map(r => (
                <div key={r.id} className="rounded-md border p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono">{r.method} {r.path}</span>
                    <Badge variant={r.ok ? 'outline' : 'destructive'}>{r.status}</Badge>
                  </div>
                  <div className="text-muted-foreground">
                    {r.backend === 'supabase' ? 'Supabase' : '/api/data'} · {new Date(r.at).toLocaleTimeString()} · {r.durationMs}ms · 重试 {r.attempts} 次
                  </div>
                  <div className="text-muted-foreground break-all font-mono">{r.summary}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
