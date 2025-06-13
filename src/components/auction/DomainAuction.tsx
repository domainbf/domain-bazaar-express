
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Gavel, 
  Clock, 
  TrendingUp, 
  Users, 
  DollarSign,
  Timer,
  Trophy,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { DomainAuction as AuctionType, AuctionBid } from '@/types/domain';

interface DomainAuctionProps {
  auction: AuctionType;
  onBidPlaced?: () => void;
}

export const DomainAuction: React.FC<DomainAuctionProps> = ({
  auction,
  onBidPlaced
}) => {
  const [bidAmount, setBidAmount] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [recentBids, setRecentBids] = useState<AuctionBid[]>([]);
  const [autoBidEnabled, setAutoBidEnabled] = useState(false);
  const [maxAutoBid, setMaxAutoBid] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const endTime = new Date(auction.end_time).getTime();
      const difference = endTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        if (days > 0) {
          setTimeRemaining(`${days}天 ${hours}小时`);
        } else if (hours > 0) {
          setTimeRemaining(`${hours}小时 ${minutes}分钟`);
        } else if (minutes > 0) {
          setTimeRemaining(`${minutes}分钟 ${seconds}秒`);
        } else {
          setTimeRemaining(`${seconds}秒`);
        }
      } else {
        setTimeRemaining('已结束');
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [auction.end_time]);

  useEffect(() => {
    loadRecentBids();
  }, [auction.id]);

  const loadRecentBids = async () => {
    try {
      // 模拟加载最近竞价记录
      const mockBids: AuctionBid[] = [
        {
          id: '1',
          auction_id: auction.id,
          bidder_id: 'user1',
          amount: auction.current_price,
          is_automatic: false,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          auction_id: auction.id,
          bidder_id: 'user2',
          amount: auction.current_price - auction.bid_increment,
          is_automatic: true,
          created_at: new Date(Date.now() - 300000).toISOString()
        }
      ];
      
      setRecentBids(mockBids);
    } catch (error) {
      console.error('加载竞价记录失败:', error);
    }
  };

  const handlePlaceBid = async () => {
    const amount = Number(bidAmount);
    
    if (!amount || amount < auction.current_price + auction.bid_increment) {
      toast.error(`竞价金额必须至少为 ¥${(auction.current_price + auction.bid_increment).toLocaleString()}`);
      return;
    }

    setIsPlacingBid(true);
    try {
      // 模拟竞价处理
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 更新当前价格
      auction.current_price = amount;
      auction.total_bids += 1;
      
      setBidAmount('');
      toast.success('竞价成功！');
      loadRecentBids();
      onBidPlaced?.();
    } catch (error) {
      console.error('竞价失败:', error);
      toast.error('竞价失败，请重试');
    } finally {
      setIsPlacingBid(false);
    }
  };

  const handleAutoBid = async () => {
    const maxAmount = Number(maxAutoBid);
    
    if (!maxAmount || maxAmount <= auction.current_price) {
      toast.error('自动竞价上限必须高于当前价格');
      return;
    }

    try {
      // 模拟设置自动竞价
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAutoBidEnabled(true);
      toast.success('自动竞价已启用');
    } catch (error) {
      console.error('设置自动竞价失败:', error);
      toast.error('设置自动竞价失败');
    }
  };

  const getTimeProgress = () => {
    const now = new Date().getTime();
    const startTime = new Date(auction.start_time).getTime();
    const endTime = new Date(auction.end_time).getTime();
    const total = endTime - startTime;
    const elapsed = now - startTime;
    return Math.min((elapsed / total) * 100, 100);
  };

  const isAuctionActive = auction.status === 'active' && timeRemaining !== '已结束';
  const minBidAmount = auction.current_price + auction.bid_increment;

  return (
    <div className="space-y-6">
      {/* 拍卖基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            域名拍卖
            <Badge variant={isAuctionActive ? 'default' : 'secondary'}>
              {auction.status === 'active' ? '进行中' : '已结束'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 时间信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-sm text-muted-foreground">剩余时间</div>
                <div className="font-bold">{timeRemaining}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-sm text-muted-foreground">当前价格</div>
                <div className="font-bold text-green-600">
                  ¥{auction.current_price.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-sm text-muted-foreground">竞价次数</div>
                <div className="font-bold">{auction.total_bids}</div>
              </div>
            </div>
          </div>

          {/* 时间进度条 */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>拍卖进度</span>
              <span>{getTimeProgress().toFixed(1)}%</span>
            </div>
            <Progress value={getTimeProgress()} />
          </div>

          {/* 拍卖规则 */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm">
              <div className="font-medium mb-1">拍卖规则</div>
              <ul className="text-muted-foreground space-y-1">
                <li>• 起拍价格：¥{auction.starting_price.toLocaleString()}</li>
                <li>• 加价幅度：¥{auction.bid_increment.toLocaleString()}</li>
                {auction.reserve_price && (
                  <li>• 保留价格：¥{auction.reserve_price.toLocaleString()}</li>
                )}
                <li>• 每次竞价将延长拍卖时间5分钟（如剩余时间少于5分钟）</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 竞价操作 */}
      {isAuctionActive && (
        <Card>
          <CardHeader>
            <CardTitle>立即竞价</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex gap-2 mb-2">
                <Input
                  type="number"
                  placeholder={`最低 ¥${minBidAmount.toLocaleString()}`}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  min={minBidAmount}
                  step={auction.bid_increment}
                />
                <Button
                  onClick={handlePlaceBid}
                  disabled={isPlacingBid || !bidAmount}
                  className="whitespace-nowrap"
                >
                  {isPlacingBid ? '竞价中...' : '立即竞价'}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                最低竞价金额：¥{minBidAmount.toLocaleString()}
              </div>
            </div>

            {/* 快捷竞价按钮 */}
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3].map((multiplier) => {
                const quickBidAmount = auction.current_price + (auction.bid_increment * multiplier);
                return (
                  <Button
                    key={multiplier}
                    variant="outline"
                    size="sm"
                    onClick={() => setBidAmount(quickBidAmount.toString())}
                  >
                    ¥{quickBidAmount.toLocaleString()}
                  </Button>
                );
              })}
            </div>

            {/* 自动竞价 */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="h-4 w-4" />
                <span className="font-medium">自动竞价</span>
                {autoBidEnabled && (
                  <Badge variant="default">已启用</Badge>
                )}
              </div>
              
              {!autoBidEnabled ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="自动竞价上限"
                    value={maxAutoBid}
                    onChange={(e) => setMaxAutoBid(e.target.value)}
                    min={auction.current_price + auction.bid_increment}
                  />
                  <Button
                    variant="outline"
                    onClick={handleAutoBid}
                    disabled={!maxAutoBid}
                  >
                    启用自动竞价
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm">
                    自动竞价上限：¥{maxAutoBid}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoBidEnabled(false)}
                  >
                    停用
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 竞价历史 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            竞价历史
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentBids.map((bid, index) => (
              <div key={bid.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index === 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-muted'
                  }`}>
                    {index === 0 ? <Trophy className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="font-medium">
                      竞价者 #{bid.bidder_id.slice(-4)}
                      {index === 0 && <span className="text-yellow-600 ml-2">当前领先</span>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(bid.created_at).toLocaleString()}
                      {bid.is_automatic && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          自动竞价
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    ¥{bid.amount.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}

            {recentBids.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Gavel className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无竞价记录</p>
                <p className="text-sm">成为第一个竞价者！</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 结束提醒 */}
      {auction.status === 'ended' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="font-medium text-yellow-800">拍卖已结束</div>
                <div className="text-sm text-yellow-700">
                  {auction.winner_id ? '恭喜获胜者！' : '此次拍卖未达到保留价格'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
