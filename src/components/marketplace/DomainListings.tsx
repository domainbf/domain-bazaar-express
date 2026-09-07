import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Domain } from '@/types/domain';
import { Star, ArrowUpRight, Heart, Shield, Eye, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DomainListRow } from './DomainListRow';
import { formatPrice as formatCurrencyPrice } from '@/lib/currency';

// Kept for backwards compatibility — layout choice is now purely a density hint.
export type MarketplaceLayout = 'card' | 'bento' | 'magazine' | 'masonry';
export type MarketplaceView = 'grid' | 'list';

export interface DomainListingsProps {
  domains: Domain[];
  isLoading: boolean;
  isMobile?: boolean;
  /** Density preset — 'featured' shows a large hero row; 'grid' is uniform. Default 'featured'. */
  layout?: MarketplaceLayout;
  /** Grid (cards) vs list (dense rows). Default 'grid'. */
  view?: MarketplaceView;
  /** When provided, cards open the drawer instead of navigating to the detail page. */
  onSelect?: (domain: Domain, index: number) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  premium: '精品', standard: '标准', short: '短域名',
  brandable: '品牌', dev: '技术', numeric: '数字',
  business: '商业', keyword: '关键词',
};

const formatPrice = (d: Domain) => {
  return d.price > 0 ? formatCurrencyPrice(d.price, d.currency) : '面议';
};

// Auto-shrink domain text so long names never overflow the card.
const domainTextSize = (name: string, hero: boolean) => {
  const len = name.length;
  if (hero) {
    if (len <= 10) return 'text-5xl sm:text-7xl';
    if (len <= 16) return 'text-4xl sm:text-6xl';
    if (len <= 22) return 'text-3xl sm:text-5xl';
    return 'text-2xl sm:text-4xl';
  }
  if (len <= 8)  return 'text-3xl sm:text-4xl';
  if (len <= 14) return 'text-2xl sm:text-3xl';
  if (len <= 20) return 'text-xl sm:text-2xl';
  return 'text-base sm:text-lg';
};

// ─── Favorite heart (shared, uses global favorites cache) ────────────────────
const FavoriteHeart = ({ domainId, onDark }: { domainId: string; onDark?: boolean }) => {
  const { user } = useAuth();
  const { isFavorited, toggle, toggling } = useFavorites();
  const active = isFavorited(domainId);
  const handle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('请先登录后再收藏'); return; }
    toggle(domainId);
  };
  return (
    <button
      type="button"
      onClick={handle}
      disabled={toggling}
      data-testid={`button-favorite-${domainId}`}
      aria-label={active ? '取消收藏' : '收藏'}
      className={cn(
        'h-8 w-8 shrink-0 flex items-center justify-center rounded-full transition-colors backdrop-blur-sm',
        onDark ? 'bg-invert-foreground/10 hover:bg-invert-foreground/20' : 'bg-muted hover:bg-accent',
        active
          ? 'text-destructive'
          : onDark
            ? 'text-invert-foreground/60 hover:text-invert-foreground'
            : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Heart className={cn('h-4 w-4', active && 'fill-current')} />
    </button>
  );
};

// ─── The one and only card style ────────────────────────────────────────────
interface CardProps {
  domain: Domain;
  index: number;
  variant?: 'lead' | 'side' | 'index';
  onSelect?: (d: Domain, i: number) => void;
}

const HeroStyleCard = ({ domain, index, variant = 'index', onSelect }: CardProps) => {
  const isLead = variant === 'lead';
  const isSide = variant === 'side';
  const isFeatured = !!(isLead || domain.highlight);
  const categoryLabel = domain.category ? (CATEGORY_LABELS[domain.category] || domain.category) : '标准';
  const badgeText = isLead ? '本期头条' : (domain.highlight ? '精选' : categoryLabel);
  const onDark = isSide;
  const fg = onDark ? 'text-invert-foreground' : 'text-foreground';
  const fgSoft = onDark ? 'text-invert-foreground/60' : 'text-muted-foreground';

  const inner = (
    <>
      <div className={cn(
        'relative flex h-full flex-col text-left',
        isLead ? 'p-6 md:p-10' : 'p-5 md:p-6',
      )}>
        {/* Top: index + favorite */}
        <div className="flex items-start justify-between gap-2">
          <span className={cn(
            'inline-flex items-center gap-2 font-sans text-[10px] font-semibold uppercase',
            isLead ? 'bg-signal px-3 py-1 text-signal-foreground' : fgSoft,
          )}>
            {!isLead && <span className={cn('font-editorial text-lg italic leading-none', fgSoft)}>{String(index + 1).padStart(2, '0')}</span>}
            {isLead && <Star className="h-2.5 w-2.5 fill-current" />}
            {badgeText}
          </span>
          <FavoriteHeart domainId={domain.id} onDark={onDark} />
        </div>

        {/* Domain wordmark */}
        <h3 className={cn(
          'break-all font-editorial font-normal leading-[0.94]',
          'transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none',
          fg,
          isLead ? domainTextSize(domain.name, true) : isSide ? 'mt-16 text-4xl sm:text-5xl' : 'mt-10 text-3xl sm:text-4xl',
        )}>
          {domain.name}
        </h3>

        {/* Price */}
        <div className={cn('mt-auto pt-6', isLead ? 'space-y-6' : 'space-y-4')}>
          <div className="flex items-center gap-4">
            <span className={cn('h-px w-10', onDark ? 'bg-invert-foreground/30' : 'bg-foreground')} />
            <p className={cn('font-sans text-sm font-semibold tabular-nums', isLead ? 'text-base' : '', fgSoft)}>{formatPrice(domain)}</p>
          </div>

          {/* CTA strip */}
          <span className={cn(
            'flex items-center justify-between border-t pt-3 font-sans text-[10px] font-semibold transition-colors',
            onDark ? 'border-invert-foreground/10 text-invert-foreground/50 group-hover:text-signal' : 'border-border text-muted-foreground group-hover:text-foreground',
          )}>
            <span>查看详情</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </span>
        </div>

        {/* Meta strip */}
        <div className={cn('mt-3 flex flex-wrap items-center gap-3 font-sans text-[10px]', fgSoft)}>
          {(domain.views ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1"><Eye className="h-2.5 w-2.5" />{domain.views}</span>
          )}
          <span className="inline-flex items-center gap-1"><Tag className="h-2.5 w-2.5" />{categoryLabel}</span>
          {domain.is_verified && (
            <span className="inline-flex items-center gap-1 text-success"><Shield className="h-2.5 w-2.5" />已验证</span>
          )}
        </div>
      </div>
    </>
  );

  const wrapperClass = cn(
    'group relative block overflow-hidden isolate bg-card',
    'transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
    onDark ? 'bg-invert text-invert-foreground hover:bg-invert/95' : 'bg-card hover:bg-muted/40',
    isLead ? 'min-h-[360px] md:min-h-[470px]' : isSide ? 'min-h-[220px] md:min-h-[234px]' : 'min-h-[180px]',
  );



  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.03, 0.24) }}
      className="h-full"
    >
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(domain, index)}
          data-testid={`card-domain-${domain.id}`}
          className={cn(wrapperClass, 'w-full text-left cursor-pointer')}
        >
          {inner}
        </button>
      ) : (
        <Link
          to={`/domain/${encodeURIComponent(domain.name)}`}
          data-testid={`card-domain-${domain.id}`}
          className={wrapperClass}
        >
          {inner}
        </Link>
      )}
    </motion.div>
  );
};

// ─── Skeleton — matches card silhouette, staggered fade for smooth loads ────
const CardSkeleton = ({ hero, i }: { hero?: boolean; i: number }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.2, delay: Math.min(i * 0.04, 0.2) }}
    className={cn(
      'relative overflow-hidden border border-border bg-card',
      hero ? 'p-6 sm:p-8 min-h-[320px] sm:min-h-[420px]' : 'p-5 min-h-[180px]',
    )}
  >
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-5 w-20 rounded-full bg-muted" />
        <div className="h-8 w-8 rounded-full bg-muted" />
      </div>
      <div className={cn('h-10 rounded bg-muted', hero ? 'w-3/4 sm:h-16' : 'w-2/3')} />
      <div className="h-3 w-1/3 rounded bg-muted" />
      <div className="h-7 w-1/2 rounded bg-muted" />
    </div>
  </motion.div>
);

// ─── Main list — one unified style with optional hero row ───────────────────
export const DomainListings = ({ domains, isLoading, isMobile, layout = 'card', view = 'grid', onSelect }: DomainListingsProps) => {
  // The 'magazine' preset places a hero card at the front; every other preset renders uniform cards.
  const showHero = view === 'grid' && (layout === 'magazine' || layout === 'bento');

  const gridClass = isMobile
    ? 'grid grid-cols-1 gap-3'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr';

  const list = useMemo(() => domains, [domains]);

  if (isLoading) {
    if (view === 'list') {
      return (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl border border-border/60 bg-muted/30 animate-pulse" />
          ))}
        </div>
      );
    }
    return (
      <div className={showHero ? 'grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-12' : gridClass}>
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} i={i} hero={showHero && i === 0} />
        ))}
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-2xl font-bold text-foreground mb-2">没有找到域名</h3>
        <p className="text-muted-foreground">尝试调整筛选条件或搜索不同的关键词</p>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className="space-y-2">
        {list.map((d, i) => <DomainListRow key={d.id} domain={d} index={i} />)}
      </div>
    );
  }

  if (showHero) {
    const lead = list[0];
    const side = list.slice(1, 3);
    const rest = list.slice(3);

    if (!lead) return null;

    return (
      <div className="border border-border bg-border">
        <div className="grid gap-px md:grid-cols-12">
          <div className="md:col-span-7">
            <HeroStyleCard domain={lead} index={0} variant="lead" onSelect={onSelect} />
          </div>
          <div className="grid gap-px bg-border md:col-span-5 md:grid-rows-2">
            {side.map((d, i) => (
              <HeroStyleCard key={d.id} domain={d} index={i + 1} variant="side" onSelect={onSelect} />
            ))}
          </div>
        </div>
        {rest.length > 0 && (
          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {rest.map((d, i) => (
              <HeroStyleCard key={d.id} domain={d} index={i + 3} variant="index" onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {list.map((d, i) => (
        <HeroStyleCard
          key={d.id}
          domain={d}
          index={i}
          variant="index"
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};
