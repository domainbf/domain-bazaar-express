import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { RefreshCw, Wand2, Image as ImageIcon, AlertTriangle, CheckCircle2, Database, Loader2, Search } from 'lucide-react';

interface DomainRow {
  id: string;
  name: string;
  is_hot?: boolean;
  is_auction?: boolean;
  logoUrl?: string | null;
}

interface LogRow {
  id: string;
  domain_name: string;
  status: string;
  provider: string | null;
  error_message: string | null;
  duration_ms: number | null;
  cache_hit: boolean;
  fallback_used: boolean;
  triggered_by: string | null;
  logo_url: string | null;
  created_at: string;
}

export function AdminLogoManagement() {
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const loadDomains = useCallback(async () => {
    setLoading(true);
    try {
      // 拉热门 + 拍卖 + 搜索结果
      const { data: hot } = await supabase
        .from('domains')
        .select('id,name,is_hot,is_auction')
        .or('is_hot.eq.true,is_auction.eq.true')
        .limit(200);
      let rows: DomainRow[] = hot ?? [];

      if (search.trim()) {
        const { data: matched } = await supabase
          .from('domains')
          .select('id,name,is_hot,is_auction')
          .ilike('name', `%${search.trim()}%`)
          .limit(100);
        const seen = new Set(rows.map(r => r.id));
        (matched ?? []).forEach(m => { if (!seen.has(m.id)) rows.push(m); });
      }

      // 拉这些域名的现有 Logo
      const keys = rows.map(r => `domain_logo_${r.id}`);
      if (keys.length) {
        const { data: settings } = await supabase
          .from('site_settings')
          .select('key,value')
          .in('key', keys);
        const map = new Map((settings ?? []).map(s => [s.key, s.value as string]));
        rows = rows.map(r => ({ ...r, logoUrl: map.get(`domain_logo_${r.id}`) || null }));
      }
      setDomains(rows);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const { data } = await supabase
        .from('domain_logo_generation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      setLogs((data as LogRow[]) ?? []);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => { loadDomains(); loadLogs(); }, [loadDomains, loadLogs]);

  const regenerate = async (d: DomainRow, force = true) => {
    setBusyIds(prev => new Set(prev).add(d.id));
    try {
      const { data, error } = await supabase.functions.invoke('generate-domain-logo', {
        body: { domainId: d.id, domainName: d.name, force, triggeredBy: 'admin' },
      });
      if (error || (data as any)?.error) throw new Error(error?.message || (data as any)?.error);
      const res = data as any;
      if (res?.fallbackUsed) toast.warning(`${d.name} 已生成降级 Logo（首字母）`);
      else toast.success(`${d.name} Logo ${res?.cacheHit ? '已存在' : '生成成功'}`);
      await Promise.all([loadDomains(), loadLogs()]);
    } catch (e: any) {
      toast.error(`${d.name} 生成失败：${e.message}`);
    } finally {
      setBusyIds(prev => { const s = new Set(prev); s.delete(d.id); return s; });
    }
  };

  const batchRefreshHot = async () => {
    const targets = domains.filter(d => d.is_hot || d.is_auction);
    if (!targets.length) { toast.info('没有热门/拍卖域名'); return; }
    if (!confirm(`将强制重刷 ${targets.length} 个热门/拍卖域名的 Logo，可能消耗免费额度，继续？`)) return;
    setBatchRunning(true);
    setBatchProgress({ done: 0, total: targets.length, current: '' });
    let ok = 0, fb = 0, fail = 0;
    for (let i = 0; i < targets.length; i++) {
      const d = targets[i];
      setBatchProgress({ done: i, total: targets.length, current: d.name });
      try {
        const { data, error } = await supabase.functions.invoke('generate-domain-logo', {
          body: { domainId: d.id, domainName: d.name, force: true, triggeredBy: 'admin-batch' },
        });
        if (error || (data as any)?.error) { fail++; }
        else if ((data as any)?.fallbackUsed) { fb++; }
        else { ok++; }
      } catch { fail++; }
      await new Promise(r => setTimeout(r, 1500));
    }
    setBatchProgress({ done: targets.length, total: targets.length, current: '完成' });
    setBatchRunning(false);
    toast.success(`批量完成：成功 ${ok} · 降级 ${fb} · 失败 ${fail}`);
    await Promise.all([loadDomains(), loadLogs()]);
  };

  const statusBadge = (s: string, fb: boolean) => {
    if (s === 'success') return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30" variant="outline">成功</Badge>;
    if (s === 'fallback' || fb) return <Badge variant="outline" className="border-amber-500/40 text-amber-600">降级</Badge>;
    if (s === 'cache_hit') return <Badge variant="outline">缓存命中</Badge>;
    return <Badge variant="destructive">失败</Badge>;
  };

  const filtered = domains.filter(d =>
    !search.trim() || d.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2 flex-wrap space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-4 w-4" /> Logo 生成管理
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              手动重刷单个域名或批量刷新所有热门/拍卖域名。已有 Logo 会被缓存复用，强制重生成会跳过缓存。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { loadDomains(); loadLogs(); }} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" onClick={batchRefreshHot} disabled={batchRunning}>
              {batchRunning ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Wand2 className="h-4 w-4 mr-1" />}
              批量重刷热门
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索域名…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs h-9"
            />
            <span className="text-xs text-muted-foreground ml-auto">共 {filtered.length} 条</span>
          </div>

          {batchProgress && (
            <div className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between mb-2">
                <span>批量进度：{batchProgress.done}/{batchProgress.total}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[60%]">{batchProgress.current}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-foreground transition-all"
                  style={{ width: `${Math.round((batchProgress.done / batchProgress.total) * 100)}%` }} />
              </div>
            </div>
          )}

          <ScrollArea className="h-[380px] rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-16">Logo</TableHead>
                  <TableHead>域名</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>
                      {d.logoUrl ? (
                        <img src={d.logoUrl} alt="" className="w-9 h-9 rounded border object-cover bg-white" />
                      ) : (
                        <div className="w-9 h-9 rounded border flex items-center justify-center text-muted-foreground bg-muted/30">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{d.name}</TableCell>
                    <TableCell className="text-xs space-x-1">
                      {d.is_auction && <Badge variant="outline">拍卖</Badge>}
                      {d.is_hot && <Badge variant="outline">热门</Badge>}
                    </TableCell>
                    <TableCell className="text-xs">
                      {d.logoUrl ? <span className="text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />已生成</span>
                        : <span className="text-muted-foreground inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" />未生成</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={d.logoUrl ? 'outline' : 'default'}
                        disabled={busyIds.has(d.id)}
                        onClick={() => regenerate(d, !!d.logoUrl)}
                      >
                        {busyIds.has(d.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : d.logoUrl ? '重生成' : '生成'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!filtered.length && (
                  <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">暂无数据</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" /> 生成日志（最近 100 条）
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={loadLogs} disabled={logsLoading}>
            <RefreshCw className={`h-4 w-4 ${logsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[380px] rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>时间</TableHead>
                  <TableHead>域名</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>耗时</TableHead>
                  <TableHead>来源</TableHead>
                  <TableHead>错误</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs whitespace-nowrap">{new Date(l.created_at).toLocaleString('zh-CN')}</TableCell>
                    <TableCell className="font-mono text-xs">{l.domain_name}</TableCell>
                    <TableCell>{statusBadge(l.status, l.fallback_used)}</TableCell>
                    <TableCell className="text-xs">{l.provider || '-'}</TableCell>
                    <TableCell className="text-xs tabular-nums">{l.duration_ms ? `${l.duration_ms}ms` : '-'}</TableCell>
                    <TableCell className="text-xs">{l.triggered_by || '-'}</TableCell>
                    <TableCell className="text-xs text-destructive max-w-[240px] truncate" title={l.error_message || ''}>
                      {l.error_message || '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {!logs.length && (
                  <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                    {logsLoading ? '加载中…' : '暂无日志'}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
