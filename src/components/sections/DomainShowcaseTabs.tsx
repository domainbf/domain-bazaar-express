import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, CheckCircle2, Tag, Trophy, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useHomeData } from '@/hooks/useHomeData';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';

type Item = {
  id: string;
  name: string;
  price: number;
  currency: string;
  createdAt?: string;
};

export const DomainShowcaseTabs = () => {
  const { data, isLoading } = useHomeData();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'sold' | 'available'>('sold');

  const sold: Item[] = useMemo(
    () => (data?.soldDomains ?? []).map(d => ({
      id: d.id, name: d.name, price: d.price, currency: d.currency, createdAt: d.createdAt,
    })),
    [data?.soldDomains],
  );
  const available: Item[] = useMemo(
    () => (data?.hotDomains ?? []).map(d => ({
      id: d.id, name: d.name, price: d.price, currency: d.currency, createdAt: d.createdAt,
    })),
    [data?.hotDomains],
  );

  const filter = (list: Item[]) => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(d => d.name.toLowerCase().includes(q));
  };

  const soldMatches = filter(sold);
  const availableMatches = filter(available);

  const highlight = (name: string) => {
    const q = query.trim();
    if (!q) return name;
    const idx = name.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return name;
    return (
      <>
        {name.slice(0, idx)}
        <mark className="bg-yellow-200/70 dark:bg-yellow-500/30 text-inherit rounded px-0.5">
          {name.slice(idx, idx + q.length)}
        </mark>
        {name.slice(idx + q.length)}
      </>
    );
  };

  const copy = (name: string) => {
    navigator.clipboard.writeText(name).then(
      () => toast.success(`已复制 ${name}`),
      () => toast.error('复制失败'),
    );
  };

  const renderList = (list: Item[], variant: 'sold' | 'available') => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      );
    }
    if (list.length === 0) {
      return (
        <div className="text-center py-14 text-sm text-muted-foreground">
          {query ? `未找到匹配 “${query}” 的${variant === 'sold' ? '已售' : '在售'}域名` : '暂无数据'}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {list.slice(0, 24).map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i, 12) * 0.02 }}
            className={`group relative rounded-xl border bg-card p-3 hover:shadow-md transition-all ${
              variant === 'sold'
                ? 'border-emerald-200/70 dark:border-emerald-800/50 hover:border-emerald-300'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <Link
                to={`/domain/${encodeURIComponent(d.name)}`}
                className="font-semibold text-sm text-foreground break-all leading-tight flex-1 hover:text-primary transition-colors"
                title={d.name}
              >
                {highlight(d.name)}
              </Link>
              {variant === 'sold' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              ) : (
                <Tag className="w-4 h-4 text-primary/60 flex-shrink-0" />
              )}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span
                className={`text-sm font-bold ${
                  variant === 'sold' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                }`}
              >
                {formatCurrency(d.price, d.currency)}
              </span>
              <button
                onClick={(e) => { e.preventDefault(); copy(d.name); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                aria-label="复制域名"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <section className="py-14 bg-gradient-to-b from-background to-emerald-50/30 dark:to-emerald-950/10 border-t border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-2xl font-bold text-foreground">域名精选 · 成交案例</h2>
        </div>

        <div className="max-w-md mx-auto mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索域名关键词 / 后缀…"
            className="pl-9"
          />
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'sold' | 'available')}>
          <TabsList className="mx-auto flex w-fit mb-6">
            <TabsTrigger value="sold" className="gap-2">
              已售 <Badge variant="secondary" className="ml-1">{soldMatches.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="available" className="gap-2">
              在售 <Badge variant="secondary" className="ml-1">{availableMatches.length}</Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="sold">{renderList(soldMatches, 'sold')}</TabsContent>
          <TabsContent value="available">{renderList(availableMatches, 'available')}</TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground mt-6">
          所有交易通过平台安全托管完成 · 点击域名进入详情或复制
        </p>
      </div>
    </section>
  );
};

export default DomainShowcaseTabs;
