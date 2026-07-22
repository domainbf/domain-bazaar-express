import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Crown, Clock, Wand2, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHomeData, HomeDomainItem } from '@/hooks/useHomeData';
import { SkeletonCardGrid } from '@/components/common/SkeletonCard';

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
  badgeTone = 'primary',
  href,
}: {
  domain: string;
  price?: number;
  currency?: string;
  badge?: string;
  badgeTone?: 'primary' | 'success' | 'warning';
  href: string;
}) => {
  const symbol = currency === 'USD' ? '$' : '¥';
  const toneClasses =
    badgeTone === 'success'
      ? 'bg-success/10 text-success'
      : badgeTone === 'warning'
        ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
        : 'bg-primary/10 text-primary';

  return (
    <Link
      to={href}
      className="group relative flex flex-col justify-between p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant overflow-hidden"
    >
      {/* subtle gradient wash on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/[0.06] to-transparent pointer-events-none" />

      <div className="relative flex items-start justify-between gap-2 mb-6">
        {badge && (
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${toneClasses}`}>
            {badge}
          </span>
        )}
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all ml-auto" />
      </div>

      <div className="relative">
        <div
          className="font-semibold text-foreground truncate tracking-tight mb-2"
          style={{ fontSize: 'clamp(1rem, 2.4vw, 1.375rem)' }}
          title={domain}
        >
          {domain}
        </div>
        {typeof price === 'number' && price > 0 ? (
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-muted-foreground">起价</span>
            <span className="font-bold text-foreground tabular-nums">
              {symbol}
              {price.toLocaleString()}
            </span>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">议价 · 联系卖家</div>
        )}
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

  const activeMeta = SECTIONS.find((s) => s.key === active)!;

  return (
    <section className="relative py-16 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 mb-3 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground">
              <Sparkles className="w-3 h-3" /> 每日精选
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              为你精心策展的域名
            </h2>
            <p className="mt-2 text-muted-foreground">{activeMeta.desc}</p>
          </div>
          <Link to="/marketplace">
            <Button variant="outline" className="rounded-full">
              查看全部
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = s.key === active;
            return (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-foreground border-border hover:border-primary/40 hover:bg-accent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {s.label}
              </button>
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
            {active !== 'ai' ? (
              isLoading ? (
                <SkeletonCardGrid count={8} />
              ) : items.length ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                  {items.map((d, i) => (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: Math.min(i, 8) * 0.04 }}
                    >
                      <CompactDomainCard
                        domain={d.name}
                        price={d.price}
                        currency={d.currency}
                        href={`/domain/${encodeURIComponent(d.name)}`}
                        badge={
                          active === 'trending'
                            ? '热搜'
                            : active === 'premium'
                              ? '精品'
                              : '即将截止'
                        }
                        badgeTone={active === 'expiring' ? 'warning' : active === 'premium' ? 'primary' : 'success'}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-14 text-muted-foreground rounded-2xl border border-border bg-card">
                  暂无数据
                </div>
              )
            ) : (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                  {aiNames.map((a, i) => (
                    <motion.div
                      key={a.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: Math.min(i, 8) * 0.04 }}
                    >
                      <CompactDomainCard
                        domain={a.name}
                        price={a.est}
                        currency="CNY"
                        badge="AI 生成"
                        badgeTone="primary"
                        href={`/marketplace?search=${encodeURIComponent(a.name)}`}
                      />
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setActive('ai')}
                  >
                    <Wand2 className="w-4 h-4 mr-1.5" />
                    再生成一组
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
