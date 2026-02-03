import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { DomainOfferForm } from './domain/DomainOfferForm';
import { Badge } from './ui/badge';
import { Heart, ExternalLink, Eye, Shield } from 'lucide-react';
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
  views = 0
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

  // Check if domain is favorited
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

        if (!error && data) {
          setIsFavorited(true);
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    checkFavorite();
  }, [user, domainId]);

  // Check if user is authenticated when dialog opens
  const handleOpenDialog = async () => {
    try {
      // Check authentication
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      
      // If domain ID or seller ID is not provided, fetch it
      if (!domainId || !sellerId) {
        console.log('Fetching domain info for:', domain);
        const { data: domainData, error } = await supabase
          .from('domain_listings')
          .select('id, owner_id')
          .eq('name', domain)
          .single();
          
        if (error) {
          console.error('Error fetching domain info:', error);
          throw error;
        }
          
        if (domainData) {
          console.log('Domain data fetched:', domainData);
          setDomainInfo({
            id: domainData.id,
            ownerId: domainData.owner_id
          });
        }
      }
      
      // Open dialog after setting data
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error preparing offer dialog:', error);
      // Still open dialog but might show error inside
      setIsDialogOpen(true);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('请先登录后再收藏');
      return;
    }

    if (!domainId && !domainInfo.id) {
      toast.error('无法获取域名信息');
      return;
    }

    const targetDomainId = domainId || domainInfo.id;
    setIsLoadingFavorite(true);

    try {
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('domain_id', targetDomainId);

        if (error) throw error;
        setIsFavorited(false);
        toast.success('已取消收藏');
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            domain_id: targetDomainId
          });

        if (error) throw error;
        setIsFavorited(true);
        toast.success('已添加到收藏');
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast.error(error.message || '操作失败');
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      premium: '高级',
      standard: '标准',
      short: '短域名',
      brandable: '品牌',
      dev: '开发',
      numeric: '数字'
    };
    return labels[cat] || cat;
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 group ${highlight ? 'border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-white' : 'border border-gray-200 bg-white'}`}>
      {/* Top decorative bar */}
      <div className={`h-1 w-full ${highlight ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gradient-to-r from-blue-400 to-purple-400'}`}></div>

      {/* Top badges row */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {highlight && (
            <Badge className="bg-yellow-400 text-yellow-900 font-bold">⭐ 精选</Badge>
          )}
          {isVerified && (
            <Badge className="bg-green-500 text-white gap-1 font-semibold">
              <Shield className="h-3 w-3" />
              已验证
            </Badge>
          )}
        </div>

        {/* Favorite button */}
        <Button
          variant="ghost"
          size="icon"
          className={`h-9 w-9 rounded-full transition-all ${
            isFavorited
              ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
              : 'text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100'
          }`}
          onClick={handleToggleFavorite}
          disabled={isLoadingFavorite}
        >
          <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
        </Button>
      </div>

      <div className="flex flex-col items-center justify-between h-full space-y-4 p-6 pt-16">
        {/* 域名显示 - 加大字体 */}
        <Link to={`/domain/${domain}`} className="w-full text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 hover:text-blue-600 transition-colors break-words line-clamp-3">
            {domain}
          </h3>
        </Link>

        {/* 价格 */}
        {price !== undefined && (
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">起价</p>
            <span className="text-3xl md:text-4xl font-bold text-gray-900">
              {typeof price === 'number' ? `¥${price.toLocaleString()}` : price}
            </span>
          </div>
        )}

        {/* 分类和浏览量 */}
        <div className="flex items-center gap-2 flex-wrap justify-center w-full">
          {category && (
            <Badge variant="secondary" className="text-xs font-semibold bg-blue-100 text-blue-800">
              {getCategoryLabel(category)}
            </Badge>
          )}
          {views > 0 && (
            <Badge variant="outline" className="text-xs gap-1 font-semibold">
              <Eye className="h-3 w-3" />
              {views} 次浏览
            </Badge>
          )}
        </div>
        
        {description && (
          <p className="text-sm text-gray-600 text-center line-clamp-2">
            {description}
          </p>
        )}
        
        <div className="w-full pt-2 flex gap-2">
          {isSold ? (
            <span className="w-full text-center px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold">
              已售出
            </span>
          ) : (
            <>
              <Link to={`/domain/${domain}`} className="flex-1">
                <Button variant="outline" className="w-full" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  详情
                </Button>
              </Link>
              <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)}>
                <DialogTrigger asChild>
                  <Button 
                    className="flex-1 bg-black text-white hover:bg-gray-800"
                    size="sm"
                    onClick={handleOpenDialog}
                  >
                    报价
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white border-gray-200 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center text-gray-900">
                      {domain} - 提交报价
                    </DialogTitle>
                  </DialogHeader>
                  <DomainOfferForm 
                    domain={domain}
                    domainId={domainInfo.id}
                    sellerId={domainInfo.ownerId}
                    onClose={() => setIsDialogOpen(false)}
                    isAuthenticated={isAuthenticated}
                  />
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
