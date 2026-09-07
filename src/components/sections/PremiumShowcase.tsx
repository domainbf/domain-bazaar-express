import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Crown, Clock, Wand2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHomeData, HomeDomainItem } from '@/hooks/useHomeData';
import { SkeletonCardGrid } from '@/components/common/SkeletonCard';
import { formatPrice } from '@/lib/currency';

type SectionKey = 'trending' | 'premium' | 'expiring' | 'ai';

const SECTIONS: { key: SectionKey; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { key: 'trending', label: '正在热搜', icon: Flame, desc: '近期访问量最高的域名' },
  { key: 'premium', label: '精选臻品', icon: Crown, desc: '手工挑选的高价值品牌域名' },
  { key: 'expiring', label: '即将截止', icon: Clock, desc: '限时上架，把握最后机会' },
  { key: 'ai', label: 'AI 生成灵感', icon: Wand2, desc: '智能生成的品牌名候选' },
];

const AI_ROOTS = ['nova', 'lumen', 'flux', 'orbit', 'zenith', 'aether', 'kite', 'atlas', 'nimbus', 'apex', 'echo', 'pulse'];
const AI_SUFFIXES = ['.ai', '.io', '.app', '.co', '.dev', '.xyz'];

const generateAiNames = () => {
  const list: { name: string; est: number }[] = [];
  const used = new Set<string>();
  while (list.length < 8) {
    const root = AI_ROOTS[Math.floor(Math.random() * AI_ROOTS.length)];
    const suf = AI_SUFFIXES[Math.floor(Math.random() * AI_SUFFIXES.length)];
    const name = `${root}${suf}`;
    if (used.has(name)) continue;
    used.add(name);
    list.push({ name, est: 800 + Math.floor(Math.random() * 12000) });
  }
  return list;
};

const CompactDomainCard = ({
  domain,
  price,
  currency,
  badge,
  index,
  href,
}: {
  domain: string;
  price?: number;
  currency?: string;
  badge?: string;
  index: number;
  href: string;
}) => {
  return (
    <Link
      to={href}
      className="group flex min-h-36 flex-col justify-between bg-card p-5 transition-colors hover:bg-muted/40 md:min-h-40"
    >
      <div className="flex items-start justify-between gap-3 font-sans text-[10px] font-semibold uppercase text-muted-foreground">
        <span>{String(index).padStart(2, '0')}</span>
        <span>{badge}</span>
      </div>
      <div className="mt-7 min-w-0">
        <div className="break-all font-editorial text-3xl leading-none text-foreground md:text-4xl" title={domain}>
          {domain}
        </div>
        {typeof price === 'number' && price > 0 ? (
          <p className="mt-3 font-sans text-xs font-semibold tabular-nums text-foreground">{formatPrice(price, currency)}</p>
        ) : (
          <p className="mt-3 font-sans text-xs text-muted-foreground">议价 · 联系卖家</p>
        )}
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-3 font-sans text-[10px] font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
        <span>查看详情</span>
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
};

export const PremiumShowcase = () => {
  const [active, setActive] = useState<SectionKey>('trending');
  const { data: homeData, isLoading } = useHomeData();
  const aiNames = useMemo(generateAiNames, [active === 'ai']);

  const domains = homeData?.hotDomains ?? [];

  const items = useMemo(() => {
    if (active === 'trending') return domains.slice(0, 8);
    if (active === 'premium') return [...domains].sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, 8);
    if (active === 'expiring') {
      return [...domains]
        .sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return ta - tb;
        })
        .slice(0, 8);
    }
    return [] as HomeDomainItem[];
  }, [active, domains]);

  const activeMeta = SECTIONS.find((s) => s.key === active) ?? SECTIONS[0];
  const displayItems = active === 'ai'
    ? aiNames.map((item, index) => ({ id: `ai-${index}`, ...item, price: item.est, currency: 'CNY', category: 'AI 生成' }))
    : items;
  const lead = displayItems[0];
  const sideItems = displayItems.slice(1, 3);
  const indexItems = displayItems.slice(3, 8);

  return (
    <section className="relative border-y border-border bg-background px-4 py-14 md:py-20">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-7 border-b border-foreground pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 font-sans text-[10px] font-semibold uppercase text-muted-foreground">域见•你策展 · 每日更新</p>
            <h2 className="font-editorial text-6xl font-normal leading-none text-foreground md:text-7xl">每日精选</h2>
            <p className="mt-3 font-sans text-sm text-muted-foreground">{activeMeta.desc}</p>
          </div>
          <Button asChild variant="ghost" className="w-fit rounded-none border-b border-signal px-0 hover:bg-transparent">
            <Link to="/marketplace">查看全部精选 <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 overflow-x-auto py-6 no-scrollbar">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = s.key === active;
            return (
              <Button
                key={s.key}
                type="button"
                variant="ghost"
                onClick={() => setActive(s.key)}
                className={`h-auto shrink-0 rounded-none px-0 py-1 font-sans text-xs font-semibold transition-colors ${
                  isActive
                    ? 'border-b-2 border-signal text-foreground hover:bg-transparent'
                    : 'text-muted-foreground hover:bg-transparent hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {s.label}
              </Button>
            );
          })}
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
          >
            {isLoading && active !== 'ai' ? (
                <SkeletonCardGrid count={8} />
            ) : lead ? (
              <div className="border border-border bg-border">
                <div className="grid gap-px md:grid-cols-12">
                  <Link to={active === 'ai' ? `/marketplace?search=${encodeURIComponent(lead.name)}` : `/domain/${encodeURIComponent(lead.name)}`} className="group flex min-h-[360px] flex-col justify-between bg-card p-6 md:col-span-7 md:min-h-[470px] md:p-10">
                    <div className="flex items-start justify-between">
                      <span className="bg-signal px-3 py-1 font-sans text-[10px] font-semibold text-signal-foreground">本期头条</span>
                      <span className="font-editorial text-2xl italic text-muted-foreground">01</span>
                    </div>
                    <div className="my-12 min-w-0">
                      <h3 className="break-all font-editorial text-6xl leading-[0.9] text-foreground md:text-8xl">{lead.name}</h3>
                      <div className="mt-6 flex items-center gap-4">
                        <span className="h-px w-10 bg-foreground" />
                        <span className="font-sans text-base font-medium tabular-nums text-muted-foreground">{formatPrice(lead.price, lead.currency)}</span>
                      </div>
                    </div>
                    <div className="flex items-end justify-between gap-4 border-t border-border pt-5">
                      <span className="font-sans text-xs text-muted-foreground">{lead.category || '精品域名'}</span>
                      <span className="inline-flex items-center gap-2 bg-primary px-5 py-3 font-sans text-xs font-semibold text-primary-foreground transition-colors group-hover:bg-signal group-hover:text-signal-foreground">查看域名 <ArrowRight className="h-4 w-4" /></span>
                    </div>
                  </Link>
                  <div className="grid gap-px bg-border md:col-span-5 md:grid-rows-2">
                    {sideItems.map((d, i) => (
                      <CompactDomainCard key={d.id} domain={d.name} price={d.price} currency={d.currency} badge={d.category || (active === 'ai' ? 'AI 生成' : '精选')} index={i + 2} href={active === 'ai' ? `/marketplace?search=${encodeURIComponent(d.name)}` : `/domain/${encodeURIComponent(d.name)}`} />
                    ))}
                  </div>
                </div>
                <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-5">
                  {indexItems.map((d, i) => (
                    <CompactDomainCard key={d.id} domain={d.name} price={d.price} currency={d.currency} badge={d.category || (active === 'ai' ? 'AI 生成' : '精选')} index={i + 4} href={active === 'ai' ? `/marketplace?search=${encodeURIComponent(d.name)}` : `/domain/${encodeURIComponent(d.name)}`} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="border border-border bg-card py-14 text-center text-muted-foreground">暂无数据</div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
