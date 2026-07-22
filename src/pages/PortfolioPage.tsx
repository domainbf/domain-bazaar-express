import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Columns3,
  Trash2,
  Check,
  X,
  ExternalLink,
  Copy,
  Sparkles,
  ShieldCheck,
  Eye,
  Heart,
  Inbox,
  Pencil,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DomainDetailDrawer } from '@/components/domain/DomainDetailDrawer';

import { toast } from 'sonner';
import { apiGet } from '@/lib/apiClient';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DomainListing } from '@/types/domain';
import { useNotifications } from '@/hooks/useNotifications';

type SortKey = 'name' | 'price' | 'status' | 'views' | 'created_at';
type SortDir = 'asc' | 'desc';

const COLUMNS = [
  { key: 'name', label: '域名' },
  { key: 'status', label: '状态' },
  { key: 'price', label: '价格' },
  { key: 'category', label: '类别' },
  { key: 'views', label: '浏览' },
  { key: 'created_at', label: '上架时间' },
] as const;

type ColKey = (typeof COLUMNS)[number]['key'];

const STATUS_TONES: Record<string, string> = {
  available: 'bg-success/10 text-success border-success/20',
  active: 'bg-success/10 text-success border-success/20',
  reserved: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  sold: 'bg-muted text-muted-foreground border-border',
  pending: 'bg-primary/10 text-primary border-primary/20',
};

const statusLabel = (s?: string) =>
  ({
    available: '在售',
    active: '在售',
    reserved: '已预订',
    sold: '已售出',
    pending: '待审核',
  } as any)[s || ''] ?? (s || '未知');

export default function PortfolioPage() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [domains, setDomains] = useState<DomainListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'created_at', dir: 'desc' });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(new Set(COLUMNS.map((c) => c.key)));
  const [activeDomain, setActiveDomain] = useState<DomainListing | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGet<DomainListing[]>('/data/my-domains');
      setDomains(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const filtered = useMemo(() => {
    let list = [...domains];
    if (status !== 'all') list = list.filter((d) => d.status === status);
    if (q.trim()) {
      const s = q.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.name?.toLowerCase().includes(s) ||
          d.category?.toLowerCase().includes(s) ||
          d.description?.toLowerCase().includes(s)
      );
    }
    const dir = sort.dir === 'asc' ? 1 : -1;
    list.sort((a: any, b: any) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return list;
  }, [domains, q, status, sort]);

  const totals = useMemo(() => {
    const value = filtered.reduce((s, d) => s + (Number(d.price) || 0), 0);
    return { count: filtered.length, value };
  }, [filtered]);

  const allSelected = filtered.length > 0 && filtered.every((d) => selected.has(d.id));
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((d) => d.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const bulkUpdateStatus = async (newStatus: string) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    const { error } = await (supabase as any)
      .from('domain_listings')
      .update({ status: newStatus })
      .in('id', ids);
    if (error) {
      toast.error('批量更新失败：' + error.message);
      return;
    }
    toast.success(`已更新 ${ids.length} 个域名`);
    setSelected(new Set());
    load();
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (!confirm(`确定删除 ${ids.length} 个域名吗？此操作不可撤销。`)) return;
    const { error } = await (supabase as any).from('domain_listings').delete().in('id', ids);
    if (error) {
      toast.error('删除失败：' + error.message);
      return;
    }
    toast.success(`已删除 ${ids.length} 个域名`);
    setSelected(new Set());
    load();
  };

  const changeSort = (key: SortKey) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sort.key !== k ? (
      <ArrowUpDown className="w-3 h-3 opacity-40" />
    ) : sort.dir === 'asc' ? (
      <ArrowUp className="w-3 h-3" />
    ) : (
      <ArrowDown className="w-3 h-3" />
    );

  const copyName = (name: string) => {
    navigator.clipboard.writeText(name).then(() => toast.success(`已复制 ${name}`));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar unreadCount={unreadCount} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <Link to="/dashboard" className="hover:text-foreground">工作台</Link>
              <span>/</span>
              <span className="text-foreground">域名组合</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2">
              <Globe className="w-7 h-7 text-primary" />
              域名组合
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              共 <span className="font-semibold text-foreground tabular-nums">{totals.count}</span> 个域名 · 总价值{' '}
              <span className="font-semibold text-foreground tabular-nums">¥{totals.value.toLocaleString()}</span>
            </p>
          </div>
          <Link to="/sell">
            <Button className="bg-gradient-primary text-primary-foreground border-0 hover:shadow-elegant">
              上架新域名
            </Button>
          </Link>
        </div>

        {/* Toolbar */}
        <div className="premium-surface p-3 md:p-4 mb-4">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索域名、类别、描述"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 h-10 bg-background"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Filter className="w-4 h-4" />
                  {status === 'all' ? '全部状态' : statusLabel(status)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {['all', 'available', 'reserved', 'sold', 'pending'].map((s) => (
                  <DropdownMenuItem key={s} onClick={() => setStatus(s)}>
                    {s === 'all' ? '全部状态' : statusLabel(s)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Columns3 className="w-4 h-4" /> 显示列
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>列可见性</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {COLUMNS.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c.key}
                    checked={visibleCols.has(c.key)}
                    onCheckedChange={(v) => {
                      const next = new Set(visibleCols);
                      v ? next.add(c.key) : next.delete(c.key);
                      setVisibleCols(next);
                    }}
                    disabled={c.key === 'name'}
                  >
                    {c.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="ml-auto flex items-center gap-2">
              {selected.size > 0 && (
                <>
                  <Badge variant="secondary" className="rounded-full">
                    已选 {selected.size}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus('available')}>
                    <Check className="w-4 h-4 mr-1" /> 上架
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus('reserved')}>
                    标为预订
                  </Button>
                  <Button size="sm" variant="destructive" onClick={bulkDelete}>
                    <Trash2 className="w-4 h-4 mr-1" /> 删除
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                    <X className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="premium-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="w-10 px-3 py-3">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="全选"
                      className={someSelected ? 'data-[state=checked]:opacity-70' : ''}
                    />
                  </th>
                  {visibleCols.has('name') && (
                    <th className="px-3 py-3 text-left">
                      <button className="inline-flex items-center gap-1 font-medium hover:text-foreground" onClick={() => changeSort('name')}>
                        域名 <SortIcon k="name" />
                      </button>
                    </th>
                  )}
                  {visibleCols.has('status') && (
                    <th className="px-3 py-3 text-left">
                      <button className="inline-flex items-center gap-1 font-medium hover:text-foreground" onClick={() => changeSort('status')}>
                        状态 <SortIcon k="status" />
                      </button>
                    </th>
                  )}
                  {visibleCols.has('price') && (
                    <th className="px-3 py-3 text-right">
                      <button className="inline-flex items-center gap-1 font-medium hover:text-foreground ml-auto" onClick={() => changeSort('price')}>
                        价格 <SortIcon k="price" />
                      </button>
                    </th>
                  )}
                  {visibleCols.has('category') && <th className="px-3 py-3 text-left">类别</th>}
                  {visibleCols.has('views') && (
                    <th className="px-3 py-3 text-right">
                      <button className="inline-flex items-center gap-1 font-medium hover:text-foreground ml-auto" onClick={() => changeSort('views')}>
                        浏览 <SortIcon k="views" />
                      </button>
                    </th>
                  )}
                  {visibleCols.has('created_at') && (
                    <th className="px-3 py-3 text-left">
                      <button className="inline-flex items-center gap-1 font-medium hover:text-foreground" onClick={() => changeSort('created_at')}>
                        上架时间 <SortIcon k="created_at" />
                      </button>
                    </th>
                  )}
                  <th className="w-20 px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                      加载中…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-14 text-center">
                      <div className="text-muted-foreground">暂无匹配的域名</div>
                      <Link to="/sell" className="mt-3 inline-block">
                        <Button variant="outline" size="sm" className="mt-3">
                          上架你的第一个域名
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ) : (
                  filtered.map((d) => {
                    const isSel = selected.has(d.id);
                    const symbol = d.currency === 'USD' ? '$' : '¥';
                    return (
                      <tr
                        key={d.id}
                        onClick={() => setActiveDomain(d)}
                        className={`border-b border-border last:border-b-0 hover:bg-accent/40 cursor-pointer transition-colors ${
                          isSel ? 'bg-primary/5' : ''
                        }`}
                      >
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={isSel} onCheckedChange={() => toggleOne(d.id)} />
                        </td>
                        {visibleCols.has('name') && (
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary grid place-items-center font-mono text-xs font-bold shrink-0">
                                {d.name?.[0]?.toUpperCase() || '?'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-foreground truncate">{d.name}</div>
                                {d.is_verified && (
                                  <div className="inline-flex items-center gap-1 text-[10px] text-success">
                                    <ShieldCheck className="w-3 h-3" /> 已验证
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        )}
                        {visibleCols.has('status') && (
                          <td className="px-3 py-3">
                            <Badge variant="outline" className={`text-xs ${STATUS_TONES[d.status || ''] || ''}`}>
                              {statusLabel(d.status)}
                            </Badge>
                          </td>
                        )}
                        {visibleCols.has('price') && (
                          <td className="px-3 py-3 text-right font-semibold tabular-nums">
                            {symbol}
                            {(Number(d.price) || 0).toLocaleString()}
                          </td>
                        )}
                        {visibleCols.has('category') && (
                          <td className="px-3 py-3 text-muted-foreground">{d.category || '—'}</td>
                        )}
                        {visibleCols.has('views') && (
                          <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{d.views ?? 0}</td>
                        )}
                        {visibleCols.has('created_at') && (
                          <td className="px-3 py-3 text-muted-foreground">
                            {d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}
                          </td>
                        )}
                        <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" onClick={() => setActiveDomain(d)}>
                            详情
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Slide-out drawer */}
      <DomainDetailDrawer
        domain={activeDomain}
        open={!!activeDomain}
        onOpenChange={(o) => !o && setActiveDomain(null)}
      />

    </div>
  );
}
