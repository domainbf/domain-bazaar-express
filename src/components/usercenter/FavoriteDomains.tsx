import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Heart, ExternalLink, Trash2, RefreshCw, ShoppingCart, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDomainDetailPath } from '@/lib/domainRouting';


interface FavoriteDomain {
  id: string;
  domain_id: string;
  created_at: string;
  domain: {
    id: string;
    name: string;
    price: number;
    category: string;
    status: string;
    is_verified: boolean;
  };
}

export const FavoriteDomains = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);


  const loadFavorites = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          id,
          domain_id,
          created_at,
          domain_listings:domain_id (
            id,
            name,
            price,
            category,
            status,
            is_verified
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // If domains table query fails, try domain_listings
        console.warn('Favorites query error, trying domain_listings:', error);
        const { data: altData, error: altError } = await supabase
          .from('user_favorites')
          .select('id, domain_id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (altError) throw altError;

        // Fetch domain details from domain_listings
        const domainIds = (altData || []).map(f => f.domain_id).filter(Boolean);
        const { data: listingsData } = await supabase
          .from('domain_listings')
          .select('id, name, price, category, status, is_verified')
          .in('id', domainIds);

        const listingsMap = new Map((listingsData || []).map(d => [d.id, d]));
        
        const validFavorites = (altData || [])
          .filter(item => listingsMap.has(item.domain_id))
          .map(item => {
            const domain = listingsMap.get(item.domain_id)!;
            return {
              id: item.id,
              domain_id: item.domain_id,
              created_at: item.created_at,
              domain: {
                id: domain.id,
                name: domain.name,
                price: domain.price,
                category: domain.category || 'standard',
                status: domain.status || 'available',
                is_verified: Boolean(domain.is_verified)
              }
            };
          });

        setFavorites(validFavorites);
        return;
      }

      // Transform and filter valid favorites
      const validFavorites = (data || [])
        .filter(item => item.domain_listings)
        .map(item => ({
          id: item.id,
          domain_id: item.domain_id,
          created_at: item.created_at,
          domain: {
            id: (item.domain_listings as any)?.id || item.domain_id,
            name: (item.domain_listings as any)?.name || 'Unknown',
            price: (item.domain_listings as any)?.price || 0,
            category: (item.domain_listings as any)?.category || 'standard',
            status: (item.domain_listings as any)?.status || 'available',
            is_verified: Boolean((item.domain_listings as any)?.is_verified)
          }
        }));

      setFavorites(validFavorites);
    } catch (error: any) {
      console.error('Error loading favorites:', error);
      toast.error('加载收藏列表失败');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadFavorites();
  };

  const handleRemoveFavorite = async (favoriteId: string, domainName: string) => {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
      toast.success(`已取消收藏 ${domainName}`);
    } catch (error: any) {
      console.error('Error removing favorite:', error);
      toast.error('取消收藏失败');
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected(prev => (prev.size === favorites.length ? new Set() : new Set(favorites.map(f => f.id))));
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    setIsBulkDeleting(true);
    try {
      const { error } = await supabase.from('user_favorites').delete().in('id', ids);
      if (error) throw error;
      setFavorites(prev => prev.filter(f => !selected.has(f.id)));
      setSelected(new Set());
      toast.success(`已取消收藏 ${ids.length} 个域名`);
    } catch (error: any) {
      console.error('Error bulk removing favorites:', error);
      toast.error('批量取消收藏失败');
    } finally {
      setIsBulkDeleting(false);
    }
  };



  const getCategoryBadge = (category: string) => {
    const categoryMap: Record<string, { label: string; className: string }> = {
      premium: { label: '高级', className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400' },
      standard: { label: '标准', className: 'bg-muted text-muted-foreground' },
      short: { label: '短域名', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
      brandable: { label: '品牌', className: 'bg-green-500/10 text-green-700 dark:text-green-400' },
      dev: { label: '开发', className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400' }
    };
    return categoryMap[category] || { label: category, className: 'bg-muted text-muted-foreground' };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500" />
          我的收藏
          <Badge variant="secondary">{favorites.length}</Badge>
        </h2>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {favorites.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={selected.size > 0 && selected.size === favorites.length}
              onCheckedChange={toggleSelectAll}
              aria-label="全选收藏"
            />
            全选
          </label>
          <span className="text-xs text-muted-foreground">已选 {selected.size} / {favorites.length}</span>
          <Button
            variant="destructive"
            size="sm"
            className="ml-auto"
            disabled={selected.size === 0 || isBulkDeleting}
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            {isBulkDeleting ? '删除中…' : `批量取消收藏${selected.size ? ` (${selected.size})` : ''}`}
          </Button>
        </div>
      )}

      {favorites.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Heart className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">还没有收藏任何域名</h3>
            <p className="text-muted-foreground mb-6 text-sm max-w-sm mx-auto">
              在域名卡片或详情页点击 ♥ 即可加入收藏，方便随时比价与跟进报价进度。
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link to="/marketplace">
                <Button>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  浏览域名市场
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  搜索心仪域名
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((favorite) => {
            const categoryInfo = getCategoryBadge(favorite.domain.category);
            const isSelected = selected.has(favorite.id);
            return (
              <Card key={favorite.id} className={`hover:shadow-lg transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        className="mt-1.5"
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(favorite.id)}
                        aria-label={`选择 ${favorite.domain.name}`}
                      />
                      <div>
                        <h3 className="font-semibold text-lg break-all">{favorite.domain.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={categoryInfo.className}>
                            {categoryInfo.label}
                          </Badge>
                          {favorite.domain.is_verified && (
                            <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">已验证</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFavorite(favorite.id, favorite.domain.name)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">价格</p>
                      <p className="text-xl font-bold text-primary">
                        ¥{favorite.domain.price.toLocaleString()}
                      </p>
                    </div>
                    <Link to={getDomainDetailPath(favorite.domain)}>
                      <Button size="sm">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        查看详情
                      </Button>
                    </Link>
                  </div>

                  <p className="text-xs text-muted-foreground mt-3">
                    收藏于 {new Date(favorite.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
