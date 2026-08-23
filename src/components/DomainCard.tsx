import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { DomainOfferForm } from './domain/DomainOfferForm';
import { Badge } from './ui/badge';
import { Heart, Shield, Copy, Check } from 'lucide-react';
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
  searchQuery?: string;
  onQuickView?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  premium: '高级', standard: '标准', short: '短域名',
  brandable: '品牌', dev: '开发', numeric: '数字',
};

import { formatPrice } from '@/lib/currency';

// 高亮搜索匹配的部分
function HighlightedText({ text, query }: { text: string; query?: string }) {
  if (!query?.trim()) return <>{text}</>;
  const q = query.trim().toLowerCase();
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-warning/70  text-foreground rounded px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export const DomainCard = ({
  domain, price, currency = 'CNY', highlight, isSold = false, domainId, sellerId,
  category, description, isVerified = false, index = 0, searchQuery, onQuickView,
}: DomainCardProps) => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [heartKey, setHeartKey] = useState(0);
  const [copied, setCopied] = useState(false);
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

  const wordmarkSize =
    domain.length <= 8 ? 'text-4xl sm:text-5xl'
    : domain.length <= 12 ? 'text-3xl sm:text-4xl'
    : domain.length <= 16 ? 'text-2xl sm:text-3xl'
    : domain.length <= 20 ? 'text-xl sm:text-2xl'
    : domain.length <= 26 ? 'text-lg sm:text-xl'
    : 'text-base';

  const wordmark = (
    <h3
      className={`font-black text-foreground uppercase tracking-tight leading-[1.02] break-all transition-colors duration-150 group-hover:text-primary ${wordmarkSize}`}
      title={domain}
    >
      <HighlightedText text={domain} query={searchQuery} />
    </h3>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.05, 0.3) }}
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card p-1.5 shadow-card transition-[box-shadow,border-color] duration-300 hover:shadow-elegant hover:border-primary/40
        ${highlight ? 'border-foreground/40' : 'border-border'}
        ${isSold ? 'opacity-60' : ''}`}
      style={{ willChange: 'transform' }}
    >
      {/* Ink accent bar */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-foreground/80 via-primary to-foreground/80"
      />

      {/* Dashed inner frame */}
      <div className="relative flex flex-1 flex-col rounded-xl border border-dashed border-border px-3.5 pb-4 pt-3 sm:px-5 sm:pt-3.5">
        {/* Top row: badges + actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {highlight && (
              <Badge className="bg-foreground text-background text-[10px] px-2 py-0.5 tracking-wider">精选</Badge>
            )}
            {isVerified && (
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 gap-0.5 tracking-wider">
                <Shield className="h-2.5 w-2.5" />已验证
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="h-9 w-9 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
              onClick={async (e) => {
                e.preventDefault(); e.stopPropagation();
                try {
                  await navigator.clipboard.writeText(domain);
                  setCopied(true);
                  toast.success(`已复制 ${domain}`);
                  setTimeout(() => setCopied(false), 1500);
                } catch { toast.error('复制失败'); }
              }}
              aria-label="复制域名"
              data-testid={`button-copy-${domainId}`}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              key={heartKey}
              className={`h-9 w-9 sm:h-8 sm:w-8 rounded-full flex items-center justify-center transition-all
                ${isFavorited
                  ? 'text-destructive hover:bg-destructive/10'
                  : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'}
                ${heartKey > 0 ? 'animate-heart' : ''}`}
              onClick={handleToggleFavorite}
              disabled={isLoadingFavorite}
              aria-label={isFavorited ? '取消收藏' : '收藏'}
              data-testid={`button-favorite-${domainId}`}
            >
              <Heart className={`h-3.5 w-3.5 ${isFavorited ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Eyebrow */}
        <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          {category ? (CATEGORY_LABELS[category] || category) : '优质域名'}
        </p>

        {/* Wordmark */}
        <div className="mt-2 text-center">
          {onQuickView ? (
            <button
              type="button"
              onClick={onQuickView}
              className="block w-full text-center"
              data-testid={`button-quickview-${domainId}`}
            >
              {wordmark}
            </button>
          ) : (
            <Link to={getDomainDetailPath(domain)} className="block w-full text-center">
              {wordmark}
            </Link>
          )}
        </div>

        {/* Price */}
        {price !== undefined && (
          <p className="mt-2.5 text-center text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground tabular-nums">
            一口价 · {typeof price === 'number' ? formatPrice(price, currency) : price}
          </p>
        )}

        {description && (
          <p className="mt-2 text-center text-xs leading-relaxed text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}

        {/* Actions */}
        <div className="mt-auto w-full pt-4 sm:pt-5 flex gap-2">
          {isSold ? (
            <span className="w-full text-center px-4 py-2.5 rounded-full bg-muted text-muted-foreground font-semibold text-sm">
              已售出
            </span>
          ) : (
            <>
              <Link to={getDomainDetailPath(domain)} className="flex-1" data-testid={`link-domain-detail-${domainId}`}>
                <Button
                  className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90 border-0 text-xs h-11 sm:h-9"
                  size="sm"
                >
                  查看详情 ›
                </Button>
              </Link>
              <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full border-border text-xs h-11 sm:h-9 hover:bg-muted"
                    size="sm"
                    onClick={handleOpenDialog}
                    data-testid={`button-offer-${domainId}`}
                  >
                    报价
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background border-border max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center text-foreground">
                      {domain} - 提交报价
                    </DialogTitle>
                  </DialogHeader>
                  <DomainOfferForm
                    domain={domain} domainId={domainInfo.id} sellerId={domainInfo.ownerId}
                    initialCurrency={currency}
                    listingPrice={typeof price === 'number' ? price : undefined}
                    listingCurrency={currency}
                    onClose={() => setIsDialogOpen(false)} isAuthenticated={isAuthenticated}
                  />
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>

        {!isSold && (
          <p className="mt-3 text-center text-[10px] text-muted-foreground/80">
            平台安全托管 · 过户完成后放款
          </p>
        )}
      </div>
    </motion.div>
  );
};
