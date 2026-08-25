import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Search, RefreshCw, Edit, Trash2, BadgeCheck, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { CURRENCIES, formatPrice } from '@/lib/currency';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

interface Row {
  id: string;
  name: string;
  price: number;
  currency: string | null;
  category: string | null;
  description: string | null;
  status: string | null;
  highlight: boolean | null;
  sort_order: number | null;
  created_at: string | null;
}

const STATUSES = [
  { value: 'available', label: '在售' },
  { value: 'reserved', label: '保留' },
  { value: 'pending', label: '暂不出售' },
  { value: 'sold', label: '已售' },
];

const CATEGORIES = ['standard', 'premium', 'short', 'brandable', 'keyword', 'numeric'];

const emptyForm = {
  name: '', price: '', currency: 'CNY', category: 'standard',
  description: '', status: 'available', highlight: false, sort_order: '0',
};

export const DomainManagerPanel = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('domain_listings')
      .select('id,name,price,currency,category,description,status,highlight,sort_order,created_at')
      .order('sort_order', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) toast.error('加载失败：' + error.message);
    setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useRealtimeSubscription(['domain_listings'], () => { load(); });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(r =>
      (statusFilter === 'all' || (r.status || 'available') === statusFilter) &&
      (!q || r.name.toLowerCase().includes(q))
    );
  }, [rows, query, statusFilter]);

  const openAdd = () => { setEditingId(null); setForm({ ...emptyForm }); setDialogOpen(true); };
  const openEdit = (r: Row) => {
    setEditingId(r.id);
    setForm({
      name: r.name,
      price: String(r.price ?? ''),
      currency: (r.currency || 'CNY').toUpperCase(),
      category: r.category || 'standard',
      description: r.description || '',
      status: r.status || 'available',
      highlight: !!r.highlight,
      sort_order: String(r.sort_order ?? 0),
    });
    setDialogOpen(true);
  };

  const save = async () => {
    const name = form.name.trim().toLowerCase();
    const price = parseFloat(form.price);
    if (!/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(name)) {
      toast.error('请输入有效的域名，例如 example.com'); return;
    }
    if (!isFinite(price) || price <= 0) { toast.error('请输入有效的价格'); return; }

    setSaving(true);
    const payload: any = {
      name, price,
      currency: form.currency,
      category: form.category,
      description: form.description || null,
      status: form.status,
      highlight: form.highlight,
      sort_order: parseInt(form.sort_order || '0', 10) || 0,
    };
    const { error } = editingId
      ? await (supabase as any).from('domain_listings').update(payload).eq('id', editingId)
      : await (supabase as any).from('domain_listings').insert(payload);
    setSaving(false);
    if (error) { toast.error('保存失败：' + error.message); return; }
    toast.success(editingId ? '域名已更新' : '域名已添加');
    setDialogOpen(false);
    load();
  };

  const patch = async (id: string, values: Record<string, any>, msg: string) => {
    const { error } = await (supabase as any).from('domain_listings').update(values).eq('id', id);
    if (error) { toast.error('操作失败：' + error.message); return; }
    toast.success(msg);
    load();
  };

  const remove = async (r: Row) => {
    if (!window.confirm(`确定删除 ${r.name}？该操作不可撤销。`)) return;
    const { error } = await (supabase as any).from('domain_listings').delete().eq('id', r.id);
    if (error) { toast.error('删除失败：' + error.message); return; }
    toast.success('已删除');
    load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 flex-wrap">
        <div>
          <CardTitle>域名管理后台</CardTitle>
          <CardDescription>新增/编辑在售域名，设置价格、币种与排序，并可一键标记为已售</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />刷新
          </Button>
          <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" />新增域名</Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="搜索域名..." value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">没有匹配的域名</p>
        ) : (
          <div className="rounded-lg border border-border divide-y divide-border">
            {filtered.map(r => {
              const isSold = (r.status || '') === 'sold';
              return (
                <div key={r.id} className="flex items-center gap-3 p-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{r.name}</span>
                      <Badge variant={isSold ? 'secondary' : 'outline'}>
                        {STATUSES.find(s => s.value === (r.status || 'available'))?.label || r.status}
                      </Badge>
                      {r.highlight && <Badge className="bg-primary/10 text-primary border-primary/30">精选</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatPrice(Number(r.price || 0), r.currency || 'CNY')} · 排序 {r.sort_order ?? 0} · {r.category || 'standard'}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" title="上调排序"
                      onClick={() => patch(r.id, { sort_order: (r.sort_order ?? 0) + 1 }, '排序已更新')}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="下调排序"
                      onClick={() => patch(r.id, { sort_order: (r.sort_order ?? 0) - 1 }, '排序已更新')}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(r)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={isSold ? 'secondary' : 'default'}
                      size="sm"
                      onClick={() => patch(r.id, { status: isSold ? 'available' : 'sold' }, isSold ? '已恢复为在售' : '已标记为已售')}
                    >
                      <BadgeCheck className="h-4 w-4 mr-1" />{isSold ? '恢复在售' : '标记已售'}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(r)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑域名' : '新增域名'}</DialogTitle>
            <DialogDescription>价格与排序会即时同步到前台列表</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>域名</Label>
              <Input value={form.name} disabled={!!editingId}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="example.com" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>价格</Label>
                <Input type="number" min="1" step="0.01" value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="1000" />
              </div>
              <div className="space-y-1.5">
                <Label>币种</Label>
                <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(CURRENCIES).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>状态</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>分类</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>排序值</Label>
                <Input type="number" value={form.sort_order}
                  onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>描述</Label>
              <Textarea rows={3} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="可选" />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="dm-highlight" checked={form.highlight}
                onCheckedChange={v => setForm(f => ({ ...f, highlight: !!v }))} />
              <Label htmlFor="dm-highlight">设为精选域名</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
