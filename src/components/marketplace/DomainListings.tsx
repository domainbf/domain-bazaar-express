import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Domain } from '@/types/domain';
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Shield, Eye, Tag, Star, ArrowRight, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DomainListingsProps {
  domains: Domain[];
  isLoading: boolean;
  isMobile?: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: Math.min(i * 0.04, 0.28),
      duration: 0.38,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const getCategoryLabel = (cat: string) => {
  const labels: Record<string, string> = {
    premium: '精品', standard: '标准', short: '短域名',
    brandable: '品牌', dev: '技术', numeric: '数字',
    business: '商业', keyword: '关键词',
  };
  return labels[cat] || cat;
};

const getCategoryColor = (cat: string) => {
  const colors: Record<string, string> = {
    premium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    short: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    brandable: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    business: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    dev: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
    numeric: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
    keyword: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  };
  return colors[cat] || 'bg-muted text-muted-foreground';
};

const FavoriteButton = ({ domainId }: { domainId: string }) => {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user || !domainId) return;
    supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('domain_id', domainId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setIsFavorited(true);
      });
  }, [user, domainId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('请先登录后再收藏'); return; }
    setIsLoading(true);
    try {
      if (isFavorited) {
        await supabase.from('user_favorites').delete()
          .eq('user_id', user.id).eq('domain_id', domainId);
        setIsFavorited(false);
        toast.success('已取消收藏');
      } else {
        await supabase.from('user_favorites').insert({
          user_id: user.id, domain_id: domainId
        });
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
    <Button
      variant="ghost"
      size="icon"
      className={`h-7 w-7 rounded-full transition-all ${
        isFavorited
          ? 'text-destructive hover:text-destructive/80 hover:bg-destructive/10'
          : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100'
      }`}
      onClick={handleToggle}
      disabled={isLoading}
    >
      <Heart className={`h-3.5 w-3.5 ${isFavorited ? 'fill-current' : ''}`} />
    </Button>
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
    <div className="space-y-5">
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
        {domains.map((domain, i) => (
          <motion.div
            key={domain.id}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Link 
              to={`/domain/${encodeURIComponent(domain.name)}`}
              className="group block h-full"
            >
              <div className={`relative h-full border rounded-xl overflow-hidden
                transition-all duration-200 ease-out
                hover:shadow-md hover:-translate-y-0.5
                ${domain.highlight 
                  ? 'border-primary/30 bg-card shadow-sm' 
                  : 'border-border bg-card'
                }`}>
                
                {domain.highlight && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
                )}

                {/* Favorite button */}
                <div className="absolute top-3 right-3 z-10">
                  <FavoriteButton domainId={domain.id} />
                </div>

                <div className="px-5 pt-4 pb-3">
                  {/* Row 1: Domain name */}
                  <div className="flex items-end justify-between mb-3 pr-8">
                    <h3 className="text-3xl sm:text-4xl font-black text-foreground uppercase tracking-tight leading-none
                      transition-colors duration-150 group-hover:text-primary break-all">
                      {domain.name}
                    </h3>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150 shrink-0 mb-1" />
                  </div>

                  {/* Row 2: Price + badges */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-foreground">
                      ${domain.price?.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {domain.is_verified && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 gap-0.5 border-primary/40 text-primary">
                          <Shield className="h-2.5 w-2.5" />已验证
                        </Badge>
                      )}
                      {domain.highlight && (
                        <Badge className="bg-foreground text-background text-[10px] px-1.5 py-0 h-5 gap-0.5">
                          <Star className="h-2.5 w-2.5" />精选
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-border/60 px-5 py-2 flex items-center justify-between bg-muted/20">
                  <div className="flex items-center gap-2">
                    {domain.category && (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${getCategoryColor(domain.category)}`}>
                        <Tag className="h-2.5 w-2.5" />
                        {getCategoryLabel(domain.category)}
                      </span>
                    )}
                    {domain.views !== undefined && domain.views > 0 && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" />{domain.views}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
