import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { RefreshCw, Search, Gavel, Clock, CheckCircle, XCircle, TrendingUp, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Auction {
  id: string;
  domain_id: string;
  start_price: number;
  current_price: number;
  reserve_price: number | null;
  buy_now_price: number | null;
  bid_count: number;
  status: string;
  start_time: string;
  end_time: string;
  created_at: string;
  winner_id: string | null;
  domain_name?: string;
  winner_email?: string;
}

interface AuctionBid {
  id: string;
  auction_id: string;
  bidder_id: string;
  amount: number;
  created_at: string;
  bidder_email?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: '进行中', color: 'bg-green-500/15 text-green-600 dark:text-green-400 dark:bg-green-900/30 dark:text-green-400' },
  ended: { label: '已结束', color: 'bg-muted text-foreground dark:bg-gray-800 dark:text-gray-300' },
  cancelled: { label: '已取消', color: 'bg-red-500/15 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  completed: { label: '已完成', color: 'bg-blue-500/15 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  pending: { label: '待开始', color: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

export const AdminAuctionManagement = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [showBids, setShowBids] = useState(false);
  const [isActing, setIsActing] = useState(false);

  const loadAuctions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('domain_auctions')
        .select(`id, domain_id, start_price, current_price, reserve_price, buy_now_price, bid_count, status, start_time, end_time, created_at, winner_id, domain_listings:domain_id(name)`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const winnerIds = [...new Set((data || []).map((a: any) => a.winner_id).filter(Boolean))];
      let profiles: any[] = [];
      if (winnerIds.length > 0) {
        const { data: p } = await supabase.from('profiles').select('id, contact_email, full_name').in('id', winnerIds);
        profiles = p || [];
      }
      const profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]));

      const mapped: Auction[] = (data || []).map((a: any) => ({
        ...a,
        domain_name: a.domain_listings?.name ?? '—',
        winner_email: a.winner_id ? (profileMap[a.winner_id]?.contact_email ?? profileMap[a.winner_id]?.full_name ?? '—') : '—',
      }));
      setAuctions(mapped);
    } catch (err: any) {
      toast.error('加载拍卖记录失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadBids = async (auctionId: string) => {
    try {
      const { data, error } = await supabase
        .from('auction_bids')
        .select('id, auction_id, bidder_id, amount, created_at')
        .eq('auction_id', auctionId)
        .order('amount', { ascending: false });

      if (error) throw error;

      const bidderIds = [...new Set((data || []).map((b: any) => b.bidder_id).filter(Boolean))];
      let profiles: any[] = [];
      if (bidderIds.length > 0) {
        const { data: p } = await supabase.from('profiles').select('id, contact_email, full_name').in('id', bidderIds);
        profiles = p || [];
      }
      const profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]));

      const mapped: AuctionBid[] = (data || []).map((b: any) => ({
        ...b,
        bidder_email: profileMap[b.bidder_id]?.contact_email ?? profileMap[b.bidder_id]?.full_name ?? '匿名',
      }));
      setBids(mapped);
    } catch (err: any) {
      toast.error('加载出价记录失败');
    }
  };

  useEffect(() => { loadAuctions(); }, [loadAuctions]);

  const handleViewBids = (auction: Auction) => {
    setSelectedAuction(auction);
    loadBids(auction.id);
    setShowBids(true);
  };

  const handleEndAuction = async (auctionId: string) => {
    setIsActing(true);
    try {
      const { error } = await supabase
        .from('domain_auctions')
        .update({ status: 'ended', end_time: new Date().toISOString() })
        .eq('id', auctionId);
      if (error) throw error;
      toast.success('拍卖已提前结束');
      loadAuctions();
      setShowBids(false);
    } catch {
      toast.error('操作失败');
    } finally {
      setIsActing(false);
    }
  };

  const handleCancelAuction = async (auctionId: string) => {
    setIsActing(true);
    try {
      const { error } = await supabase
        .from('domain_auctions')
        .update({ status: 'cancelled' })
        .eq('id', auctionId);
      if (error) throw error;
      toast.success('拍卖已取消');
      loadAuctions();
      setShowBids(false);
    } catch {
      toast.error('取消失败');
    } finally {
      setIsActing(false);
    }
  };

  const filtered = auctions.filter(a => {
    const s = search.toLowerCase();
    return !s || a.domain_name?.toLowerCase().includes(s);
  });

  const stats = {
    total: auctions.length,
    active: auctions.filter(a => a.status === 'active').length,
    ended: auctions.filter(a => a.status === 'ended').length,
    totalBids: auctions.reduce((s, a) => s + (a.bid_count ?? 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">拍卖管理</h2>
          <p className="text-sm text-muted-foreground">管理平台所有域名拍卖活动</p>
        </div>
        <Button onClick={loadAuctions} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />刷新
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '全部拍卖', value: stats.total, icon: Gavel, color: 'text-foreground' },
          { label: '进行中', value: stats.active, icon: Clock, color: 'text-green-600' },
          { label: '已结束', value: stats.ended, icon: CheckCircle, color: 'text-blue-600' },
          { label: '总出价次数', value: stats.totalBids, icon: TrendingUp, color: 'text-purple-600' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i}>
              <CardContent className="p-3 flex items-center gap-3">
                <Icon className={`h-5 w-5 ${s.color} shrink-0`} />
                <div>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9 max-w-sm" placeholder="搜索域名..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-10"><LoadingSpinner /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Gavel className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">暂无拍卖记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>域名</TableHead>
                    <TableHead className="text-right">起拍价</TableHead>
                    <TableHead className="text-right">当前价</TableHead>
                    <TableHead className="text-right">出价次数</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>结束时间</TableHead>
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(auction => {
                    const cfg = STATUS_CONFIG[auction.status] ?? STATUS_CONFIG.pending;
                    const isExpired = new Date(auction.end_time) < new Date();
                    return (
                      <TableRow key={auction.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{auction.domain_name}</TableCell>
                        <TableCell className="text-right">¥{Number(auction.start_price).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">¥{Number(auction.current_price).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{auction.bid_count ?? 0}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                          {auction.status === 'active' && isExpired && (
                            <Badge className="ml-1 text-xs bg-orange-100 text-orange-800">已超时</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(auction.end_time), { addSuffix: true, locale: zhCN })}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button size="sm" variant="ghost" onClick={() => handleViewBids(auction)}>
                            <Eye className="h-4 w-4 mr-1" />出价
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 出价记录 Dialog */}
      <Dialog open={showBids} onOpenChange={setShowBids}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                {selectedAuction?.domain_name} — 出价记录
              </span>
            </DialogTitle>
          </DialogHeader>
          {selectedAuction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">当前最高价：</span><strong className="text-green-600">¥{Number(selectedAuction.current_price).toLocaleString()}</strong></div>
                <div><span className="text-muted-foreground">保留价：</span>{selectedAuction.reserve_price ? `¥${Number(selectedAuction.reserve_price).toLocaleString()}` : '无'}</div>
                <div><span className="text-muted-foreground">一口价：</span>{selectedAuction.buy_now_price ? `¥${Number(selectedAuction.buy_now_price).toLocaleString()}` : '无'}</div>
                <div><span className="text-muted-foreground">出价次数：</span>{selectedAuction.bid_count ?? 0}</div>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {bids.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">暂无出价记录</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>竞拍者</TableHead>
                        <TableHead className="text-right">出价</TableHead>
                        <TableHead>时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bids.map((bid, i) => (
                        <TableRow key={bid.id} className={i === 0 ? 'bg-green-500/10 dark:bg-green-900/20' : ''}>
                          <TableCell className="text-xs">{i === 0 ? '🏆' : i + 1}</TableCell>
                          <TableCell className="text-sm">{bid.bidder_email}</TableCell>
                          <TableCell className={`text-right font-semibold ${i === 0 ? 'text-green-600' : ''}`}>¥{Number(bid.amount).toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true, locale: zhCN })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {selectedAuction.status === 'active' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEndAuction(selectedAuction.id)} disabled={isActing}>
                    <Clock className="h-3.5 w-3.5 mr-1.5" />提前结束
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleCancelAuction(selectedAuction.id)} disabled={isActing}>
                    <XCircle className="h-3.5 w-3.5 mr-1.5" />取消拍卖
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBids(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
