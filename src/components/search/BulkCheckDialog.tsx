import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, ListChecks, CheckCircle2, XCircle, ExternalLink, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { formatPrice } from '@/lib/currency';

type Row = {
  input: string;
  name: string;
  status: 'available' | 'sold' | 'reserved' | 'pending' | 'not_listed';
  price?: number;
  currency?: string;
  id?: string;
};

const parseInput = (raw: string): string[] => {
  return Array.from(
    new Set(
      raw
        .split(/[\s,;\n\r\t]+/)
        .map((s) => s.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
        .filter((s) => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(s)),
    ),
  );
};

const statusMeta: Record<Row['status'], { label: string; className: string; icon: any }> = {
  available: { label: '在售', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', icon: CheckCircle2 },
  pending: { label: '暂不出售', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', icon: XCircle },
  sold: { label: '已售出', className: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: CheckCircle2 },
  reserved: { label: '已保留', className: 'bg-purple-500/10 text-purple-600 border-purple-500/30', icon: XCircle },
  not_listed: { label: '未上架', className: 'bg-muted text-muted-foreground border-border', icon: XCircle },
};

export const BulkCheckDialog = ({ trigger }: { trigger?: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);

  const run = async () => {
    const names = parseInput(raw);
    if (names.length === 0) {
      toast.error('请输入有效的域名，每行或用逗号分隔');
      return;
    }
    if (names.length > 50) {
      toast.error('单次最多检查 50 个域名');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('domain_listings')
        .select('id, name, status, price, currency')
        .in('name', names);
      if (error) throw error;
      const map = new Map<string, any>();
      (data ?? []).forEach((d: any) => map.set(d.name.toLowerCase(), d));
      const result: Row[] = names.map((n) => {
        const hit = map.get(n);
        if (!hit) return { input: n, name: n, status: 'not_listed' };
        return {
          input: n,
          name: hit.name,
          status: (hit.status as Row['status']) || 'available',
          price: hit.price,
          currency: hit.currency || 'CNY',
          id: hit.id,
        };
      });
      setRows(result);
    } catch (e: any) {
      toast.error(e?.message || '查询失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    if (!rows) return;
    const txt = rows
      .map((r) => `${r.name}\t${statusMeta[r.status].label}${r.price ? `\t${formatPrice(r.price, r.currency || 'CNY')}` : ''}`)
      .join('\n');
    navigator.clipboard.writeText(txt).then(() => toast.success('已复制结果'));
  };

  const summary = rows
    ? {
        total: rows.length,
        available: rows.filter((r) => r.status === 'available').length,
        listed: rows.filter((r) => r.status !== 'not_listed').length,
      }
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5">
            <ListChecks className="w-4 h-4" />
            批量检查
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary" />
            批量域名检查
          </DialogTitle>
          <DialogDescription>
            粘贴多个域名（换行、逗号或空格分隔，最多 50 个），一键查看在本站的可购状态与价格。
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={'example.com\nbrand.io\nshop.cn'}
          rows={5}
          className="font-mono text-sm"
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            已识别 {parseInput(raw).length} 个域名
          </span>
          <div className="flex gap-2">
            {rows && (
              <Button variant="ghost" size="sm" onClick={copyAll}>
                <Copy className="w-4 h-4 mr-1" /> 复制结果
              </Button>
            )}
            <Button onClick={run} disabled={loading} size="sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {loading ? '检查中…' : '开始检查'}
            </Button>
          </div>
        </div>

        {summary && (
          <div className="flex gap-2 text-xs">
            <Badge variant="secondary">共 {summary.total} 个</Badge>
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
              可购 {summary.available}
            </Badge>
            <Badge variant="outline">本站已上架 {summary.listed}</Badge>
          </div>
        )}

        {rows && (
          <div className="max-h-80 overflow-y-auto rounded-lg border border-border divide-y divide-border">
            {rows.map((r) => {
              const M = statusMeta[r.status];
              const Icon = M.icon;
              return (
                <div key={r.input} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40">
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="font-mono text-sm font-medium flex-1 truncate">{r.name}</span>
                  <Badge variant="outline" className={M.className}>
                    {M.label}
                  </Badge>
                  {r.price !== undefined && (
                    <span className="text-sm font-semibold tabular-nums w-24 text-right">
                      {formatPrice(r.price, r.currency || 'CNY')}
                    </span>
                  )}
                  {r.status !== 'not_listed' && (
                    <Link
                      to={`/domain/${encodeURIComponent(r.name)}`}
                      className="text-primary hover:text-primary/80"
                      onClick={() => setOpen(false)}
                      aria-label="查看详情"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkCheckDialog;
