import { Link } from 'react-router-dom';
import { Domain } from '@/types/domain';
import { Heart, Shield, Eye, ArrowUpRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CURRENCY_SYMBOL: Record<string, string> = {
  CNY: '¥', USD: '$', EUR: '€', GBP: '£', JPY: '¥', HKD: 'HK$',
  SGD: 'S$', AUD: 'A$', CAD: 'C$', KRW: '₩', TWD: 'NT$',
};

const formatPrice = (d: Domain) => {
  const sym = CURRENCY_SYMBOL[(d.currency || 'CNY').toUpperCase()] || '¥';
  return d.price > 0 ? `${sym}${d.price.toLocaleString()}` : `${sym}0`;
};

export const DomainListRow = ({ domain, index }: { domain: Domain; index: number }) => {
  const { user } = useAuth();
  const { isFavorited, toggle, toggling } = useFavorites();
  const fav = isFavorited(domain.id);

  const onFav = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast.error('请先登录后再收藏'); return; }
    toggle(domain.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.02, 0.2) }}
    >
      <Link
        to={`/domain/${encodeURIComponent(domain.name)}`}
        data-testid={`row-domain-${domain.id}`}
        className={cn(
          'group flex items-center gap-4 px-4 py-3.5 rounded-xl',
          'border border-border/60 bg-card hover:bg-muted/40',
          'transition-colors',
        )}
      >
        {/* Wordmark */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-base sm:text-lg text-foreground truncate uppercase tracking-tight">
              {domain.name}
            </span>
            {domain.highlight && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
                <Star className="h-2.5 w-2.5 fill-current" />精选
              </span>
            )}
            {domain.is_verified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                <Shield className="h-2.5 w-2.5" />已验证
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            {(domain.views ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3 w-3" />{domain.views}
              </span>
            )}
            {domain.category && <span className="capitalize">{domain.category}</span>}
            {domain.description && <span className="truncate max-w-[240px] hidden sm:inline">— {domain.description}</span>}
          </div>
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">一口价</p>
          <p className="font-bold text-lg text-foreground tabular-nums">{formatPrice(domain)}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onFav}
            disabled={toggling}
            aria-label={fav ? '取消收藏' : '收藏'}
            className={cn(
              'h-8 w-8 flex items-center justify-center rounded-full border border-border/60',
              fav ? 'text-red-500 bg-red-500/10 border-red-500/40' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Heart className={cn('h-4 w-4', fav && 'fill-current')} />
          </button>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            查看 <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
};
