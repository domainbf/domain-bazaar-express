import { Search, Sparkles, ArrowRight, Zap, Shield, TrendingUp, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useHomeData } from '@/hooks/useHomeData';
import { motion, AnimatePresence } from 'framer-motion';
import { BulkCheckDialog } from '@/components/search/BulkCheckDialog';

const POPULAR_TLDS = ['.com', '.ai', '.io', '.co', '.app', '.dev', '.xyz', '.net'];

const PRICE_RANGES = [
  { key: 'any', label: '全部价格', min: 0, max: undefined },
  { key: 'lt1k', label: '< ¥1,000', min: 0, max: 1000 },
  { key: '1k5k', label: '¥1k – 5k', min: 1000, max: 5000 },
  { key: '5k20k', label: '¥5k – 20k', min: 5000, max: 20000 },
  { key: 'gt20k', label: '> ¥20,000', min: 20000, max: undefined },
];

export const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTld, setSelectedTld] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('any');
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();
  const { config } = useSiteSettings();
  const { data: homeData } = useHomeData();
  const wrapRef = useRef<HTMLDivElement>(null);

  // close suggestions on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Instant suggestions
  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const pool = homeData?.hotDomains ?? [];
    if (!q) return pool.slice(0, 5);
    return pool
      .filter((d) => d.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [searchQuery, homeData?.hotDomains]);

  // Related domains (same base, different TLDs)
  const relatedDomains = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.includes('.')) return [];
    return POPULAR_TLDS.slice(0, 5).map((tld) => `${q}${tld}`);
  }, [searchQuery]);

  const buildSearchUrl = (overrideQ?: string) => {
    const params = new URLSearchParams();
    const q = (overrideQ ?? searchQuery).trim();
    if (q) params.set('search', q);
    if (selectedTld) params.set('tld', selectedTld);
    const range = PRICE_RANGES.find((r) => r.key === priceRange);
    if (range?.min) params.set('minPrice', String(range.min));
    if (range?.max) params.set('maxPrice', String(range.max));
    return `/marketplace${params.toString() ? `?${params.toString()}` : ''}`;
  };

  const handleSearch = (q?: string) => navigate(buildSearchUrl(q));
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') setFocused(false);
  };

  return (
    <section className="relative overflow-hidden pt-16 md:pt-24 pb-16 md:pb-20 px-4">
      {/* Ambient aurora */}
      <div className="absolute inset-0 pointer-events-none select-none hero-aurora" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 85%)',
        }}
      />

      <div className="relative max-w-5xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium backdrop-blur-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          精选域名 · AI 智能估值 · 安全托管交易
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-5 md:mb-6 leading-[1.05]"
        >
          <span className="text-foreground">{config.hero_title || '寻找完美的'}</span>{' '}
          <span className="gradient-text">域名</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 md:mb-12"
        >
          {config.hero_subtitle || '从数千个精选域名中发现下一个属于你的品牌。'}
        </motion.p>

        {/* ── Massive search bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="max-w-3xl mx-auto"
          ref={wrapRef}
        >
          <div
            className={`relative flex items-center gap-2 p-2 rounded-2xl bg-card border transition-all duration-300 ${
              focused
                ? 'border-primary shadow-elegant ring-4 ring-primary/10'
                : 'border-border shadow-card'
            }`}
          >
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder={config.hero_search_placeholder || '搜索域名，如 brand.com'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onKeyDown={handleKeyDown}
              className="h-14 md:h-16 flex-1 pl-14 md:pl-16 pr-2 border-0 bg-transparent text-base md:text-lg font-medium shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              data-testid="input-hero-search"
              autoComplete="off"
            />
            <Button
              onClick={() => handleSearch()}
              className="h-12 md:h-14 px-6 md:px-8 rounded-xl bg-gradient-primary text-primary-foreground border-0 font-semibold text-sm md:text-base transition-all hover:shadow-elegant hover:-translate-y-0.5 active:scale-[0.98]"
              data-testid="button-hero-search"
            >
              搜索
              <ArrowRight className="w-4 h-4 ml-1.5 hidden sm:inline" />
            </Button>

            {/* Suggestions dropdown */}
            <AnimatePresence>
              {focused && (suggestions.length > 0 || relatedDomains.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="absolute top-full left-0 right-0 mt-3 rounded-2xl border border-border bg-popover shadow-elegant overflow-hidden z-30 text-left"
                >
                  {suggestions.length > 0 && (
                    <div className="p-2">
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        即刻可购
                      </div>
                      {suggestions.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => navigate(`/domain/${encodeURIComponent(d.name)}`)}
                          className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors group"
                        >
                          <span className="font-medium text-foreground truncate">{d.name}</span>
                          <span className="flex items-center gap-2 shrink-0">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">
                              可售
                            </span>
                            <span className="text-sm font-semibold text-foreground tabular-nums">
                              {d.currency === 'USD' ? '$' : '¥'}
                              {d.price.toLocaleString()}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {relatedDomains.length > 0 && (
                    <div className="p-2 border-t border-border">
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        相关建议
                      </div>
                      <div className="flex flex-wrap gap-1.5 px-2 py-1">
                        {relatedDomains.map((r) => (
                          <button
                            key={r}
                            onClick={() => handleSearch(r)}
                            className="text-xs font-mono font-medium px-2.5 py-1.5 rounded-md border border-border bg-background hover:border-primary/40 hover:bg-accent transition-colors"
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* TLD quick filters */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">后缀:</span>
            <button
              onClick={() => setSelectedTld('')}
              className={`text-xs font-mono font-semibold px-3 py-1.5 rounded-full border transition-all ${
                selectedTld === ''
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-foreground border-border hover:border-primary/40'
              }`}
            >
              全部
            </button>
            {POPULAR_TLDS.map((tld) => (
              <button
                key={tld}
                onClick={() => setSelectedTld(selectedTld === tld ? '' : tld)}
                className={`text-xs font-mono font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  selectedTld === tld
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-foreground border-border hover:border-primary/40'
                }`}
              >
                {tld}
              </button>
            ))}
          </div>

          {/* Price range */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">价格:</span>
            {PRICE_RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setPriceRange(r.key)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                  priceRange === r.key
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-foreground border-border hover:border-primary/40'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Bulk check trigger */}
          <div className="mt-4 flex justify-center">
            <BulkCheckDialog
              trigger={
                <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground hover:text-foreground">
                  <ListChecks className="w-3.5 h-3.5" />
                  批量检查多个域名
                </Button>
              }
            />
          </div>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-10 md:mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs md:text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-success" />
            <span>担保交易</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span>秒级过户</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span>AI 智能估值</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>多币种支持</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
