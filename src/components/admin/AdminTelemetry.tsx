import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Activity, Download, RefreshCw, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getRouteTelemetry, clearRouteTelemetry, type RouteTelemetryEvent } from '@/lib/routeTelemetry';
import { toast } from 'sonner';

const EVENT_LABELS: Record<RouteTelemetryEvent['type'], string> = {
  nav_click: '导航点击',
  detail_fetch_ok: '详情加载成功',
  detail_fetch_error: '详情加载失败',
  chunk_load_error: '资源块加载失败',
  route_error: '页面错误',
};

const csvEscape = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const download = (name: string, csv: string) => {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const AdminTelemetry = () => {
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState('');
  const events = useMemo(() => getRouteTelemetry().slice().reverse(), [tick]);

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 4000);
    return () => clearInterval(iv);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter(e =>
      (e.domain || '').toLowerCase().includes(q) ||
      (e.route || '').toLowerCase().includes(q) ||
      (e.reason || '').toLowerCase().includes(q) ||
      e.type.includes(q),
    );
  }, [events, query]);

  const byDomain = useMemo(() => {
    const map = new Map<string, { total: number; ok: number; error: number; avgMs: number; lastReason?: string }>();
    for (const e of filtered) {
      const key = e.domain || '(无域名)';
      const row = map.get(key) || { total: 0, ok: 0, error: 0, avgMs: 0 };
      row.total += 1;
      if (e.type === 'detail_fetch_ok') row.ok += 1;
      if (e.type.endsWith('_error')) { row.error += 1; row.lastReason = e.reason || row.lastReason; }
      if (typeof e.durationMs === 'number') row.avgMs = ((row.avgMs * (row.total - 1)) + e.durationMs) / row.total;
      map.set(key, row);
    }
    return Array.from(map.entries())
      .map(([domain, v]) => ({ domain, ...v }))
      .sort((a, b) => b.error - a.error || b.total - a.total);
  }, [filtered]);

  const byType = useMemo(() => {
    const m = new Map<RouteTelemetryEvent['type'], number>();
    for (const e of filtered) m.set(e.type, (m.get(e.type) || 0) + 1);
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const exportCsv = () => {
    const header = ['时间', '类型', '域名', '路由', '耗时(ms)', '原因'];
    const rows = filtered.map(e => [
      new Date(e.ts).toISOString(),
      EVENT_LABELS[e.type] || e.type,
      e.domain || '',
      e.route || '',
      e.durationMs ?? '',
      e.reason || '',
    ]);
    const csv = [header, ...rows].map(r => r.map(csvEscape).join(',')).join('\n');
    download(`route-telemetry-${Date.now()}.csv`, csv);
    toast.success(`已导出 ${rows.length} 条事件`);
  };

  const exportByDomain = () => {
    const header = ['域名', '总事件', '成功', '失败', '平均耗时(ms)', '最近失败原因'];
    const rows = byDomain.map(r => [r.domain, r.total, r.ok, r.error, Math.round(r.avgMs), r.lastReason || '']);
    const csv = [header, ...rows].map(r => r.map(csvEscape).join(',')).join('\n');
    download(`route-telemetry-by-domain-${Date.now()}.csv`, csv);
    toast.success(`已按域名导出 ${rows.length} 行`);
  };

  const clearAll = () => {
    if (!confirm('确认清空本地遥测事件？该操作不可撤销。')) return;
    clearRouteTelemetry();
    setTick(t => t + 1);
    toast.success('已清空');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5" />
            路由遥测
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            浏览器端记录的 nav_click / detail_fetch / route_error 事件，按域名与接口聚合定位问题。
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setTick(t => t + 1)}>
            <RefreshCw className="w-4 h-4 mr-1" />刷新
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-1" />导出全部
          </Button>
          <Button variant="outline" size="sm" onClick={exportByDomain}>
            <Download className="w-4 h-4 mr-1" />按域名导出
          </Button>
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-1" />清空
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {byType.map(([type, count]) => {
          const isErr = type.endsWith('_error');
          return (
            <Card key={type}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  {isErr ? <AlertTriangle className="w-3.5 h-3.5 text-destructive" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  {EVENT_LABELS[type]}
                </div>
                <div className={`text-2xl font-bold ${isErr ? 'text-destructive' : 'text-foreground'}`}>{count}</div>
              </CardContent>
            </Card>
          );
        })}
        {byType.length === 0 && (
          <Card className="col-span-full"><CardContent className="p-6 text-center text-sm text-muted-foreground">暂无遥测事件</CardContent></Card>
        )}
      </div>

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="按域名 / 路由 / 原因 / 事件类型 搜索…"
      />

      <Tabs defaultValue="by-domain">
        <TabsList>
          <TabsTrigger value="by-domain">按域名聚合</TabsTrigger>
          <TabsTrigger value="raw">原始事件流 ({filtered.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="by-domain" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">按域名 · 错误率排行</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>域名</TableHead>
                    <TableHead className="text-right">总事件</TableHead>
                    <TableHead className="text-right">成功</TableHead>
                    <TableHead className="text-right">失败</TableHead>
                    <TableHead className="text-right">平均耗时</TableHead>
                    <TableHead>最近失败原因</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byDomain.slice(0, 100).map(r => (
                    <TableRow key={r.domain}>
                      <TableCell className="font-mono text-xs break-all">{r.domain}</TableCell>
                      <TableCell className="text-right">{r.total}</TableCell>
                      <TableCell className="text-right text-emerald-600">{r.ok}</TableCell>
                      <TableCell className="text-right">
                        {r.error > 0 ? <Badge variant="destructive">{r.error}</Badge> : <span className="text-muted-foreground">0</span>}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{r.avgMs ? Math.round(r.avgMs) + 'ms' : '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={r.lastReason}>{r.lastReason || '—'}</TableCell>
                    </TableRow>
                  ))}
                  {byDomain.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">暂无数据</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="raw" className="mt-4">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>域名</TableHead>
                    <TableHead>路由</TableHead>
                    <TableHead className="text-right">耗时</TableHead>
                    <TableHead>原因</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 300).map((e, i) => (
                    <TableRow key={i} className={e.type.endsWith('_error') ? 'bg-destructive/5' : ''}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(e.ts).toLocaleString()}</TableCell>
                      <TableCell><Badge variant={e.type.endsWith('_error') ? 'destructive' : 'secondary'}>{EVENT_LABELS[e.type]}</Badge></TableCell>
                      <TableCell className="font-mono text-xs break-all">{e.domain || '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{e.route || '—'}</TableCell>
                      <TableCell className="text-right text-xs">{e.durationMs != null ? `${e.durationMs}ms` : '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-sm truncate" title={e.reason}>{e.reason || '—'}</TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">暂无匹配事件</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTelemetry;
