import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { DomainOfferForm } from './domain/DomainOfferForm';
import { Badge } from './ui/badge';
import { Heart, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { getDomainDetailPath } from '@/lib/domainRouting';

interface DomainCardProps {
  domain: string;
  price?: number | string;
  currency?: string;
  highlight?: boolean;
  isSold?: boolean;
  domainId?: string;
  sellerId?: string;
  category?: string;
  description?: string;
  isVerified?: boolean;
  views?: number;
  index?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  premium: '高级', standard: '标准', short: '短域名',
  brandable: '品牌', dev: '开发', numeric: '数字',
};

import { formatPrice } from '@/lib/currency';

export const DomainCard = ({
  domain, price, currency = 'CNY', highlight, isSold = false, domainId, sellerId,
  category, description, isVerified = false, index = 0,
}: DomainCardProps) => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [heartKey, setHeartKey] = useState(0);
  const [domainInfo, setDomainInfo] = useState<{id?: string; ownerId?: string}>({
    id: domainId, ownerId: sellerId,
  });

  useEffect(() => {
    const checkFavorite = async () => {
      if (!user || !domainId) return;
      try {
        const { data } = await supabase
          .from('user_favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('domain_id', domainId)
          .limit(1);
        setIsFavorited(Boolean(data?.length));
      } catch (err) { console.error(err); }
    };
    checkFavorite();
  }, [user, domainId]);

  const handleOpenDialog = async () => {
    try {
      setIsAuthenticated(!!user);
      if (!domainId || !sellerId) {
        try {
          const { data: listing } = await supabase
            .from('domain_listings')
            .select('id, owner_id')
            .ilike('name', domain)
            .limit(1)
            .maybeSingle();
          if (listing) setDomainInfo({ id: listing.id, ownerId: listing.owner_id });
        } catch { /* proceed without domain info */ }
      }
      setIsDialogOpen(true);
    } catch (err) {
      console.error(err);
      setIsDialogOpen(true);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('请先登录后再收藏'); return; }
    const targetId = domainId || domainInfo.id;
    if (!targetId) { toast.error('无法获取域名信息'); return; }
    setIsLoadingFavorite(true);
    try {
      if (isFavorited) {
        await supabase.from('user_favorites').delete().eq('user_id', user.id).eq('domain_id', targetId);
        setIsFavorited(false);
        toast.success('已取消收藏');
      } else {
        await supabase.from('user_favorites').insert({ user_id: user.id, domain_id: targetId });
        setIsFavorited(true);
        setHeartKey(k => k + 1);
        toast.success('已添加到收藏');
      }
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.05, 0.3) }}
      className={`relative border rounded-xl p-5 cursor-default group
        ${highlight
          ? 'border-foreground border-2 bg-muted/30 shadow-md'
          : 'border-border bg-card'
        }
        ${isSold ? 'opacity-60' : ''}
      `}
      style={{ willChange: 'transform' }}
    >
      {/* Top row: badges + favorite */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {highlight && (
            <Badge className="bg-foreground text-background text-[10px] px-2 py-0.5">精选</Badge>
          )}
          {isVerified && (
            <Badge className="bg-foreground text-background text-[10px] px-2 py-0.5 gap-0.5">
              <Shield className="h-2.5 w-2.5" />已验证
            </Badge>
          )}
        </div>
        <button
          key={heartKey}
          className={`h-7 w-7 rounded-full flex items-center justify-center transition-all
            ${isFavorited
              ? 'text-red-500 hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-950/30'
              : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100'
            }
            ${heartKey > 0 ? 'animate-heart' : ''}
          `}
          onClick={handleToggleFavorite}
          disabled={isLoadingFavorite}
          aria-label={isFavorited ? '取消收藏' : '收藏'}
          data-testid={`button-favorite-${domainId}`}
        >
          <Heart className={`h-3.5 w-3.5 transition-transform ${isFavorited ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Domain name — visual anchor */}
      <div className="flex flex-col items-center pt-8 pb-2">
        <Link to={getDomainDetailPath(domain)} className="w-full text-center">
          <h3 className="text-4xl sm:text-5xl font-black text-foreground uppercase tracking-tight
            hover:text-primary transition-colors duration-150 leading-none">
            {domain}
          </h3>
        </Link>

        {category && (
          <Badge variant="secondary" className="text-[11px] mt-3 px-3">
            {CATEGORY_LABELS[category] || category}
          </Badge>
        )}

        {price !== undefined && (
          <span className="text-sm text-muted-foreground mt-2.5 font-medium tabular-nums">
            售价 {typeof price === 'number'
              ? `${CURRENCY_SYMBOL[(currency || 'CNY').toUpperCase()] || ''}${price.toLocaleString()}`
              : price}
          </span>
        )}

        {description && (
          <p className="text-xs text-muted-foreground text-center line-clamp-2 mt-2 max-w-[90%]">
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="w-full pt-3 flex gap-2 mt-1">
        {isSold ? (
          <span className="w-full text-center px-4 py-2 rounded-lg bg-muted text-muted-foreground font-semibold text-sm">
            已售出
          </span>
        ) : (
          <>
            <Link to={getDomainDetailPath(domain)} className="flex-1" data-testid={`link-domain-detail-${domainId}`}>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.94 }} className="w-full">
                <Button
                  className="w-full text-xs transition-colors bg-foreground text-background hover:bg-foreground/90 border-0"
                  size="sm"
                >
                  查看详情 →
                </Button>
              </motion.div>
            </Link>
            <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)}>
              <DialogTrigger asChild>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.94 }} className="flex-1">
                  <Button
                    className="w-full bg-foreground text-background hover:bg-foreground/90 text-xs transition-colors border-0"
                    size="sm"
                    onClick={handleOpenDialog}
                    data-testid={`button-offer-${domainId}`}
                  >
                    报价
                  </Button>
                </motion.div>
              </DialogTrigger>
              <DialogContent className="bg-background border-border max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-center text-foreground">
                    {domain} - 提交报价
                  </DialogTitle>
                </DialogHeader>
                <DomainOfferForm
                  domain={domain} domainId={domainInfo.id} sellerId={domainInfo.ownerId}
                  onClose={() => setIsDialogOpen(false)} isAuthenticated={isAuthenticated}
                />
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </motion.div>
  );
};
