import React, { useState, useEffect, useCallback } from 'react';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/apiClient';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';
import { Gavel, Clock, TrendingUp, Users, Timer, Trophy, AlertCircle, RefreshCw } from 'lucide-react';
import { DomainAuction as AuctionType, AuctionBid } from '@/types/domain';

interface DomainAuctionProps {
  auction: AuctionType;
  onBidPlaced?: () => void;
}

export const DomainAuction: React.FC<DomainAuctionProps> = ({ auction: initialAuction, onBidPlaced }) => {
  const { user } = useAuth();
  const [auction, setAuction] = useState<AuctionType>(initialAuction);
  const [bidAmount, setBidAmount] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [recentBids, setRecentBids] = useState<AuctionBid[]>([]);
  const [autoBidEnabled, setAutoBidEnabled] = useState(false);
  const [maxAutoBid, setMaxAutoBid] = useState('');
  const [isLoadingBids, setIsLoadingBids] = useState(true);
  const [userMaxBid, setUserMaxBid] = useState<number | null>(null);

  useEffect(() => {
    loadRecentBids();
    loadUserAutoBid();

    // Subscribe to real-time bid updates
    useRealtimeSubscription(
    ["domain_auctions","auction_bids"],
    (_event) => { loadRecentBids(); },
    true
  );

    
  }, [auction.id, user?.id]);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const end = new Date(auction.end_time).getTime();
      const diff = end - now;
      if (diff <= 0) { setTimeRemaining('已结束'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setTimeRemaining(`${d}天 ${h}小时`);
      else if (h > 0) setTimeRemaining(`${h}小时 ${m}分`);
      else if (m > 0) setTimeRemaining(`${m}分 ${s}秒`);
      else setTimeRemaining(`${s}秒`);
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [auction.end_time]);

  const loadRecentBids = async () => {
    setIsLoadingBids(true);
    try {
      const { data, error } = await supabase
        .from('auction_bids')
        .select('*')
        .eq('auction_id', auction.id)
        .order('amount', { ascending: false })
        .limit(10);
      if (error) throw error;
      setRecentBids((data ?? []) as AuctionBid[]);
    } catch {
      console.error('加载竞价记录失败');
    } finally {
      setIsLoadingBids(false);
    }
  };

  const loadUserAutoBid = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('auction_bids')
      .select('auto_bid_max')
      .eq('auction_id', auction.id)
      .eq('bidder_id', user.id)
      .not('auto_bid_max', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.auto_bid_max) {
      setUserMaxBid(data.auto_bid_max);
      setAutoBidEnabled(true);
      setMaxAutoBid(String(data.auto_bid_max));
    }
  };

  const handlePlaceBid = useCallback(async () => {
    if (!user) { toast.error('请先登录'); return; }
    const amount = Number(bidAmount);
    const minBid = auction.current_price + (auction.bid_increment ?? 100);
    if (!amount || amount < minBid) {
      toast.error(`竞价金额不能低于 ¥${minBid.toLocaleString()}`);
      return;
    }
    setIsPlacingBid(true);
    try {
      const { error } = await supabase.from('auction_bids').insert({
        auction_id: auction.id,
        bidder_id: user.id,
        amount,
        is_automatic: false,
      });
      if (error) throw error;

      await supabase.from('domain_auctions').update({
        current_price: amount,
        total_bids: auction.total_bids + 1,
        updated_at: new Date().toISOString(),
      }).eq('id', auction.id);

      await supabase.from('notifications').insert({
        user_id: recentBids[0]?.bidder_id ?? null,
        type: 'auction_outbid',
        title: '您已被超越',
        message: `有人出价 ¥${amount.toLocaleString()}，超过了您的竞价`,
        data: { auction_id: auction.id },
      });

      setBidAmount('');
      toast.success('竞价成功！');
      onBidPlaced?.();
    } catch {
      toast.error('竞价失败，请重试');
    } finally {
      setIsPlacingBid(false);
    }
  }, [user, bidAmount, auction, recentBids, onBidPlaced]);

  const handleSetAutoBid = useCallback(async () => {
    if (!user) { toast.error('请先登录'); return; }
    const max = Number(maxAutoBid);
    if (!max || max <= auction.current_price) {
      toast.error('自动竞价上限必须高于当前价格');
      return;
    }
    try {
      await supabase.from('auction_bids').insert({
        auction_id: auction.id,
        bidder_id: user.id,
        amount: auction.current_price + (auction.bid_increment ?? 100),
        is_automatic: true,
        auto_bid_max: max,
      });
      setUserMaxBid(max);
      setAutoBidEnabled(true);
      toast.success(`自动竞价已设置，上限 ¥${max.toLocaleString()}`);
    } catch {
      toast.error('设置失败');
    }
  }, [user, maxAutoBid, auction]);

  const isEnded = auction.status === 'ended' || timeRemaining === '已结束';
  const isUserLeading = recentBids[0]?.bidder_id === user?.id;
  const minBid = auction.current_price + (auction.bid_increment ?? 100);

  return (
    <div className="space-y-4">
      {/* Auction Status Card */}
      <Card className={isEnded ? 'border-muted' : 'border-primary/30'}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Gavel className="w-4 h-4" /> 拍卖竞价
            </CardTitle>
            <Badge variant={isEnded ? 'secondary' : auction.status === 'active' ? 'default' : 'outline'}>
              {isEnded ? '已结束' : auction.status === 'active' ? '进行中' : '未开始'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-muted/40 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">当前价格</p>
              <p className="text-xl font-bold text-primary">¥{auction.current_price.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-muted/40 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                <Timer className="w-3 h-3" /> 剩余时间
              </p>
              <p className={`text-sm font-bold ${isEnded ? 'text-muted-foreground' : timeRemaining.includes('秒') ? 'text-destructive animate-pulse' : ''}`}>
                {timeRemaining}
              </p>
            </div>
            <div className="p-3 bg-muted/40 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                <Users className="w-3 h-3" /> 竞价次数
              </p>
              <p className="text-xl font-bold">{auction.total_bids}</p>
            </div>
          </div>

          {!isEnded && user && (
            <>
              {isUserLeading && (
                <div className="flex items-center gap-2 p-2 bg-green-500/10 dark:bg-green-950/20 border border-green-500/30 rounded-lg text-sm text-green-700 dark:text-green-400">
                  <Trophy className="w-4 h-4" />
                  <span>您当前是最高出价者！</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder={`最低 ¥${minBid.toLocaleString()}`}
                    value={bidAmount}
                    onChange={e => setBidAmount(e.target.value)}
                    min={minBid}
                    data-testid="input-bid-amount"
                    className="flex-1"
                  />
                  <Button onClick={handlePlaceBid} disabled={isPlacingBid || !bidAmount} data-testid="button-place-bid">
                    {isPlacingBid ? <LoadingSpinner size="sm" /> : <><Gavel className="w-4 h-4 mr-1" />出价</>}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  最低加价：¥{(auction.bid_increment ?? 100).toLocaleString()}
                  {auction.reserve_price && <> · 保留价：¥{auction.reserve_price.toLocaleString()}</>}
                </p>

                {/* Auto-bid */}
                <div className="border rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> 自动竞价
                    {autoBidEnabled && userMaxBid && (
                      <Badge variant="secondary" className="ml-2 text-xs">已设置上限 ¥{userMaxBid.toLocaleString()}</Badge>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="设置最高出价上限"
                      value={maxAutoBid}
                      onChange={e => setMaxAutoBid(e.target.value)}
                      data-testid="input-auto-bid-max"
                      className="flex-1 text-sm"
                    />
                    <Button variant="outline" size="sm" onClick={handleSetAutoBid} data-testid="button-set-auto-bid">
                      {autoBidEnabled ? '更新' : '启用'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">系统将自动替您出价，直到达到上限</p>
                </div>
              </div>
            </>
          )}

          {!user && !isEnded && (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">登录后参与竞价</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bid History */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">竞价记录</CardTitle>
            <Button variant="ghost" size="sm" onClick={loadRecentBids} className="h-6 w-6 p-0">
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingBids ? (
            <div className="flex justify-center py-4"><LoadingSpinner size="sm" /></div>
          ) : recentBids.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Gavel className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">暂无竞价，成为第一个出价者！</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentBids.map((bid, idx) => (
                <div key={bid.id} className={`flex items-center justify-between p-2.5 rounded-lg ${idx === 0 ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {bid.bidder_id === user?.id ? '您' : `用户${bid.bidder_id?.slice(-4)}`}
                        {bid.is_automatic && <Badge variant="outline" className="ml-1 text-xs h-4">自动</Badge>}
                        {idx === 0 && <span className="ml-1 text-yellow-600 text-xs">领先</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(bid.created_at ?? '').toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <p className={`font-bold ${idx === 0 ? 'text-primary' : ''}`}>¥{bid.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isEnded && (
        <Card className={`border-${auction.winner_id ? 'yellow' : 'muted'}-200`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {auction.winner_id ? (
                <>
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">拍卖已结束</p>
                    <p className="text-sm text-muted-foreground">
                      {auction.winner_id === user?.id ? '🎉 恭喜您赢得竞拍！' : '拍卖已有买家成交'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-muted-foreground">拍卖已结束</p>
                    <p className="text-sm text-muted-foreground">未达到保留价格</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
