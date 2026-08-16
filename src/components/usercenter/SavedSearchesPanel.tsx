import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Bookmark, Plus, Pencil, Trash2, PlayCircle, Loader2, ExternalLink,
  CheckCircle2, XCircle, Clock, BellRing,
} from 'lucide-react';
import { toast } from 'sonner';

interface SavedSearch {
  id: string;
  name: string;
  query: string | null;
  filters: Record<string, any>;
  notify_new: boolean;
  run_interval_hours: number;
  last_run_at: string | null;
  last_run_status: string | null;
  last_run_error: string | null;
  last_match_count: number;
  alert_count: number;
}

const INTERVALS = [
  { value: '1', label: '每小时' },
  { value: '6', label: '每 6 小时' },
  { value: '24', label: '每天' },
  { value: '168', label: '每周' },
];

const emptyDraft = {
  id: '' as string,
  name: '',
  query: '',
  category: 'all',
  status: 'all',
  minPrice: '',
  maxPrice: '',
  extension: '',
  notify_new: true,
  run_interval_hours: '24',
};

type Draft = typeof emptyDraft;

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('zh-CN') : '尚未触发');

const nextRun = (s: SavedSearch) => {
  if (!s.notify_new) return '已关闭提醒';
  const base = s.last_run_at ? new Date(s.last_run_at).getTime() : Date.now();
  return new Date(base + s.run_interval_hours * 3600_000).toLocaleString('zh-CN');
};

export const SavedSearchesPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await (supabase as any)
      .from('saved_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error) setItems((data ?? []) as SavedSearch[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setDraft(emptyDraft); setOpen(true); };

  const openEdit = (s: SavedSearch) => {
    const f = s.filters || {};
    setDraft({
      id: s.id,
      name: s.name,
      query: s.query ?? '',
      category: f.category ?? 'all',
      status: f.status ?? 'all',
      minPrice: f.minPrice != null ? String(f.minPrice) : '',
      maxPrice: f.maxPrice != null ? String(f.maxPrice) : '',
      extension: f.extension ?? '',
      notify_new: s.notify_new,
      run_interval_hours: String(s.run_interval_hours ?? 24),
    });
    setOpen(true);
  };

  const buildFilters = (d: Draft) => {
    const f: Record<string, any> = {};
    if (d.category !== 'all') f.category = d.category;
    if (d.status !== 'all') f.status = d.status;
    if (d.minPrice) f.minPrice = Number(d.minPrice);
    if (d.maxPrice) f.maxPrice = Number(d.maxPrice);
    if (d.extension.trim()) f.extension = d.extension.trim().replace(/^\./, '');
    return f;
  };

  const submit = async () => {
    if (!user) return;
    if (!draft.name.trim()) { toast.error('请填写订阅名称'); return; }
    if (draft.minPrice && draft.maxPrice && Number(draft.minPrice) > Number(draft.maxPrice)) {
      toast.error('最低价不能高于最高价'); return;
    }
    const payload = {
      user_id: user.id,
      name: draft.name.trim(),
      query: draft.query.trim(),
      filters: buildFilters(draft),
      notify_new: draft.notify_new,
      run_interval_hours: Number(draft.run_interval_hours),
    };
    const res = draft.id
      ? await (supabase as any).from('saved_searches').update(payload).eq('id', draft.id)
      : await (supabase as any).from('saved_searches').insert(payload);
    if (res.error) { toast.error('保存失败：' + res.error.message); return; }
    toast.success(draft.id ? '订阅已更新' : '订阅已创建');
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from('saved_searches').delete().eq('id', id);
    if (error) return toast.error('删除失败：' + error.message);
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('订阅已删除');
  };

  const toggleNotify = async (s: SavedSearch) => {
    const value = !s.notify_new;
    const { error } = await (supabase as any).from('saved_searches').update({ notify_new: value }).eq('id', s.id);
    if (error) return toast.error('更新失败');
    setItems(prev => prev.map(i => i.id === s.id ? { ...i, notify_new: value } : i));
  };

  const runTest = async (s: SavedSearch) => {
    if (!user) return;
    setRunning(s.id);
    let status = 'success';
    let matchCount = 0;
    let errMsg: string | null = null;
    let sample: any[] = [];
    try {
      let q = (supabase as any)
        .from('domain_listings')
        .select('id, name, price', { count: 'exact' })
        .limit(5);
      const f = s.filters || {};
      if (s.query) q = q.ilike('name', `%${s.query}%`);
      if (f.extension) q = q.ilike('name', `%.${f.extension}`);
      if (f.category) q = q.eq('category', f.category);
      q = q.eq('status', f.status || 'available');
      if (f.minPrice != null) q = q.gte('price', f.minPrice);
      if (f.maxPrice != null) q = q.lte('price', f.maxPrice);
      const { data, count, error } = await q;
      if (error) throw new Error(error.message);
      matchCount = count ?? (data?.length ?? 0);
      sample = (data ?? []).map((d: any) => ({ id: d.id, name: d.name, price: d.price }));
    } catch (e: any) {
      status = 'failed';
      errMsg = e?.message || '未知错误';
    }

    await (supabase as any).from('saved_search_runs').insert({
      saved_search_id: s.id,
      user_id: user.id,
      status,
      match_count: matchCount,
      is_test: true,
      error: errMsg,
      sample,
    });

    await (supabase as any).from('saved_searches').update({
      last_run_at: new Date().toISOString(),
      last_run_status: status,
      last_run_error: errMsg,
      last_match_count: matchCount,
      alert_count: (s.alert_count ?? 0) + (status === 'success' && matchCount > 0 ? 1 : 0),
    }).eq('id', s.id);

    setRunning(null);
    load();
    if (status === 'success') toast.success(`测试完成：匹配 ${matchCount} 个域名`);
    else toast.error('测试失败：' + errMsg);
  };

  const apply = (s: SavedSearch) => {
    const params = new URLSearchParams();
    if (s.query) params.set('q', s.query);
    Object.entries(s.filters || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'all') params.set(k, String(v));
    });
    navigate(`/marketplace${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bookmark className="h-4 w-4" />我的搜索订阅
          <Button size="sm" className="ml-auto h-8" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5 mr-1" />新建订阅
          </Button>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          保存常用搜索条件，开启提醒后按设定频率检查新上架域名；可随时手动触发测试确认效果。
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            还没有搜索订阅，点击「新建订阅」创建第一个。
          </div>
        ) : items.map(s => (
          <div key={s.id} className="border rounded-lg p-3 space-y-2.5">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground break-all">
                  关键词：{s.query || '（无）'} · 筛选：{Object.keys(s.filters || {}).length} 项
                </p>
              </div>
              <Switch checked={s.notify_new} onCheckedChange={() => toggleNotify(s)} aria-label={`提醒开关 ${s.name}`} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="rounded-md bg-muted p-2">
                <p className="text-muted-foreground">最近触发</p>
                <p className="font-medium flex items-center gap-1">
                  {s.last_run_status === 'failed'
                    ? <XCircle className="h-3 w-3 text-destructive" />
                    : s.last_run_at ? <CheckCircle2 className="h-3 w-3 text-primary" /> : <Clock className="h-3 w-3" />}
                  {fmt(s.last_run_at)}
                </p>
              </div>
              <div className="rounded-md bg-muted p-2">
                <p className="text-muted-foreground">本次匹配</p>
                <p className="font-medium">{s.last_match_count ?? 0} 个域名</p>
              </div>
              <div className="rounded-md bg-muted p-2">
                <p className="text-muted-foreground">累计告警</p>
                <p className="font-medium flex items-center gap-1"><BellRing className="h-3 w-3" />{s.alert_count ?? 0} 次</p>
              </div>
              <div className="rounded-md bg-muted p-2">
                <p className="text-muted-foreground">下次触发</p>
                <p className="font-medium">{nextRun(s)}</p>
              </div>
            </div>

            {s.last_run_status === 'failed' && s.last_run_error && (
              <p className="text-xs text-destructive break-all">失败原因：{s.last_run_error}</p>
            )}

            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-[10px]">
                {INTERVALS.find(i => i.value === String(s.run_interval_hours))?.label ?? `每 ${s.run_interval_hours} 小时`}
              </Badge>
              <div className="ml-auto flex gap-1.5">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => runTest(s)} disabled={running === s.id}>
                  {running === s.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <PlayCircle className="h-3 w-3 mr-1" />}
                  测试触发
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => apply(s)}>
                  <ExternalLink className="h-3 w-3 mr-1" />查看结果
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(s)} aria-label={`编辑 ${s.name}`}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => remove(s.id)} aria-label={`删除 ${s.name}`}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{draft.id ? '编辑搜索订阅' : '新建搜索订阅'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="订阅名称（如：短域名 .com）" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
            <Input placeholder="关键词（可选）" value={draft.query} onChange={e => setDraft({ ...draft, query: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="后缀，如 com" value={draft.extension} onChange={e => setDraft({ ...draft, extension: e.target.value })} />
              <Select value={draft.status} onValueChange={v => setDraft({ ...draft, status: v })}>
                <SelectTrigger><SelectValue placeholder="状态" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="available">可售</SelectItem>
                  <SelectItem value="reserved">已预订</SelectItem>
                  <SelectItem value="sold">已售出</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="最低价" value={draft.minPrice} onChange={e => setDraft({ ...draft, minPrice: e.target.value })} />
              <Input type="number" placeholder="最高价" value={draft.maxPrice} onChange={e => setDraft({ ...draft, maxPrice: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2 items-center">
              <Select value={draft.run_interval_hours} onValueChange={v => setDraft({ ...draft, run_interval_hours: v })}>
                <SelectTrigger><SelectValue placeholder="触发频率" /></SelectTrigger>
                <SelectContent>
                  {INTERVALS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={draft.notify_new} onCheckedChange={v => setDraft({ ...draft, notify_new: v })} aria-label="开启提醒" />
                开启提醒
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={submit}>{draft.id ? '保存修改' : '创建订阅'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SavedSearchesPanel;
