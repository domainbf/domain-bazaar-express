import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet } from '@/lib/apiClient';
import { Navbar } from '@/components/Navbar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserProfile, ProfileDomain } from '@/types/userProfile';
import { toast } from 'sonner';
import {
  ArrowLeft, AlertCircle, Star, ShieldCheck, Building2,
  CalendarDays, MessageSquare, Globe, BadgeCheck, Handshake,
  Eye, TrendingUp, Package
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UserReviews } from '@/components/reviews/ReviewSystem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { getDomainDetailPath } from '@/lib/domainRouting';

interface SellerStats {
  totalListings: number;
  totalViews: number;
  completedDeals: number;
}

export const UserProfilePage = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [domains, setDomains] = useState<ProfileDomain[]>([]);
  const [sellerStats, setSellerStats] = useState<SellerStats>({ totalListings: 0, totalViews: 0, completedDeals: 0 });
  const [error, setError] = useState<string | null>(null);
  const [domainSearch, setDomainSearch] = useState('');

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!profileId) return;
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiGet<any>(`/data/profiles/${profileId}`);
        if (!result || !result.profile) { setError('找不到该用户资料'); setIsLoading(false); return; }
        const profileData = result.profile;
        setProfile(profileData);
        setDomains((result.domains || []) as unknown as ProfileDomain[]);
        setSellerStats({
          totalListings: result.stats?.totalListings || 0,
          totalViews: result.stats?.totalViews || 0,
          completedDeals: result.stats?.completedDeals || 0,
        });
      } catch (err: any) {
        console.error('Error loading user profile:', err);
        toast.error('加载用户资料时出错');
        setError('加载用户资料时出错');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [profileId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-12"><LoadingSpinner /></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>{error || '找不到该用户资料'}</AlertDescription>
          </Alert>
          <div className="mt-6">
            <Link to="/"><Button variant="outline" className="flex items-center gap-1"><ArrowLeft className="h-4 w-4" />返回首页</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const initials = profile.full_name ? profile.full_name.slice(0, 2).toUpperCase() : (profile.username?.slice(0, 2).toUpperCase() || 'U');
  const memberSince = formatDistanceToNow(new Date(profile.created_at), { addSuffix: false, locale: zhCN });
  const rating = typeof profile.seller_rating === 'number' ? profile.seller_rating.toFixed(1) : null;

  const filteredDomains = domains.filter(d =>
    !domainSearch || d.name.toLowerCase().includes(domainSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Profile Banner */}
      <div className="bg-muted/30 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            返回市场
          </Link>

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar className="h-20 w-20 border-2 border-border shadow-md">
                <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || ''} />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              {profile.seller_verified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                  <BadgeCheck className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </div>

            {/* Name + Meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold truncate">{profile.full_name || profile.username || '域名卖家'}</h1>
                {profile.seller_verified && (
                  <Badge className="bg-green-500/15 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700 text-xs">
                    <ShieldCheck className="h-3 w-3 mr-1" />已认证卖家
                  </Badge>
                )}
                {profile.is_seller && !profile.seller_verified && (
                  <Badge variant="secondary" className="text-xs">卖家</Badge>
                )}
              </div>

              {profile.username && <p className="text-sm text-muted-foreground mb-2">@{profile.username}</p>}
              {profile.bio && <p className="text-sm text-foreground/80 mb-3 line-clamp-2">{profile.bio}</p>}

              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {profile.company_name && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />{profile.company_name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />加入 {memberSince}前
                </span>
                {rating && (
                  <span className="flex items-center gap-1 text-amber-500 font-medium">
                    <Star className="h-3.5 w-3.5 fill-amber-400" />{rating} 分
                  </span>
                )}
              </div>
            </div>

            {/* Action */}
            <div className="shrink-0">
              <Button asChild size="sm" variant="outline">
                <Link to={`/messages?to=${profile.id}`} className="flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" />联系卖家
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="text-center p-3 bg-background/70 rounded-xl border border-border" data-testid="seller-stat-listings">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">在售域名</span>
              </div>
              <p className="text-2xl font-bold">{sellerStats.totalListings}</p>
            </div>
            <div className="text-center p-3 bg-background/70 rounded-xl border border-border" data-testid="seller-stat-views">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Eye className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">总浏览量</span>
              </div>
              <p className="text-2xl font-bold">{sellerStats.totalViews.toLocaleString()}</p>
            </div>
            <div className="text-center p-3 bg-background/70 rounded-xl border border-border" data-testid="seller-stat-deals">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Handshake className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">成功交易</span>
              </div>
              <p className="text-2xl font-bold">{sellerStats.completedDeals}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Tabs defaultValue="domains">
          <TabsList className="mb-6">
            <TabsTrigger value="domains" data-testid="tab-seller-domains">
              <Globe className="h-4 w-4 mr-1.5" />
              在售域名
              {sellerStats.totalListings > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{sellerStats.totalListings}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reviews" data-testid="tab-seller-reviews">
              <Star className="h-4 w-4 mr-1.5" />
              用户评价
            </TabsTrigger>
          </TabsList>

          <TabsContent value="domains">
            {/* Search */}
            {domains.length > 3 && (
              <div className="relative mb-4 max-w-sm">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="搜索域名..."
                  value={domainSearch}
                  onChange={e => setDomainSearch(e.target.value)}
                  data-testid="input-seller-domain-search"
                />
              </div>
            )}

            {filteredDomains.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-xl">
                <Globe className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <h3 className="text-base font-medium mb-1">该卖家暂无在售域名</h3>
                <p className="text-sm text-muted-foreground mb-4">返回集市浏览更多域名</p>
                <Button asChild variant="outline" size="sm"><Link to="/marketplace">浏览市场</Link></Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDomains.map(domain => (
                  <Link
                    key={domain.id}
                      to={getDomainDetailPath(domain)}
                    data-testid={`seller-domain-${domain.id}`}
                    className="group block rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        {domain.highlight && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-600 border-orange-500/30">精选</Badge>
                        )}
                        {domain.is_verified && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-400 text-green-600">已验证</Badge>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {domain.category || '标准'}
                      </Badge>
                    </div>
                    <p className="font-bold text-base text-foreground group-hover:text-primary transition-colors truncate mb-1">
                      {domain.name}
                    </p>
                    {domain.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{domain.description}</p>
                    )}
                    <p className="font-semibold text-primary">
                      {domain.price > 0 ? `¥${domain.price.toLocaleString()}` : '面议'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            <UserReviews userId={profile.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
