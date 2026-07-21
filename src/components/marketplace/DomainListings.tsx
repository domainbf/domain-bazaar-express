import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Domain } from '@/types/domain';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Shield, Eye, Tag, Star, ArrowUpRight, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiGet, apiPost, apiDelete } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export type MarketplaceLayout = 'card' | 'bento' | 'magazine' | 'masonry';

export interface DomainListingsProps {
  domains: Domain[];
  isLoading: boolean;
  isMobile?: boolean;
  layout?: MarketplaceLayout;
}

const CATEGORY_LABELS: Record<string, string> = {
  premium: '精品', standard: '标准', short: '短域名',
  brandable: '品牌', dev: '技术', numeric: '数字',
  business: '商业', keyword: '关键词',
};

const CURRENCY_SYMBOL: Record<string, string> = {
  CNY: '¥', USD: '$', EUR: '€', GBP: '£', JPY: '¥', HKD: 'HK$',
  SGD: 'S$', AUD: 'A$', CAD: 'C$', KRW: '₩', TWD: 'NT$', THB: '฿',
};

const formatPrice = (d: Domain) => {
  const sym = CURRENCY_SYMBOL[(d.currency || 'CNY').toUpperCase()] || '¥';
  return d.price > 0 ? `${sym}${d.price.toLocaleString()}` : `${sym}0`;
};

// ─── Favorite button (shared) ───────────────────────────────────────────────
const FavoriteButton = ({ domainId, size = 'md' }: { domainId: string; size?: 'sm' | 'md' }) => {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user || !domainId) return;
    apiGet<{ domain_id: string }[]>('/data/favorites')
      .then(favs => { if (favs.some(f => f.domain_id === domainId)) setIsFavorited(true); })
      .catch(() => {});
  }, [user?.id, domainId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('请先登录后再收藏'); return; }
    setIsLoading(true);
    try {
      if (isFavorited) {
        await apiDelete(`/data/favorites/${domainId}`);
        setIsFavorited(false);
        toast.success('已取消收藏');
      } else {
        await apiPost('/data/favorites', { domain_id: domainId });
        setIsFavorited(true);
        toast.success('已添加到收藏');
      }
    } catch (error: any) {
      toast.error(error.message || '操作失败');
    } finally {
      setIsLoading(false);
    }
  };

  const dim = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
  const icon = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      data-testid={`button-favorite-${domainId}`}
      className={cn(
        dim,
        'flex items-center justify-center rounded-full transition-all shrink-0',
        isFavorited
          ? 'text-red-500'
          : 'text-muted-foreground/40 group-hover:text-muted-foreground/70 hover:text-red-400',
      )}
      aria-label={isFavorited ? '取消收藏' : '收藏'}
    >
      <Heart className={cn(icon, isFavorited && 'fill-current')} />
    </button>
  );
};

// ─── Shared badges ──────────────────────────────────────────────────────────
const Badges = ({ domain, compact = false }: { domain: Domain; compact?: boolean }) => {
  const categoryLabel = domain.category ? (CATEGORY_LABELS[domain.category] || domain.category) : null;
  const hasViews = typeof domain.views === 'number' && domain.views > 0;
  const size = compact ? 'text-[10px]' : 'text-[11px]';
  return (
    <div className={cn('flex items-center gap-2 text-muted-foreground', size)}>
      {categoryLabel && (
        <span className="inline-flex items-center gap-1"><Tag className="h-2.5 w-2.5" />{categoryLabel}</span>
      )}
      {hasViews && (
        <span className="inline-flex items-center gap-1"><Eye className="h-2.5 w-2.5" />{domain.views}</span>
      )}
      {domain.is_verified && (
        <span className="inline-flex items-center gap-1"><Shield className="h-2.5 w-2.5" />已验证</span>
      )}
    </div>
  );
};

// ─── Framer-motion wrapper ──────────────────────────────────────────────────
const CardMotion = ({ i, children }: { i: number; children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: Math.min(i * 0.025, 0.2) }}
  >
    {children}
  </motion.div>
);

// ─── Card variant (uniform card grid) ──────────────────────────────────────
const UniformCard = ({ domain, index }: { domain: Domain; index: number }) => (
  <CardMotion i={index}>
    <Link
      to={`/domain/${encodeURIComponent(domain.name)}`}
      data-testid={`card-uniform-${domain.id}`}
      className={cn(
        'group relative flex flex-col justify-between h-full',
        'rounded-2xl border border-border bg-card p-5',
        'transition-all duration-200 hover:border-foreground/40 hover:shadow-[0_8px_30px_-8px_hsl(var(--foreground)/0.12)]',
        domain.highlight && 'bg-foreground text-background border-foreground',
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-6">
        <span className={cn(
          'text-[10px] font-medium px-2 py-0.5 rounded-full',
          domain.highlight ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground',
        )}>
          {domain.highlight ? '★ 精选' : (CATEGORY_LABELS[domain.category || ''] || '标准')}
        </span>
        <FavoriteButton domainId={domain.id} size="sm" />
      </div>
      <h3 className={cn(
        'font-black uppercase tracking-tight leading-none break-all mb-3',
        domain.name.length > 16 ? 'text-lg' : 'text-2xl',
      )}>
        {domain.name}
      </h3>
      <div className="flex items-end justify-between">
        <span className="text-xl font-bold tabular-nums">{formatPrice(domain)}</span>
        <ArrowUpRight className={cn(
          'h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
          domain.highlight ? 'text-background/70' : 'text-muted-foreground/50',
        )} />
      </div>
    </Link>
  </CardMotion>
);

// ─── Bento — 1 hero (col-span-2) + normal cards ────────────────────────────
const BentoCard = ({ domain, index, hero }: { domain: Domain; index: number; hero?: boolean }) => (
  <CardMotion i={index}>
    <Link
      to={`/domain/${encodeURIComponent(domain.name)}`}
      data-testid={`card-bento-${domain.id}`}
      className={cn(
        'group relative flex flex-col justify-between h-full rounded-2xl border p-5 transition-all duration-200',
        hero
          ? 'bg-foreground text-background border-foreground sm:col-span-2 sm:row-span-2 min-h-[220px] p-6'
          : 'bg-card border-border hover:border-foreground/40 hover:shadow-[0_8px_30px_-8px_hsl(var(--foreground)/0.12)]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn(
          'text-[10px] font-medium px-2 py-0.5 rounded-full',
          hero ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground',
        )}>
          {hero ? '★ 头条精选' : (CATEGORY_LABELS[domain.category || ''] || '标准')}
        </span>
        <FavoriteButton domainId={domain.id} size="sm" />
      </div>
      <h3 className={cn(
        'font-black uppercase tracking-tight leading-none break-all',
        hero ? 'text-4xl sm:text-5xl my-6' : (domain.name.length > 16 ? 'text-base' : 'text-xl'),
        !hero && 'my-3',
      )}>
        {domain.name}
      </h3>
      <div className="flex items-end justify-between">
        <span className={cn('font-bold tabular-nums', hero ? 'text-3xl' : 'text-lg')}>
          {formatPrice(domain)}
        </span>
        {hero && <Badges domain={domain} />}
        <ArrowUpRight className={cn(
          hero ? 'hidden' : 'h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
        )} />
      </div>
    </Link>
  </CardMotion>
);

// ─── Magazine — hero row + grid ─────────────────────────────────────────────
const MagazineHero = ({ domain, index }: { domain: Domain; index: number }) => (
  <CardMotion i={index}>
    <Link
      to={`/domain/${encodeURIComponent(domain.name)}`}
      data-testid={`card-magazine-hero-${domain.id}`}
      className="group relative block rounded-3xl border border-foreground/10 bg-gradient-to-br from-foreground to-foreground/80 text-background p-8 sm:p-12 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-[0.08]" style={{
        backgroundImage: 'radial-gradient(circle at 30% 20%, currentColor 1px, transparent 1px)',
        backgroundSize: '18px 18px',
      }} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-[10px] uppercase tracking-widest font-bold bg-background/20 text-background px-2 py-1 rounded-full">
            <Star className="inline h-2.5 w-2.5 fill-current mr-1" />本期头条
          </span>
          <FavoriteButton domainId={domain.id} size="sm" />
        </div>
        <h2 className={cn(
          'font-black uppercase tracking-tight leading-[0.9] break-all mb-6',
          domain.name.length > 22 ? 'text-3xl sm:text-5xl' : 'text-5xl sm:text-7xl',
        )}>
          {domain.name}
        </h2>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-[11px] opacity-60 uppercase tracking-widest mb-1">一口价</p>
            <p className="text-3xl sm:text-4xl font-bold tabular-nums">{formatPrice(domain)}</p>
          </div>
          <div className="inline-flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all">
            立即查看 <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  </CardMotion>
);

const MagazineCard = ({ domain, index }: { domain: Domain; index: number }) => (
  <CardMotion i={index}>
    <Link
      to={`/domain/${encodeURIComponent(domain.name)}`}
      data-testid={`card-magazine-${domain.id}`}
      className="group flex flex-col justify-between h-full rounded-2xl border border-border bg-card p-4 transition-all hover:border-foreground/40 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <Badges domain={domain} compact />
        <FavoriteButton domainId={domain.id} size="sm" />
      </div>
      <h3 className={cn(
        'font-black uppercase tracking-tight leading-none break-all mb-3',
        domain.name.length > 18 ? 'text-base' : 'text-xl',
      )}>
        {domain.name}
      </h3>
      <div className="flex items-center justify-between">
        <span className="text-base font-bold tabular-nums">{formatPrice(domain)}</span>
        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </Link>
  </CardMotion>
);

// ─── Masonry — variable height cards ────────────────────────────────────────
const MasonryCard = ({ domain, index }: { domain: Domain; index: number }) => {
  const isTall = index % 4 === 0 || domain.highlight;
  return (
    <CardMotion i={index}>
      <Link
        to={`/domain/${encodeURIComponent(domain.name)}`}
        data-testid={`card-masonry-${domain.id}`}
        className={cn(
          'group block break-inside-avoid mb-3 rounded-2xl border p-5 transition-all',
          domain.highlight
            ? 'bg-foreground text-background border-foreground'
            : 'bg-card border-border hover:border-foreground/40',
          isTall && 'py-8',
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-4">
          <span className={cn(
            'text-[10px] font-medium px-2 py-0.5 rounded-full',
            domain.highlight ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground',
          )}>
            {domain.highlight ? '★ 精选' : (CATEGORY_LABELS[domain.category || ''] || '标准')}
          </span>
          <FavoriteButton domainId={domain.id} size="sm" />
        </div>
        <h3 className={cn(
          'font-black uppercase tracking-tight leading-none break-all mb-3',
          isTall ? 'text-3xl' : (domain.name.length > 16 ? 'text-lg' : 'text-2xl'),
        )}>
          {domain.name}
        </h3>
        <div className="flex items-center justify-between">
          <span className={cn('font-bold tabular-nums', isTall ? 'text-xl' : 'text-base')}>
            {formatPrice(domain)}
          </span>
          <ArrowUpRight className={cn(
            'h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
            domain.highlight ? 'text-background/70' : 'text-muted-foreground/50',
          )} />
        </div>
        {isTall && !domain.highlight && (
          <div className="mt-4 pt-4 border-t border-border">
            <Badges domain={domain} compact />
          </div>
        )}
      </Link>
    </CardMotion>
  );
};

// ─── Main ────────────────────────────────────────────────────────────────────
export const DomainListings = ({ domains, isLoading, isMobile, layout = 'card' }: DomainListingsProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (domains.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-2xl font-bold text-foreground mb-2">没有找到域名</h3>
        <p className="text-muted-foreground">尝试调整筛选条件或搜索不同的关键词</p>
      </div>
    );
  }

  if (layout === 'card') {
    return (
      <div className={cn('grid gap-3', isMobile ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4')}>
        {domains.map((d, i) => <UniformCard key={d.id} domain={d} index={i} />)}
      </div>
    );
  }

  if (layout === 'bento') {
    return (
      <div className={cn('grid gap-3 auto-rows-[minmax(140px,auto)]', isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4')}>
        {domains.map((d, i) => (
          <BentoCard key={d.id} domain={d} index={i} hero={i === 0} />
        ))}
      </div>
    );
  }

  if (layout === 'magazine') {
    const [hero, ...rest] = domains;
    return (
      <div className="space-y-3">
        {hero && <MagazineHero domain={hero} index={0} />}
        {rest.length > 0 && (
          <div className={cn('grid gap-3', isMobile ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4')}>
            {rest.map((d, i) => <MagazineCard key={d.id} domain={d} index={i + 1} />)}
          </div>
        )}
      </div>
    );
  }

  // masonry
  return (
    <div className={cn('gap-3', isMobile ? 'columns-1 sm:columns-2' : 'columns-2 md:columns-3 lg:columns-4')}>
      {domains.map((d, i) => <MasonryCard key={d.id} domain={d} index={i} />)}
    </div>
  );
};
