import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Domain } from '@/types/domain';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Shield, Eye, Tag, Star, ArrowRight, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiGet, apiPost, apiDelete } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DomainListingsProps {
  domains: Domain[];
  isLoading: boolean;
  isMobile?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  premium: '精品', standard: '标准', short: '短域名',
  brandable: '品牌', dev: '技术', numeric: '数字',
  business: '商业', keyword: '关键词',
};

const FavoriteButton = ({ domainId }: { domainId: string }) => {
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

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      data-testid={`button-favorite-${domainId}`}
      className={`h-8 w-8 flex items-center justify-center rounded-full transition-all shrink-0
        ${isFavorited
          ? 'text-red-500'
          : 'text-muted-foreground/30 group-hover:text-muted-foreground/60 hover:text-red-400'
        }`}
      aria-label={isFavorited ? '取消收藏' : '收藏'}
    >
      <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
    </button>
  );
};

const DomainRow = ({ domain, index }: { domain: Domain; index: number }) => {
  const categoryLabel = domain.category ? (CATEGORY_LABELS[domain.category] || domain.category) : null;
  const hasViews = typeof domain.views === 'number' && domain.views > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.03, 0.24) }}
    >
      <Link
        to={`/domain/${encodeURIComponent(domain.name)}`}
        className="group block"
        data-testid={`link-domain-row-${domain.id}`}
      >
        <div className={`
          relative px-4 py-4 bg-card
          border-b border-border
          transition-colors duration-150
          hover:bg-muted/40
          ${domain.highlight ? 'border-l-2 border-l-foreground' : ''}
        `}>
          {/* Featured top stripe */}
          {domain.highlight && (
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-foreground/10" />
          )}

          {/* Row 1: Domain name + arrow */}
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <h3 className={`
              font-black uppercase tracking-tight leading-none text-foreground break-all
              group-hover:text-primary transition-colors duration-150
              text-2xl sm:text-3xl
            `}>
              {domain.name}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150" />
              <FavoriteButton domainId={domain.id} />
            </div>
          </div>

          {/* Row 2: Price + badges */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xl font-bold text-foreground tabular-nums">
              {domain.price > 0 ? `¥${domain.price.toLocaleString()}` : '¥0'}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {domain.highlight && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-foreground text-background">
                  <Star className="h-2.5 w-2.5 fill-current" />精选
                </span>
              )}
              {domain.is_verified && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full border border-foreground/20 text-foreground/70">
                  <Shield className="h-2.5 w-2.5" />已验证
                </span>
              )}
            </div>
          </div>

          {/* Row 3: Category + views */}
          {(categoryLabel || hasViews) && (
            <div className="flex items-center gap-3">
              {categoryLabel && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Tag className="h-2.5 w-2.5" />
                  {categoryLabel}
                </span>
              )}
              {hasViews && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Eye className="h-2.5 w-2.5" />
                  {domain.views}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export const DomainListings = ({ domains, isLoading, isMobile }: DomainListingsProps) => {
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

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      {domains.map((domain, i) => (
        <DomainRow key={domain.id} domain={domain} index={i} />
      ))}
    </div>
  );
};
