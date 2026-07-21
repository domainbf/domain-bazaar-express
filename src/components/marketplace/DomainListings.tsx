import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Domain } from '@/types/domain';
import { Star, ArrowUpRight, Heart, Shield, Eye, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Kept for backwards compatibility — layout choice is now purely a density hint.
export type MarketplaceLayout = 'card' | 'bento' | 'magazine' | 'masonry';

export interface DomainListingsProps {
  domains: Domain[];
  isLoading: boolean;
  isMobile?: boolean;
  /** Density preset — 'featured' shows a large hero row; 'grid' is uniform. Default 'featured'. */
  layout?: MarketplaceLayout;
  /** When provided, cards open the drawer instead of navigating to the detail page. */
  onSelect?: (domain: Domain, index: number) => void;
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
const FavoriteHeart = ({ domainId }: { domainId: string }) => {
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
        'bg-white/10 hover:bg-white/20',
        active ? 'text-red-400' : 'text-white/60 hover:text-white',
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
  hero?: boolean;
  onSelect?: (d: Domain, i: number) => void;
}

const HeroStyleCard = ({ domain, index, hero, onSelect }: CardProps) => {
  const isFeatured = !!(hero || domain.highlight);
  const categoryLabel = domain.category ? (CATEGORY_LABELS[domain.category] || domain.category) : '标准';
  const badgeText = hero ? '本期头条' : (domain.highlight ? '★ 精选' : categoryLabel);

  const inner = (
    <>
      {/* Dotted pattern overlay */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.10] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 20%, currentColor 1.2px, transparent 1.2px)',
          backgroundSize: hero ? '20px 20px' : '14px 14px',
        }}
      />

      {/* Subtle top-glow highlight */}
      <div
        aria-hidden
        className="absolute -top-32 -right-24 h-64 w-64 rounded-full bg-white/[0.06] blur-3xl pointer-events-none"
      />

      <div className="relative flex flex-col h-full">
        {/* Top: badge + heart */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <span className={cn(
            'inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold',
            'bg-white/10 text-white px-2.5 py-1 rounded-full backdrop-blur-sm',
          )}>
            {hero && <Star className="h-2.5 w-2.5 fill-current" />}
            {badgeText}
          </span>
          <FavoriteHeart domainId={domain.id} />
        </div>

        {/* Domain wordmark */}
        <h3 className={cn(
          'font-black uppercase tracking-tight leading-[0.95] break-all text-white',
          hero ? 'my-6' : 'my-4',
          domainTextSize(domain.name, isFeatured),
        )}>
          {domain.name}
        </h3>

        {/* Bottom: price + CTA */}
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">一口价</p>
            <p className={cn(
              'font-bold tabular-nums text-white',
              hero ? 'text-3xl sm:text-4xl' : 'text-2xl',
            )}>
              {formatPrice(domain)}
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white/80 group-hover:text-white group-hover:gap-2.5 transition-all">
            立即查看 <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Meta strip (only if extra data exists) */}
        {(domain.is_verified || (domain.views ?? 0) > 0) && (
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-3 text-[10px] text-white/50 uppercase tracking-wider">
            <span className="inline-flex items-center gap-1"><Tag className="h-2.5 w-2.5" />{categoryLabel}</span>
            {(domain.views ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1"><Eye className="h-2.5 w-2.5" />{domain.views}</span>
            )}
            {domain.is_verified && (
              <span className="inline-flex items-center gap-1 ml-auto text-emerald-300/80"><Shield className="h-2.5 w-2.5" />已验证</span>
            )}
          </div>
        )}
      </div>
    </>
  );

  const wrapperClass = cn(
    'group relative block overflow-hidden isolate',
    'rounded-2xl border border-white/10',
    'bg-gradient-to-br from-neutral-900 via-neutral-950 to-black text-white',
    'shadow-[0_2px_20px_-8px_rgba(0,0,0,0.4)]',
    'transition-all duration-300',
    'hover:border-white/25 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]',
    hero ? 'p-6 sm:p-8 min-h-[260px] sm:min-h-[300px]' : 'p-5 min-h-[200px]',
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.03, 0.24) }}
      className={hero ? 'sm:col-span-2' : ''}
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
      'relative rounded-2xl border border-white/10 bg-neutral-900/60 overflow-hidden',
      hero ? 'p-6 sm:p-8 min-h-[260px] sm:min-h-[300px] sm:col-span-2' : 'p-5 min-h-[200px]',
    )}
  >
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-5 w-20 rounded-full bg-white/10" />
        <div className="h-8 w-8 rounded-full bg-white/10" />
      </div>
      <div className={cn('h-10 rounded bg-white/10', hero ? 'w-3/4 sm:h-16' : 'w-2/3')} />
      <div className="h-3 w-1/3 rounded bg-white/10" />
      <div className="h-7 w-1/2 rounded bg-white/10" />
    </div>
  </motion.div>
);

// ─── Main list — one unified style with optional hero row ───────────────────
export const DomainListings = ({ domains, isLoading, isMobile, layout = 'card', onSelect }: DomainListingsProps) => {
  // The 'magazine' preset places a hero card at the front; every other preset renders uniform cards.
  const showHero = layout === 'magazine' || layout === 'bento';

  const gridClass = isMobile
    ? 'grid grid-cols-1 gap-4'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr';

  const list = useMemo(() => domains, [domains]);

  if (isLoading) {
    return (
      <div className={gridClass}>
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

  return (
    <div className={gridClass}>
      {list.map((d, i) => (
        <HeroStyleCard
          key={d.id}
          domain={d}
          index={i}
          hero={showHero && i === 0}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};
