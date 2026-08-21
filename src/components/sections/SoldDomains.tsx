import { motion } from 'framer-motion';
import { CheckCircle2, Trophy, ShieldCheck } from 'lucide-react';
import { useHomeData } from '@/hooks/useHomeData';
import { Domain } from '@/types/domain';
import { useSoldListings } from '@/hooks/useDomainListings';
import { cn } from '@/lib/utils';

const CURRENCY_SYMBOL: Record<string, string> = {
  CNY: '¥', USD: '$', EUR: '€', GBP: '£', JPY: '¥', HKD: 'HK$',
  SGD: 'S$', AUD: 'A$', CAD: 'C$', KRW: '₩', TWD: 'NT$', THB: '฿',
};

const fmt = (d: Domain) => `${CURRENCY_SYMBOL[(d.currency || 'CNY').toUpperCase()] || '¥'}${d.price.toLocaleString()}`;

interface SoldDomainsProps {
  /** When provided, cards are clickable (opens a read-only quick view). */
  onSelect?: (d: Domain, i: number) => void;
  /** true renders an offer-free grid; false renders the homepage marquee. */
  grid?: boolean;
  title?: string;
}

/**
 * Sold domains — a distinct, muted "archived deal" style. Never offerable.
 * grid=false keeps the homepage marquee; grid=true renders a proper archive grid.
 */
export const SoldDomains = ({ onSelect, grid = false, title = '成功交易案例' }: SoldDomainsProps) => {
  const { data: homeData } = useHomeData();
  const { data: soldListings = [] } = useSoldListings();

  const source: Domain[] = (grid ? soldListings : (homeData?.soldDomains ?? []))
    .slice(0, grid ? 60 : 10)
    .map((raw, i): Domain => {
      const d = raw as any;
      return {
      id: String(d.id ?? `sold-${i}`),
      name: d.name,
      price: Number(d.price) || 0,
      currency: (d as any).currency || 'CNY',
      category: 'standard',
      status: 'sold',
      owner_id: '',
      created_at: d.created_at ?? d.createdAt ?? new Date().toISOString(),
      };
    });

  if (grid) {
    if (source.length === 0) return null;
    return (
      <section className="py-10 bg-muted/30 border-t border-border">
        <div className="page-container">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <Trophy className="w-4 h-4 text-warning" />
            <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>
            <Trophy className="w-4 h-4 text-warning" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {source.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                onClick={onSelect ? () => onSelect(d, i) : undefined}
                className={cn(
                  'group relative rounded-xl border border-border/70 bg-card p-3.5 shadow-card transition-all duration-300',
                  onSelect ? 'cursor-pointer hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-elegant' : '',
                )}
              >
                {/* Sold ribbon */}
                <div className="absolute right-0 top-0 rounded-bl-lg rounded-tr-lg bg-foreground text-background px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                  已售
                </div>
                {/* Faded stripe */}
                <div aria-hidden className="absolute inset-0 pointer-events-none opacity-[0.05] bg-gradient-to-br from-foreground via-transparent to-transparent rounded-xl" />

                <div className="flex items-center justify-between gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0" />
                  <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                </div>

                <p className="mt-2.5 font-black uppercase tracking-tight leading-[1.05] break-all text-base sm:text-lg text-foreground/80">
                  {d.name}
                </p>
                <p className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">成交价格</p>
                <p className="text-base font-bold text-success tabular-nums">{fmt(d)}</p>

                <p className="mt-2.5 text-[10px] text-muted-foreground/70 border-t border-border/60 pt-2">已安全托管过户 · 不可再报价</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (source.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-background border-t border-border overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <Trophy className="w-5 h-5 text-warning" />
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <Trophy className="w-5 h-5 text-warning" />
        </motion.div>

        <div className="overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-4 min-w-max">
            {source.map((domain, i) => (
              <motion.div
                key={domain.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                viewport={{ once: true }}
                className="flex-shrink-0 w-56 p-4 bg-card border border-border rounded-xl shadow-card hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground truncate flex-1 text-sm">{domain.name}</h3>
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 ml-2" />
                </div>
                <p className="text-xs text-muted-foreground mb-1">成交价格</p>
                <p className="text-base font-bold text-success">¥{domain.price.toLocaleString()}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">以上域名已通过平台安全托管完成交易</p>
      </div>
    </section>
  );
};
