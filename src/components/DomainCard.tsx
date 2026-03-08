import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { DomainOfferForm } from './domain/DomainOfferForm';
import { Badge } from './ui/badge';
import { Heart, Shield, Eye, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface DomainCardProps {
  domain: string;
  price?: number | string;
  highlight?: boolean;
  isSold?: boolean;
  domainId?: string;
  sellerId?: string;
  category?: string;
  description?: string;
  isVerified?: boolean;
  views?: number;
}

export const DomainCard = ({ 
  domain, 
  price, 
  highlight, 
  isSold = false, 
  domainId, 
  sellerId,
  category,
  description,
  isVerified = false,
  views,
}: DomainCardProps) => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [domainInfo, setDomainInfo] = useState<{id?: string; ownerId?: string}>({
    id: domainId,
    ownerId: sellerId
  });

  useEffect(() => {
    const checkFavorite = async () => {
      if (!user || !domainId) return;
      try {
        const { data, error } = await supabase
          .from('user_favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('domain_id', domainId)
          .maybeSingle();
        if (!error && data) setIsFavorited(true);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };
    checkFavorite();
  }, [user, domainId]);

  const handleOpenDialog = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      
      if (!domainId || !sellerId) {
        const { data: domainData, error } = await supabase
          .from('domain_listings')
          .select('id, owner_id')
          .eq('name', domain)
          .single();
        if (!error && domainData) {
          setDomainInfo({ id: domainData.id, ownerId: domainData.owner_id });
        }
      }
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error preparing offer dialog:', error);
      setIsDialogOpen(true);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('请先登录后再收藏'); return; }
    const targetDomainId = domainId || domainInfo.id;
    if (!targetDomainId) { toast.error('无法获取域名信息'); return; }
    setIsLoadingFavorite(true);
    try {
      if (isFavorited) {
        const { error } = await supabase.from('user_favorites').delete()
          .eq('user_id', user.id).eq('domain_id', targetDomainId);
        if (error) throw error;
        setIsFavorited(false);
        toast.success('已取消收藏');
      } else {
        const { error } = await supabase.from('user_favorites').insert({
          user_id: user.id, domain_id: targetDomainId
        });
        if (error) throw error;
        setIsFavorited(true);
        toast.success('已添加到收藏');
      }
    } catch (error: any) {
      toast.error(error.message || '操作失败');
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      premium: '高级', standard: '标准', short: '短域名',
      brandable: '品牌', dev: '开发', numeric: '数字'
    };
    return labels[cat] || cat;
  };

  // Split domain into name and extension
  const dotIndex = domain.indexOf('.');
  const domainName = dotIndex > 0 ? domain.substring(0, dotIndex) : domain;
  const domainExt = dotIndex > 0 ? domain.substring(dotIndex) : '';

  return (
    <div className={`relative border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group ${
      highlight ? 'border-foreground/30 border-2 bg-card shadow-md' : 'border-border bg-card'
    }`}>
      {/* Top bar: badges + favorite */}
      <div className="flex items-center justify-between px-4 pt-3 pb-0">
        <div className="flex items-center gap-1.5">
          {isVerified && (
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 gap-0.5">
              <Shield className="h-2.5 w-2.5" />已验证
            </Badge>
          )}
          {highlight && (
            <Badge className="bg-foreground text-background text-[10px] px-2 py-0.5">精选</Badge>
          )}
        </div>
        <Button
          variant="ghost" size="icon"
          className={`h-7 w-7 rounded-full transition-all ${
            isFavorited ? 'text-destructive hover:text-destructive/80 hover:bg-destructive/10' 
            : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100'
          }`}
          onClick={handleToggleFavorite}
          disabled={isLoadingFavorite}
        >
          <Heart className={`h-3.5 w-3.5 ${isFavorited ? 'fill-current' : ''}`} />
        </Button>
      </div>

      {/* Main content area */}
      <Link to={`/domain/${domain}`} className="block px-4 py-3">
        {/* Domain name - left aligned, large */}
        <div className="flex items-baseline gap-0.5">
          <h3 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight leading-none hover:text-primary transition-colors">
            {domainName}
          </h3>
          <span className="text-lg sm:text-xl font-bold text-muted-foreground uppercase">
            {domainExt}
          </span>
        </div>

        {/* Price */}
        {price !== undefined && (
          <div className="mt-2">
            <span className="text-xl font-bold text-foreground">
              {typeof price === 'number' ? `$${price.toLocaleString()}` : price}
            </span>
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-1.5">
            {description}
          </p>
        )}
      </Link>

      {/* Bottom bar: meta info + actions */}
      <div className="border-t border-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-muted-foreground">
          {category && (
            <span className="flex items-center gap-1 text-[11px]">
              <Tag className="h-3 w-3" />
              {getCategoryLabel(category)}
            </span>
          )}
          {views !== undefined && views > 0 && (
            <span className="flex items-center gap-1 text-[11px]">
              <Eye className="h-3 w-3" />
              {views}
            </span>
          )}
        </div>

        {isSold ? (
          <Badge variant="secondary" className="text-[11px]">已售出</Badge>
        ) : (
          <div className="flex items-center gap-1.5">
            <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-foreground text-background hover:bg-foreground/90 text-[11px] h-7 px-3 rounded-md" 
                  size="sm" 
                  onClick={handleOpenDialog}
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
                  onClose={() => setIsDialogOpen(false)} isAuthenticated={isAuthenticated}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
};
