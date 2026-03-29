import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNotifications } from '@/hooks/useNotifications';
import { DomainAuction } from '@/components/auction/DomainAuction';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Gavel, Clock, TrendingUp, Plus, RefreshCw, Timer } from 'lucide-react';
import { DomainAuction as AuctionType } from '@/types/domain';
import { formatDistanceToNow, isPast } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const AuctionSkeleton = () => (
  <Card className="border-border/60">
    <CardContent className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="h-5 w-36 rounded skeleton-shimmer" />
        <div className="h-5 w-16 rounded-full skeleton-shimmer" />
      </div>
      <div className="h-7 w-24 rounded skeleton-shimmer mb-2" />
      <div className="h-4 w-full rounded skeleton-shimmer mb-1" />
      <div className="h-4 w-3/4 rounded skeleton-shimmer" />
    </CardContent>
  </Card>
);

export const AuctionsPage = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState<(AuctionType & { domainName?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState<(AuctionType & { domainName?: string }) | null>(null);
  const [tab, setTab] = useState<'active' | 'ended'>('active');

  const loadAuctions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('domain_auctions')
        .select('*, domain:domain_listings(name)')
        .order('end_time', { ascending: true });

      if (error) throw error;

      const processed = (data ?? []).map((a: any) => ({
        ...a,
        domainName: a.domain?.name ?? '未知域名',
        domain_name: a.domain?.name ?? '未知域名',
        current_price: Number(a.current_price) || Number(a.starting_price) || 0,
        starting_price: Number(a.starting_price) || 0,
        bid_increment: Number(a.bid_increment) || 100,
        total_bids: a.total_bids || 0,
      }));
      setAuctions(processed);
    } catch (e) {
      console.error('Failed to load auctions:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuctions();

    const channel = supabase
      .channel('auctions_public')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'domain_auctions' }, loadAuctions)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadAuctions]);

  const activeAuctions = auctions.filter(a => a.status === 'active' && !isPast(new Date(a.end_time)));
  const endedAuctions = auctions.filter(a => a.status !== 'active' || isPast(new Date(a.end_time)));
  const displayAuctions = tab === 'active' ? activeAuctions : endedAuctions;

  return (
    <div className="min-h-screen bg-background">
      <Navbar unreadCount={unreadCount} />

      <div className={isMobile ? 'pb-20' : ''}>
        {/* Header */}
        <section className={`bg-primary text-primary-foreground ${isMobile ? 'py-8 px-4' : 'py-12'}`}>
          <div className={isMobile ? '' : 'max-w-5xl mx-auto px-6'}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Gavel className="h-6 w-6" />
                  <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold`}>域名竞拍</h1>
                </div>
                <p className="opacity-70 text-sm">实时竞价，公平透明，赢取心仪域名</p>
              </div>
              {user && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-1.5"
                  onClick={() => navigate('/user-center?tab=domains')}
                  data-testid="button-create-auction"
                >
                  <Plus className="h-4 w-4" />
                  {!isMobile && '发起拍卖'}
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Tab Row + Stats */}
        <section className="border-b border-border bg-card">
          <div className={isMobile ? 'px-4 py-3' : 'max-w-5xl mx-auto px-6 py-3'}>
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {(['active', 'ended'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      tab === t ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid={`tab-auction-${t}`}
                  >
                    {t === 'active' ? '进行中' : '已结束'}
                    <span className="ml-1.5 text-xs opacity-70">
                      {t === 'active' ? activeAuctions.length : endedAuctions.length}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={loadAuctions}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="刷新"
                data-testid="button-refresh-auctions"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Content */}
        <div className={isMobile ? 'px-4 py-5' : 'max-w-5xl mx-auto px-6 py-8'}>

          {/* Selected Auction Detail */}
          {selectedAuction && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-lg">{selectedAuction.domainName} — 竞拍详情</h2>
                <button
                  onClick={() => setSelectedAuction(null)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  收起
                </button>
              </div>
              <DomainAuction auction={selectedAuction} onBidPlaced={loadAuctions} />
            </div>
          )}

          {/* Auctions Grid */}
          {isLoading ? (
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
              {[1, 2, 3, 4, 5, 6].map(i => <AuctionSkeleton key={i} />)}
            </div>
          ) : displayAuctions.length === 0 ? (
            <div className="text-center py-20">
              <Gavel className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold mb-2">
                {tab === 'active' ? '暂无进行中的拍卖' : '暂无已结束的拍卖'}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {tab === 'active' ? '成为第一个发起拍卖的卖家吧' : '历史拍卖记录将在这里显示'}
              </p>
              {user && tab === 'active' && (
                <Button size="sm" className="gap-1.5" onClick={() => navigate('/user-center?tab=domains')}>
                  <Plus className="h-4 w-4" />在域名管理中发起拍卖
                </Button>
              )}
            </div>
          ) : (
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
              {displayAuctions.map(auction => {
                const isActive = auction.status === 'active' && !isPast(new Date(auction.end_time));
                const isSelected = selectedAuction?.id === auction.id;
                const endDiff = new Date(auction.end_time).getTime() - Date.now();
                const isUrgent = isActive && endDiff < 3600000; // < 1 hour
                return (
                  <Card
                    key={auction.id}
                    className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 border-border/60 ${
                      isSelected ? 'ring-2 ring-primary shadow-md' : ''
                    } ${isUrgent ? 'border-orange-400/60 dark:border-orange-600/40' : ''}`}
                    onClick={() => setSelectedAuction(isSelected ? null : auction)}
                    data-testid={`card-auction-${auction.id}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-foreground truncate pr-2">{auction.domainName}</h3>
                        {isActive ? (
                          <Badge className={`shrink-0 text-[10px] ${isUrgent ? 'bg-orange-500' : 'bg-primary'}`}>
                            进行中
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="shrink-0 text-[10px]">已结束</Badge>
                        )}
                      </div>

                      <div className="mb-3">
                        <span className="text-xl font-bold text-primary">
                          ¥{auction.current_price.toLocaleString()}
                        </span>
                        {auction.current_price > auction.starting_price && (
                          <span className="text-xs text-muted-foreground ml-2">
                            起拍 ¥{auction.starting_price.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>{auction.total_bids} 次出价</span>
                        </div>
                        {isActive ? (
                          <div className={`flex items-center gap-1 ${isUrgent ? 'text-orange-500 font-medium' : ''}`}>
                            {isUrgent ? <Timer className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            <span>
                              {formatDistanceToNow(new Date(auction.end_time), { locale: zhCN, addSuffix: true })}结束
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60">
                            {formatDistanceToNow(new Date(auction.end_time), { locale: zhCN, addSuffix: true })}结束
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <p className="text-xs text-primary mt-2 font-medium">↑ 点击收起详情</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isMobile && <BottomNavigation unreadCount={unreadCount} />}
    </div>
  );
};
