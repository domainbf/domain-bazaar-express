
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Domain, DomainPriceHistory } from '@/types/domain';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Share2, 
  Heart, 
  MessageSquare, 
  Eye, 
  Calendar,
  DollarSign,
  TrendingUp,
  Globe,
  Star,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { DomainOfferForm } from '@/components/domain/DomainOfferForm';
import { PriceHistoryChart } from '@/components/domain/PriceHistoryChart';
import { SimilarDomainsGrid } from '@/components/domain/SimilarDomainsGrid';
import { DomainShareButtons } from '@/components/domain/DomainShareButtons';
import { DomainAnalytics } from '@/components/domain/DomainAnalytics';

export const DomainDetailPage: React.FC = () => {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate = useNavigate();
  const [domain, setDomain] = useState<Domain | null>(null);
  const [priceHistory, setPriceHistory] = useState<DomainPriceHistory[]>([]);
  const [similarDomains, setSimilarDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (domainId) {
      loadDomainDetails();
      logDomainView();
    }
  }, [domainId]);

  const loadDomainDetails = async () => {
    if (!domainId) return;

    setIsLoading(true);
    try {
      // 加载域名详情
      const { data: domainData, error: domainError } = await supabase
        .from('domain_listings')
        .select(`
          *,
          domain_analytics(views, favorites, offers),
          profiles(username, full_name, avatar_url, seller_rating)
        `)
        .eq('id', domainId)
        .single();

      if (domainError) {
        console.error('Error loading domain:', domainError);
        toast.error('域名不存在或已被删除');
        navigate('/marketplace');
        return;
      }

      // 处理域名数据，确保类型正确
      const processedDomain: Domain = {
        id: domainData.id,
        name: domainData.name,
        price: Number(domainData.price),
        category: domainData.category,
        description: domainData.description,
        status: domainData.status,
        highlight: domainData.highlight,
        owner_id: domainData.owner_id,
        created_at: domainData.created_at,
        is_verified: domainData.is_verified,
        verification_status: domainData.verification_status,
        views: 0
      };

      // 处理 analytics 数据
      if (domainData.domain_analytics && Array.isArray(domainData.domain_analytics)) {
        const analytics = domainData.domain_analytics[0];
        if (analytics) {
          processedDomain.views = analytics.views || 0;
        }
      }

      setDomain(processedDomain);

      // 加载价格历史
      const { data: priceHistoryData } = await supabase
        .from('domain_price_history')
        .select('*')
        .eq('domain_id', domainId)
        .order('created_at', { ascending: true });

      setPriceHistory(priceHistoryData || []);

      // 加载相似域名
      await loadSimilarDomains(processedDomain.name, processedDomain.category);

      // 更新浏览量
      await updateDomainViews();

    } catch (error) {
      console.error('Error loading domain details:', error);
      toast.error('加载域名详情失败');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSimilarDomains = async (domainName: string, category?: string) => {
    try {
      let query = supabase
        .from('domain_listings')
        .select('*')
        .eq('status', 'available')
        .neq('id', domainId)
        .limit(6);

      if (category) {
        query = query.eq('category', category);
      }

      const { data } = await query;
      setSimilarDomains(data || []);
    } catch (error) {
      console.error('Error loading similar domains:', error);
    }
  };

  const updateDomainViews = async () => {
    try {
      const { data: analytics } = await supabase
        .from('domain_analytics')
        .select('views')
        .eq('domain_id', domainId)
        .single();

      if (analytics) {
        await supabase
          .from('domain_analytics')
          .update({ views: (analytics.views || 0) + 1 })
          .eq('domain_id', domainId);
      } else {
        // 如果没有分析记录，创建一个新的
        await supabase
          .from('domain_analytics')
          .insert({ domain_id: domainId, views: 1 });
      }
    } catch (error) {
      console.error('Error updating views:', error);
    }
  };

  const logDomainView = async () => {
    try {
      await supabase.from('user_activities').insert({
        activity_type: 'domain_view',
        resource_id: domainId,
        metadata: {
          domain_name: domain?.name,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error logging domain view:', error);
    }
  };

  const handleFavoriteToggle = async () => {
    // TODO: 实现收藏功能
    setIsFavorited(!isFavorited);
    toast.success(isFavorited ? '已取消收藏' : '已添加收藏');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-48 bg-muted rounded"></div>
              <div className="h-48 bg-muted rounded"></div>
              <div className="h-48 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">域名不存在</h1>
          <Button onClick={() => navigate('/marketplace')}>
            返回市场
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* 域名标题和基本信息 */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {domain.name}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant={domain.is_verified ? "default" : "secondary"}>
                  {domain.is_verified ? (
                    <>
                      <Shield className="h-3 w-3 mr-1" />
                      已验证
                    </>
                  ) : (
                    '待验证'
                  )}
                </Badge>
                <Badge variant="outline">{domain.category}</Badge>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {domain.views || 0} 次浏览
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    0 次收藏
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    0 次报价
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFavoriteToggle}
                className={isFavorited ? "text-red-500" : ""}
              >
                <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
              </Button>
              <DomainShareButtons domainName={domain.name} />
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  ¥{domain.price.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  一口价
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：域名详情 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 域名描述 */}
            {domain.description && (
              <Card>
                <CardHeader>
                  <CardTitle>域名描述</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {domain.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 价格历史图表 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  价格历史
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PriceHistoryChart data={priceHistory} />
              </CardContent>
            </Card>

            {/* 域名分析 */}
            <Card>
              <CardHeader>
                <CardTitle>域名分析</CardTitle>
              </CardHeader>
              <CardContent>
                <DomainAnalytics domainId={domainId || ''} createdAt={domain.created_at} />
              </CardContent>
            </Card>

            {/* 相似域名推荐 */}
            <Card>
              <CardHeader>
                <CardTitle>相似域名推荐</CardTitle>
              </CardHeader>
              <CardContent>
                <SimilarDomainsGrid domains={similarDomains} />
              </CardContent>
            </Card>
          </div>

          {/* 右侧：操作面板 */}
          <div className="space-y-6">
            {/* 购买/报价面板 */}
            <Card>
              <CardHeader>
                <CardTitle>购买选项</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full" 
                  size="lg"
                  disabled={domain.status !== 'available'}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  立即购买 ¥{domain.price.toLocaleString()}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowOfferForm(true)}
                  disabled={domain.status !== 'available'}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  提交报价
                </Button>

                <div className="text-xs text-muted-foreground text-center">
                  所有交易都受到平台保护
                </div>
              </CardContent>
            </Card>

            {/* 域名信息 */}
            <Card>
              <CardHeader>
                <CardTitle>域名信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">域名长度</span>
                  <span>{domain.name.length} 字符</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">创建时间</span>
                  <span>{new Date(domain.created_at || '').toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">状态</span>
                  <Badge variant={domain.status === 'available' ? 'default' : 'secondary'}>
                    {domain.status === 'available' ? '可购买' : '不可用'}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">验证状态</span>
                  <Badge variant={domain.is_verified ? 'default' : 'secondary'}>
                    {domain.is_verified ? '已验证' : domain.verification_status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 报价表单弹窗 */}
      {showOfferForm && (
        <DomainOfferForm
          domain={domain}
          onClose={() => setShowOfferForm(false)}
          onSuccess={() => {
            setShowOfferForm(false);
            loadDomainDetails(); // 重新加载以更新报价数量
          }}
        />
      )}
    </div>
  );
};
