import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Upload, CheckCircle2, TrendingUp, ShieldCheck, BarChart3, MessageSquare,
  Handshake, Star, DollarSign, Eye, Heart, Gavel, ArrowUpRight, Package,
  Inbox,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserStats } from '@/hooks/useUserStats';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const STEPS = [
  { step: '01', icon: Upload, title: '注册并完善资料', desc: '注册账号，填写卖家信息，通过身份认证获得"已认证卖家"徽章，提升买家信任。' },
  { step: '02', icon: CheckCircle2, title: '提交域名上架', desc: '填写域名基本信息、定价策略，选择固定价格或接受报价模式，一键上架到市场。' },
  { step: '03', icon: ShieldCheck, title: '完成所有权验证', desc: '通过 DNS TXT 记录验证域名所有权，获得"已认证"标识，成交率平均提升 40%。' },
  { step: '04', icon: Handshake, title: '接受报价完成交易', desc: '买家发起报价后通过消息沟通，接受报价后进入资金托管流程，安全完成交割。' },
];

const BENEFITS = [
  { icon: TrendingUp, title: '千人级买家曝光', desc: '平台持续增长的注册买家基础，域名第一天上架即开始曝光。' },
  { icon: BarChart3, title: '数据分析看板', desc: '实时查看浏览量、收藏量、报价数，用数据优化你的定价策略。' },
  { icon: MessageSquare, title: '内置消息系统', desc: '与买家直接沟通，交易记录全程留存，沟通有凭有据。' },
  { icon: Star, title: '卖家评分体系', desc: '每笔成功交易积累卖家评分，评分越高域名展示权重越高。' },
];

/* ---------------- Anonymous landing (existing) ---------------- */
const AnonymousLanding = () => {
  const navigate = useNavigate();
  return (
    <>
      <section className="pt-16 pb-10 px-4 text-center border-b border-border/50">
        <div className="max-w-3xl mx-auto">
          <Badge variant="secondary" className="mb-4">卖家专区</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">开始出售域名</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            最快 5 分钟上架你的域名，触达真实买家，安全完成每一笔交易。
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')}>
              <Upload className="h-4 w-4 mr-2" />立即上架域名
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/sell')}>了解详情</Button>
          </div>
        </div>
      </section>
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-center mb-2">四步开启卖家旅程</h2>
          <p className="text-muted-foreground text-center text-sm mb-8">简单流程，轻松完成域名变现</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {STEPS.map((s) => (
              <div key={s.step} className="bg-card rounded-xl border border-border p-6 flex gap-4">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-primary">{s.step}</span>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-12 px-4 bg-muted/30 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-center mb-8">卖家专属权益</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {BENEFITS.map((b) => (
              <div key={b.title} className="bg-card rounded-xl border border-border p-5 text-center">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mb-3">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{b.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

/* ---------------- Seller dashboard (signed-in) ---------------- */
interface DomainRow { id: string; name: string; price: number; currency: string | null; status: string | null; views?: number | null; created_at: string; }
interface OfferRow { id: string; amount: number; currency: string | null; status: string | null; created_at: string; domain: { name: string } | null; }
interface MessageRow { id: string; content: string; created_at: string; sender_id: string | null; is_read: boolean | null; domain: { name: string } | null; }

const CUR_SYM: Record<string, string> = { CNY: '¥', USD: '$', EUR: '€', HKD: 'HK$', GBP: '£' };
const formatMoney = (v: number, c?: string | null) => `${CUR_SYM[(c || 'CNY').toUpperCase()] || '¥'}${(v || 0).toLocaleString()}`;

const StatCard = ({ icon: Icon, label, value, hint, color = 'text-primary' }: any) => (
  <Card className="border-border/60">
    <CardContent className="p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <div className={`h-8 w-8 rounded-lg bg-muted/40 flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
    </CardContent>
  </Card>
);

const SellerDashboard = ({ userId }: { userId: string }) => {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useUserStats(userId);
  const [listings, setListings] = useState<DomainRow[]>([]);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: dList }, { data: oList }, { data: mList }] = await Promise.all([
        supabase.from('domain_listings')
          .select('id,name,price,currency,status,created_at')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false })
          .limit(6),
        supabase.from('domain_offers' as any)
          .select('id,amount,currency,status,created_at,domain:domain_listings(name)')
          .eq('seller_id', userId)
          .order('created_at', { ascending: false })
          .limit(5) as any,
        supabase.from('messages')
          .select('id,content,created_at,sender_id,is_read,domain:domain_listings(name)')
          .eq('receiver_id', userId)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);
      if (cancelled) return;

      // Enrich listings with view counts via analytics (best-effort).
      const ids = (dList ?? []).map((d: any) => d.id);
      let viewsMap: Record<string, number> = {};
      if (ids.length) {
        const { data: analytics } = await supabase
          .from('domain_analytics')
          .select('domain_id,views')
          .in('domain_id', ids);
        (analytics ?? []).forEach((a: any) => { viewsMap[a.domain_id] = Number(a.views) || 0; });
      }
      setListings((dList ?? []).map((d: any) => ({ ...d, views: viewsMap[d.id] || 0 })));
      setOffers((oList ?? []) as OfferRow[]);
      setMessages((mList ?? []) as MessageRow[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const pendingOffers = offers.filter(o => (o.status || 'pending') === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge variant="secondary" className="mb-2">卖家控制台</Badge>
          <h1 className="text-2xl md:text-3xl font-bold">您的销售概览</h1>
          <p className="text-sm text-muted-foreground mt-1">
            实时追踪上架、报价、买家消息，一键管理您的域名资产
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/user-center?tab=domains&new=1')} data-testid="seller-cta-new">
            <Upload className="h-4 w-4 mr-1.5" />上架新域名
          </Button>
          <Button variant="outline" onClick={() => navigate('/bulk-listing')}>批量上架</Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <StatCard icon={Package} label="总域名" value={stats?.totalDomains ?? 0}
              hint={`在售 ${stats?.activeListings ?? 0}`} color="text-blue-600" />
            <StatCard icon={DollarSign} label="总估值 (CNY)" value={`¥${(stats?.totalValue ?? 0).toLocaleString()}`}
              hint="按当前定价合计" color="text-emerald-600" />
            <StatCard icon={Eye} label="总浏览" value={(stats?.totalViews ?? 0).toLocaleString()}
              hint={`收藏 ${stats?.totalFavorites ?? 0}`} color="text-violet-600" />
            <StatCard icon={Handshake} label="报价 · 成交" value={`${stats?.totalOffers ?? 0} · ${stats?.completedTransactions ?? 0}`}
              hint={pendingOffers ? `${pendingOffers} 待处理` : '暂无待处理'} color="text-amber-600" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active listings */}
        <Card className="lg:col-span-2 border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" /> 我的在售域名
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/portfolio')}>
                全部管理 <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
            ) : listings.length === 0 ? (
              <div className="text-center py-10">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground mb-3">还没有上架任何域名</p>
                <Button size="sm" onClick={() => navigate('/user-center?tab=domains&new=1')}>立即上架</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {listings.map(d => (
                  <button
                    key={d.id}
                    onClick={() => navigate(`/domain/${encodeURIComponent(d.name)}`)}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors text-left"
                    data-testid={`seller-listing-${d.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm uppercase truncate">{d.name}</p>
                        <Badge
                          variant="outline"
                          className={
                            d.status === 'available' ? 'text-emerald-600 border-emerald-500/40 text-[10px]' :
                            d.status === 'reserved' ? 'text-amber-600 border-amber-500/40 text-[10px]' :
                            'text-muted-foreground text-[10px]'
                          }
                        >
                          {d.status === 'available' ? '在售' : d.status === 'reserved' ? '预留' : (d.status || '—')}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span className="inline-flex items-center gap-0.5"><Eye className="h-3 w-3" />{d.views ?? 0}</span>
                        <span>·</span>
                        <span>{formatDistanceToNow(new Date(d.created_at), { locale: zhCN, addSuffix: true })}</span>
                      </p>
                    </div>
                    <p className="font-bold text-sm tabular-nums shrink-0">{formatMoney(d.price, d.currency)}</p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent offers */}
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Gavel className="h-4 w-4" /> 最新报价
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/user-center?tab=offers')}>
                全部 <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
            ) : offers.length === 0 ? (
              <div className="text-center py-8">
                <Inbox className="h-7 w-7 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">还没有收到报价</p>
              </div>
            ) : (
              <div className="space-y-2">
                {offers.map(o => (
                  <div key={o.id} className="p-3 rounded-lg border border-border/60 bg-muted/20">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold uppercase truncate">{o.domain?.name || '域名'}</p>
                      <Badge variant={o.status === 'pending' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                        {o.status === 'pending' ? '待处理' : o.status === 'accepted' ? '已接受' : o.status === 'rejected' ? '已拒绝' : (o.status || '—')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-primary tabular-nums">{formatMoney(o.amount, o.currency)}</span>
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(o.created_at), { locale: zhCN, addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Messages */}
      <Card className="border-border/60">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> 最新买家消息
              {messages.some(m => !m.is_read) && (
                <Badge className="text-[10px] h-4 px-1.5">新</Badge>
              )}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/user-center?tab=messages')}>
              全部消息 <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-7 w-7 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">还没有买家消息</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-2">
              {messages.map(m => (
                <div key={m.id} className={`p-3 rounded-lg border ${m.is_read ? 'border-border/60 bg-background' : 'border-primary/40 bg-primary/5'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold uppercase truncate">{m.domain?.name || '关于域名'}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(m.created_at), { locale: zhCN, addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{m.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default function SellerPage() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {user ? <SellerDashboard userId={user.id} /> : <AnonymousLanding />}
      </main>
      <Footer />
    </div>
  );
}
