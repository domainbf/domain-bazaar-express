import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface DomainRow {
  id: string;
  name: string;
  price: number;
  currency: string | null;
}

const TLD_MULTI: Record<string, number> = {
  com: 1.0, cn: 0.82, net: 0.5, org: 0.42, io: 0.72, ai: 0.9, app: 0.62,
  co: 0.5, xyz: 0.12, top: 0.18, site: 0.15, online: 0.14, store: 0.28,
  shop: 0.32, tech: 0.38, dev: 0.48, me: 0.32, cc: 0.35, tv: 0.38,
};

const HOT_KW = ['ai','gpt','tech','cloud','pay','shop','bank','data','api','saas','web3','chat','smart'];

function estimate(fullName: string): number {
  const clean = fullName.toLowerCase().trim();
  const parts = clean.split('.');
  const tld = parts[parts.length - 1];
  const name = parts[0];
  const m = TLD_MULTI[tld] ?? 0.12;
  const lenBonus = name.length <= 3 ? 60000 : name.length <= 5 ? 20000 : name.length <= 7 ? 6000 : 2000;
  const pureBonus = /^[a-z]+$/.test(name) ? 1.5 : 1;
  const kwBonus = HOT_KW.some(k => name.includes(k)) ? 1.4 : 1;
  const hyphenPenalty = name.includes('-') ? 0.6 : 1;
  return Math.round(lenBonus * m * pureBonus * kwBonus * hyphenPenalty);
}

interface Suggestion {
  id: string;
  name: string;
  currency: string;
  current: number;
  suggested: number;
  delta: number; // percent
}

const CUR_SYM: Record<string, string> = { CNY: '¥', USD: '$', EUR: '€', HKD: 'HK$', GBP: '£' };
const fmt = (v: number, c: string) => `${CUR_SYM[c.toUpperCase()] || '¥'}${Math.round(v).toLocaleString()}`;

export default function AiPricingSuggestions({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<DomainRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('domain_listings')
        .select('id,name,price,currency')
        .eq('owner_id', userId)
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(20);
      if (!cancelled) setRows((data ?? []) as any);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!rows) return [];
    return rows
      .map(r => {
        const cur = (r.currency || 'CNY').toUpperCase();
        const suggested = estimate(r.name);
        const current = Number(r.price) || 0;
        if (!current) return null;
        const delta = ((suggested - current) / current) * 100;
        return { id: r.id, name: r.name, currency: cur, current, suggested, delta };
      })
      .filter((x): x is Suggestion => !!x && Math.abs(x.delta) > 15)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 4);
  }, [rows]);

  return (
    <Card className="border-border/60">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI 定价建议
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Beta</Badge>
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/valuation')}>
            估值工具 <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>

        {rows === null ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-6">
            <Sparkles className="h-7 w-7 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">当前定价基本合理，暂无优化建议</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {suggestions.map(s => {
              const up = s.delta > 0;
              const flat = Math.abs(s.delta) < 20;
              const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
              const color = flat ? 'text-muted-foreground' : up ? 'text-emerald-600' : 'text-amber-600';
              return (
                <button
                  key={s.id}
                  onClick={() => navigate(`/domain/${encodeURIComponent(s.name)}`)}
                  className="text-left p-3 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-semibold uppercase truncate">{s.name}</p>
                    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums ${color}`}>
                      <Icon className="h-3 w-3" />
                      {up ? '+' : ''}{s.delta.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">
                      当前 <span className="tabular-nums text-foreground/80">{fmt(s.current, s.currency)}</span>
                    </span>
                    <span className={color}>
                      建议 <span className="tabular-nums font-semibold">{fmt(s.suggested, s.currency)}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground mt-3">
          建议基于域名长度、后缀权重、关键词等本地算法生成，仅供参考。
        </p>
      </CardContent>
    </Card>
  );
}
