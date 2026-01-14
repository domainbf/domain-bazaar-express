import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Heart, ExternalLink, Trash2, RefreshCw, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

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

  const loadFavorites = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          id,
          domain_id,
          created_at,
          domains:domain_id (
            id,
            name,
            price,
            category,
            status,
            is_featured
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform and filter valid favorites
      const validFavorites = (data || [])
        .filter(item => item.domains)
        .map(item => ({
          id: item.id,
          domain_id: item.domain_id,
          created_at: item.created_at,
          domain: {
            id: (item.domains as any)?.id || item.domain_id,
            name: (item.domains as any)?.name || 'Unknown',
            price: (item.domains as any)?.price || 0,
            category: (item.domains as any)?.category || 'standard',
            status: (item.domains as any)?.status || 'available',
            is_verified: Boolean((item.domains as any)?.is_featured)
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

  const getCategoryBadge = (category: string) => {
    const categoryMap: Record<string, { label: string; className: string }> = {
      premium: { label: '高级', className: 'bg-purple-100 text-purple-800' },
      standard: { label: '标准', className: 'bg-gray-100 text-gray-800' },
      short: { label: '短域名', className: 'bg-blue-100 text-blue-800' },
      brandable: { label: '品牌', className: 'bg-green-100 text-green-800' },
      dev: { label: '开发', className: 'bg-orange-100 text-orange-800' }
    };
    return categoryMap[category] || { label: category, className: 'bg-gray-100 text-gray-800' };
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

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">暂无收藏</h3>
            <p className="text-muted-foreground mb-4">
              浏览市场，收藏您感兴趣的域名
            </p>
            <Link to="/marketplace">
              <Button>
                <ShoppingCart className="h-4 w-4 mr-2" />
                浏览域名市场
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((favorite) => {
            const categoryInfo = getCategoryBadge(favorite.domain.category);
            return (
              <Card key={favorite.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{favorite.domain.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={categoryInfo.className}>
                          {categoryInfo.label}
                        </Badge>
                        {favorite.domain.is_verified && (
                          <Badge className="bg-green-100 text-green-800">已验证</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFavorite(favorite.id, favorite.domain.name)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
                    <Link to={`/domain/${favorite.domain.name}`}>
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
