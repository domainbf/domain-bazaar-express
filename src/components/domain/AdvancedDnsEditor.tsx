import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Plus, Trash2, Save, RefreshCw, CheckCircle2, XCircle, Loader2, Globe2,
} from 'lucide-react';

/**
 * 高级 DNS 编辑器
 * - CRUD dns_records（按 user_id + subdomain 组合）
 * - DoH 传播检查（Cloudflare 1.1.1.1 + Google 8.8.8.8）
 * - 支持类型：A / AAAA / CNAME / MX / TXT / NS
 */

type DnsType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS';
type Row = {
  id: string;
  subdomain: string;
  record_type: DnsType;
  target: string;
  ttl: number | null;
  priority: number | null;
  status?: string | null;
  _dirty?: boolean;
  _new?: boolean;
};

type PropResult = { ok: boolean; values: string[]; provider: string };

const DNS_TYPES: DnsType[] = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS'];

async function dohQuery(name: string, type: DnsType, provider: 'cf' | 'g'): Promise<PropResult> {
  const url = provider === 'cf'
    ? `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`
    : `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`;
  try {
    const r = await fetch(url, { headers: { accept: 'application/dns-json' } });
    if (!r.ok) return { ok: false, values: [], provider };
    const j: any = await r.json();
    const values = (j.Answer ?? []).map((a: any) => String(a.data));
    return { ok: values.length > 0, values, provider };
  } catch {
    return { ok: false, values: [], provider };
  }
}

interface Props {
  domainName: string;    // e.g. example.com
  ownerId: string;       // current user's uid (dns_records.user_id)
}

export default function AdvancedDnsEditor({ domainName, ownerId }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [propagating, setPropagating] = useState<Record<string, { cf?: PropResult; g?: PropResult; loading?: boolean }>>({});

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('dns_records')
      .select('id, subdomain, record_type, target, ttl, priority, status')
      .eq('user_id', ownerId)
      .order('subdomain', { ascending: true });
    if (error) {
      toast.error('加载 DNS 记录失败', { description: error.message });
    } else {
      // filter to those relevant to this domain: subdomain ends with domainName or subdomain is '@'/domainName
      const relevant = (data ?? []).filter((r: any) => {
        const s = String(r.subdomain || '').toLowerCase();
        return s === domainName.toLowerCase()
          || s.endsWith('.' + domainName.toLowerCase())
          || s === '@';
      });
      setRows(relevant as Row[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRows(); /* eslint-disable-next-line */ }, [domainName, ownerId]);

  const addRow = () => {
    setRows(prev => [
      ...prev,
      {
        id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        subdomain: '@',
        record_type: 'A',
        target: '',
        ttl: 3600,
        priority: null,
        _new: true,
        _dirty: true,
      },
    ]);
  };

  const patch = (id: string, delta: Partial<Row>) =>
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...delta, _dirty: true } : r)));

  const remove = async (row: Row) => {
    if (row._new) {
      setRows(prev => prev.filter(r => r.id !== row.id));
      return;
    }
    if (!confirm(`删除记录 ${row.subdomain} ${row.record_type} ${row.target}?`)) return;
    const { error } = await supabase.from('dns_records').delete().eq('id', row.id);
    if (error) return toast.error('删除失败', { description: error.message });
    toast.success('已删除');
    setRows(prev => prev.filter(r => r.id !== row.id));
  };

  const validate = (r: Row): string | null => {
    if (!r.subdomain?.trim()) return '子域名不能为空（顶级请填 @）';
    if (!r.target?.trim()) return '目标值不能为空';
    if (r.record_type === 'A' && !/^\d{1,3}(\.\d{1,3}){3}$/.test(r.target)) return 'A 记录必须是 IPv4 地址';
    if (r.record_type === 'AAAA' && !r.target.includes(':')) return 'AAAA 记录必须是 IPv6 地址';
    if (r.record_type === 'MX' && (r.priority == null || r.priority < 0)) return 'MX 记录必须设置优先级';
    if (r.ttl != null && (r.ttl < 60 || r.ttl > 86400)) return 'TTL 必须在 60~86400 之间';
    return null;
  };

  const saveAll = async () => {
    const dirty = rows.filter(r => r._dirty);
    if (!dirty.length) return toast.info('没有需要保存的更改');
    for (const r of dirty) {
      const err = validate(r);
      if (err) return toast.error(`${r.subdomain} ${r.record_type}: ${err}`);
    }
    const toInsert = dirty.filter(r => r._new).map(r => ({
      subdomain: r.subdomain,
      record_type: r.record_type,
      target: r.target,
      ttl: r.ttl ?? 3600,
      priority: r.priority,
      user_id: ownerId,
      status: 'pending',
    }));
    const toUpdate = dirty.filter(r => !r._new);

    try {
      if (toInsert.length) {
        const { error } = await supabase.from('dns_records').insert(toInsert as any);
        if (error) throw error;
      }
      for (const r of toUpdate) {
        const { error } = await supabase.from('dns_records').update({
          subdomain: r.subdomain,
          record_type: r.record_type,
          target: r.target,
          ttl: r.ttl ?? 3600,
          priority: r.priority,
        }).eq('id', r.id);
        if (error) throw error;
      }
      toast.success('DNS 记录已保存');
      fetchRows();
    } catch (e: any) {
      toast.error('保存失败', { description: e.message });
    }
  };

  const checkPropagation = async (r: Row) => {
    const name = r.subdomain === '@' ? domainName : (r.subdomain.endsWith(domainName) ? r.subdomain : `${r.subdomain}.${domainName}`);
    setPropagating(p => ({ ...p, [r.id]: { ...p[r.id], loading: true } }));
    const [cf, g] = await Promise.all([
      dohQuery(name, r.record_type, 'cf'),
      dohQuery(name, r.record_type, 'g'),
    ]);
    setPropagating(p => ({ ...p, [r.id]: { cf, g, loading: false } }));
    const matchTarget = (v: string) => v.replace(/^"|"$/g, '').replace(/\.$/, '') === r.target.replace(/\.$/, '');
    const cfHit = cf.values.some(matchTarget);
    const gHit = g.values.some(matchTarget);
    if (cfHit && gHit) toast.success(`${name} 已在全球 DNS 传播`);
    else if (cfHit || gHit) toast.warning(`${name} 部分节点已解析（仍在传播中）`);
    else toast.error(`${name} 尚未检测到解析`);
  };

  const dirtyCount = useMemo(() => rows.filter(r => r._dirty).length, [rows]);

  return (
    <Card className="border-border/60">
      <CardContent className="p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Globe2 className="h-4 w-4" /> DNS 记录 <span className="text-muted-foreground font-normal">— {domainName}</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              修改后点击「保存全部」；使用「传播检查」验证全球解析
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={fetchRows} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />刷新
            </Button>
            <Button size="sm" variant="outline" onClick={addRow}>
              <Plus className="h-3.5 w-3.5 mr-1" />新增记录
            </Button>
            <Button size="sm" onClick={saveAll} disabled={dirtyCount === 0}>
              <Save className="h-3.5 w-3.5 mr-1" />保存全部
              {dirtyCount > 0 && <Badge className="ml-1.5 text-[10px] h-4 px-1">{dirtyCount}</Badge>}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <Globe2 className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground mb-3">还没有 DNS 记录</p>
            <Button size="sm" variant="outline" onClick={addRow}>
              <Plus className="h-3.5 w-3.5 mr-1" />添加第一条
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map(r => {
              const p = propagating[r.id];
              return (
                <div
                  key={r.id}
                  className={`rounded-lg border p-3 space-y-2 ${r._dirty ? 'border-primary/50 bg-primary/5' : 'border-border/60'}`}
                >
                  <div className="grid grid-cols-12 gap-2 items-start">
                    <Input
                      className="col-span-6 md:col-span-3 h-9"
                      placeholder="@ 或 www"
                      value={r.subdomain}
                      onChange={e => patch(r.id, { subdomain: e.target.value })}
                    />
                    <div className="col-span-6 md:col-span-2">
                      <Select value={r.record_type} onValueChange={(v) => patch(r.id, { record_type: v as DnsType })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DNS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      className="col-span-12 md:col-span-4 h-9 font-mono text-xs"
                      placeholder={r.record_type === 'A' ? '1.2.3.4' : r.record_type === 'CNAME' ? 'target.example.com.' : '目标值'}
                      value={r.target}
                      onChange={e => patch(r.id, { target: e.target.value })}
                    />
                    <Input
                      type="number"
                      className="col-span-4 md:col-span-1 h-9"
                      placeholder="TTL"
                      value={r.ttl ?? ''}
                      onChange={e => patch(r.id, { ttl: e.target.value ? Number(e.target.value) : null })}
                    />
                    <Input
                      type="number"
                      className="col-span-4 md:col-span-1 h-9"
                      placeholder="优先级"
                      value={r.priority ?? ''}
                      disabled={r.record_type !== 'MX'}
                      onChange={e => patch(r.id, { priority: e.target.value ? Number(e.target.value) : null })}
                    />
                    <div className="col-span-4 md:col-span-1 flex gap-1 justify-end">
                      <Button size="icon" variant="ghost" onClick={() => checkPropagation(r)} disabled={r._new || p?.loading} title="传播检查">
                        {p?.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(r)} title="删除">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {p && !p.loading && (p.cf || p.g) && (
                    <div className="flex flex-wrap gap-2 text-[11px] pl-1">
                      <PropChip label="Cloudflare" res={p.cf} />
                      <PropChip label="Google" res={p.g} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PropChip({ label, res }: { label: string; res?: PropResult }) {
  if (!res) return null;
  const Icon = res.ok ? CheckCircle2 : XCircle;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${res.ok ? 'text-emerald-600 border-emerald-500/40 bg-emerald-500/5' : 'text-muted-foreground border-border'}`}>
      <Icon className="h-3 w-3" />
      {label}: {res.ok ? res.values.slice(0, 1).join(', ') : '未解析'}
    </span>
  );
}
