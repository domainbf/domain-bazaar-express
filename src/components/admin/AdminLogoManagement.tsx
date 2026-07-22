import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  RefreshCw, Wand2, Image as ImageIcon, AlertTriangle, CheckCircle2,
  Database, Loader2, Search, Settings2, Eye,
} from 'lucide-react';
import { DomainWordmark } from '@/components/sections/DomainWordmark';
import { defaultBadgeConfig, type LogoBadgeConfig } from '@/hooks/useLogoBadgeConfig';

interface DomainRow {
  id: string;
  name: string;
  is_hot?: boolean;
  is_auction?: boolean;
  logoUrl?: string | null;
  lastStatus?: string | null; // 最近一次日志状态
}

interface LogRow {
  id: string;
  domain_id: string | null;
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

type FilterMode = 'all' | 'missing' | 'generated' | 'failed';

const BADGE_KEYS = {
  enabled: 'logo_badge_enabled',
  grayscale: 'logo_badge_grayscale',
  opacity: 'logo_badge_opacity',
  overlay: 'logo_badge_overlay',
  version: 'logo_badge_version',
};

export function AdminLogoManagement() {
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [lastBatchStats, setLastBatchStats] = useState<{ ok: number; fb: number; fail: number; ms: number; total: number } | null>(null);

  // 徽章显示配置
  const [badge, setBadge] = useState<LogoBadgeConfig>(defaultBadgeConfig);
  const [badgeSaving, setBadgeSaving] = useState(false);

  const loadBadgeConfig = useCallback(async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('key,value')
      .in('key', Object.values(BADGE_KEYS));
    const raw: Record<string, string> = {};
    (data ?? []).forEach((r: any) => { if (r?.value != null) raw[r.key] = String(r.value); });
    setBadge({
      enabled: raw[BADGE_KEYS.enabled] === 'true',
      grayscale: Number(raw[BADGE_KEYS.grayscale] ?? defaultBadgeConfig.grayscale),
      opacity: Number(raw[BADGE_KEYS.opacity] ?? defaultBadgeConfig.opacity),
      overlay: Number(raw[BADGE_KEYS.overlay] ?? defaultBadgeConfig.overlay),
      version: Number(raw[BADGE_KEYS.version] ?? 0),
    });
  }, []);

  const saveBadge = async (next: Partial<LogoBadgeConfig>, opts: { bumpVersion?: boolean } = {}) => {
    const merged: LogoBadgeConfig = { ...badge, ...next };
    if (opts.bumpVersion) merged.version = Date.now();
    setBadge(merged);
    setBadgeSaving(true);
    try {
      const rows = [
        { key: BADGE_KEYS.enabled, value: String(merged.enabled), section: 'logos', type: 'text' },
        { key: BADGE_KEYS.grayscale, value: String(merged.grayscale), section: 'logos', type: 'text' },
        { key: BADGE_KEYS.opacity, value: String(merged.opacity), section: 'logos', type: 'text' },
        { key: BADGE_KEYS.overlay, value: String(merged.overlay), section: 'logos', type: 'text' },
        { key: BADGE_KEYS.version, value: String(merged.version), section: 'logos', type: 'text' },
      ];
      const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
      if (error) throw error;
    } catch (e: any) {
      toast.error(`保存失败：${e.message}`);
    } finally {
      setBadgeSaving(false);
    }
  };

  const loadDomains = useCallback(async () => {
    setLoading(true);
    try {
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

      const keys = rows.map(r => `domain_logo_${r.id}`);
      if (keys.length) {
        const [{ data: settings }, { data: latestLogs }] = await Promise.all([
          supabase.from('site_settings').select('key,value').in('key', keys),
          supabase.from('domain_logo_generation_logs')
            .select('domain_id,status,created_at')
            .in('domain_id', rows.map(r => r.id))
            .order('created_at', { ascending: false })
            .limit(500),
        ]);
        const logoMap = new Map((settings ?? []).map((s: any) => [s.key, s.value as string]));
        const statusMap = new Map<string, string>();
        (latestLogs ?? []).forEach((l: any) => {
          if (l.domain_id && !statusMap.has(l.domain_id)) statusMap.set(l.domain_id, l.status);
        });
        rows = rows.map(r => ({
          ...r,
          logoUrl: logoMap.get(`domain_logo_${r.id}`) || null,
          lastStatus: statusMap.get(r.id) || null,
        }));
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

  useEffect(() => {
    loadDomains();
    loadLogs();
    loadBadgeConfig();
  }, [loadDomains, loadLogs, loadBadgeConfig]);

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
      // 单个生成后自动 bump version，确保前端下次加载拿到新图
      await saveBadge({}, { bumpVersion: true });
      await Promise.all([loadDomains(), loadLogs()]);
    } catch (e: any) {
      toast.error(`${d.name} 生成失败：${e.message}`);
    } finally {
      setBusyIds(prev => { const s = new Set(prev); s.delete(d.id); return s; });
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return domains.filter(d => {
      if (q && !d.name.toLowerCase().includes(q)) return false;
      if (filterMode === 'missing') return !d.logoUrl;
      if (filterMode === 'generated') return !!d.logoUrl;
      if (filterMode === 'failed') return d.lastStatus === 'failed';
      return true;
    });
  }, [domains, search, filterMode]);

  const runBatch = async (targets: DomainRow[], label: string) => {
    if (!targets.length) { toast.info('没有可刷新的域名'); return; }
    if (!confirm(`将强制重刷 ${targets.length} 个域名（${label}），可能消耗免费额度，继续？`)) return;
    setBatchRunning(true);
    setBatchProgress({ done: 0, total: targets.length, current: '' });
    const startedAt = Date.now();
    let ok = 0, fb = 0, fail = 0;
    for (let i = 0; i < targets.length; i++) {
      const d = targets[i];
      setBatchProgress({ done: i, total: targets.length, current: d.name });
      try {
        const { data, error } = await supabase.functions.invoke('generate-domain-logo', {
          body: { domainId: d.id, domainName: d.name, force: true, triggeredBy: 'admin-batch' },
        });
        if (error || (data as any)?.error) fail++;
        else if ((data as any)?.fallbackUsed) fb++;
        else ok++;
      } catch { fail++; }
      await new Promise(r => setTimeout(r, 1500));
    }
    const ms = Date.now() - startedAt;
    setBatchProgress({ done: targets.length, total: targets.length, current: '完成' });
    setBatchRunning(false);
    setLastBatchStats({ ok, fb, fail, ms, total: targets.length });
    // 批量结束后 bump version 让前端立即刷新
    await saveBadge({}, { bumpVersion: true });
    toast.success(`批量完成（${label}）：成功 ${ok} · 降级 ${fb} · 失败 ${fail} · 耗时 ${(ms / 1000).toFixed(1)}s`);
    await Promise.all([loadDomains(), loadLogs()]);
  };

  const batchTargets: Record<'hot' | 'missing' | 'failed' | 'filtered', DomainRow[]> = {
    hot: domains.filter(d => d.is_hot || d.is_auction),
    missing: domains.filter(d => !d.logoUrl),
    failed: domains.filter(d => d.lastStatus === 'failed'),
    filtered,
  };

  const statusBadge = (s: string, fb: boolean) => {
    if (s === 'success') return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30" variant="outline">成功</Badge>;
    if (s === 'fallback' || fb) return <Badge variant="outline" className="border-amber-500/40 text-amber-600">降级</Badge>;
    if (s === 'cache_hit') return <Badge variant="outline">缓存命中</Badge>;
    return <Badge variant="destructive">失败</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* 徽章显示配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4" /> 首页徽章显示
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            控制首页拍卖/热门滚动带上是否叠加 Logo 图像及其克制程度。关闭后仅显示纯排印徽章。
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-0.5">
              <Label>启用 Logo 徽章</Label>
              <p className="text-xs text-muted-foreground">开启后拍卖/热门卡片会叠加已生成的 Logo 图像</p>
            </div>
            <div className="flex items-center gap-2">
              {badgeSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              <Switch checked={badge.enabled} onCheckedChange={(v) => saveBadge({ enabled: v })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <Label>灰度</Label><span className="tabular-nums text-muted-foreground">{badge.grayscale}%</span>
              </div>
              <Slider value={[badge.grayscale]} min={0} max={100} step={5}
                onValueChange={([v]) => setBadge({ ...badge, grayscale: v })}
                onValueCommit={([v]) => saveBadge({ grayscale: v })}
                disabled={!badge.enabled} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <Label>透明度</Label><span className="tabular-nums text-muted-foreground">{badge.opacity}%</span>
              </div>
              <Slider value={[badge.opacity]} min={0} max={100} step={5}
                onValueChange={([v]) => setBadge({ ...badge, opacity: v })}
                onValueCommit={([v]) => saveBadge({ opacity: v })}
                disabled={!badge.enabled} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <Label>遮罩强度</Label><span className="tabular-nums text-muted-foreground">{badge.overlay}%</span>
              </div>
              <Slider value={[badge.overlay]} min={0} max={100} step={5}
                onValueChange={([v]) => setBadge({ ...badge, overlay: v })}
                onValueCommit={([v]) => saveBadge({ overlay: v })}
                disabled={!badge.enabled} />
            </div>
          </div>

          {/* 预览 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" /> 预览（使用第一个已生成 Logo 的域名）
            </div>
            <div className="flex gap-3">
              {(domains.filter(d => d.logoUrl).slice(0, 3)).map(d => {
                const showLogo = badge.enabled && !!d.logoUrl;
                const src = showLogo && d.logoUrl
                  ? `${d.logoUrl}${d.logoUrl.includes('?') ? '&' : '?'}v=${badge.version || 'preview'}`
                  : undefined;
                return (
                  <div key={d.id} className="relative w-[132px] h-[62px] rounded-lg border overflow-hidden bg-card">
                    {src && (
                      <>
                        <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover"
                          style={{ filter: `grayscale(${badge.grayscale}%)`, opacity: badge.opacity / 100 }} />
                        <div className="absolute inset-0"
                          style={{ background: `linear-gradient(to top, hsl(var(--background) / ${badge.overlay / 100}) 0%, transparent 100%)` }} />
                      </>
                    )}
                    <div className={`relative z-10 h-full flex items-center justify-center px-2 ${src ? 'items-end pb-1' : ''}`}>
                      <DomainWordmark name={d.name} className="max-w-[124px]" />
                    </div>
                  </div>
                );
              })}
              {!domains.some(d => d.logoUrl) && (
                <div className="text-xs text-muted-foreground py-4">暂无已生成 Logo，先在下方生成再预览</div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t">
            <span className="text-xs text-muted-foreground">
              缓存版本：<span className="font-mono">{badge.version || '—'}</span>
            </span>
            <Button size="sm" variant="outline" onClick={() => saveBadge({}, { bumpVersion: true })}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> 强制刷新前端缓存
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 域名列表 + 批量操作 */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2 flex-wrap space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-4 w-4" /> Logo 生成管理
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              支持按缺失/失败/已生成筛选批量刷新。强制重生成会跳过缓存并 bump 前端版本。
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => { loadDomains(); loadLogs(); }} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" variant="outline" onClick={() => runBatch(batchTargets.missing, '缺失')} disabled={batchRunning}>
              仅缺失 ({batchTargets.missing.length})
            </Button>
            <Button size="sm" variant="outline" onClick={() => runBatch(batchTargets.failed, '失败')} disabled={batchRunning}>
              重试失败 ({batchTargets.failed.length})
            </Button>
            <Button size="sm" variant="outline" onClick={() => runBatch(batchTargets.filtered, '当前筛选')} disabled={batchRunning || !filtered.length}>
              当前筛选 ({filtered.length})
            </Button>
            <Button size="sm" onClick={() => runBatch(batchTargets.hot, '热门/拍卖')} disabled={batchRunning}>
              {batchRunning ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Wand2 className="h-4 w-4 mr-1" />}
              热门/拍卖 ({batchTargets.hot.length})
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="搜索域名…" value={search}
              onChange={(e) => setSearch(e.target.value)} className="max-w-xs h-9" />
            <Select value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="missing">未生成</SelectItem>
                <SelectItem value="generated">已生成</SelectItem>
                <SelectItem value="failed">最近失败</SelectItem>
              </SelectContent>
            </Select>
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
                  style={{ width: `${Math.round((batchProgress.done / Math.max(1, batchProgress.total)) * 100)}%` }} />
              </div>
            </div>
          )}

          {lastBatchStats && !batchRunning && (
            <div className="rounded-md border p-3 text-xs flex items-center gap-4 flex-wrap bg-muted/30">
              <span>上次批次：<span className="tabular-nums">{lastBatchStats.total}</span> 条</span>
              <span className="text-emerald-600">成功 {lastBatchStats.ok}</span>
              <span className="text-amber-600">降级 {lastBatchStats.fb}</span>
              <span className="text-destructive">失败 {lastBatchStats.fail}</span>
              <span className="text-muted-foreground">耗时 {(lastBatchStats.ms / 1000).toFixed(1)}s · 平均 {(lastBatchStats.ms / Math.max(1, lastBatchStats.total) / 1000).toFixed(1)}s/条</span>
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
                      {d.logoUrl ? (
                        <span className="text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />已生成</span>
                      ) : d.lastStatus === 'failed' ? (
                        <span className="text-destructive inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" />失败</span>
                      ) : (
                        <span className="text-muted-foreground inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" />未生成</span>
                      )}
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

      {/* 日志 */}
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
