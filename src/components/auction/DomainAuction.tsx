
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Hammer, 
  Clock, 
  Users, 
  TrendingUp, 
  DollarSign,
  Crown,
  Timer
} from 'lucide-react';
import { toast } from 'sonner';

interface AuctionData {
  id: string;
  domainName: string;
  currentPrice: number;
  startingPrice: number;
  reservePrice?: number;
  bidIncrement: number;
  timeRemaining: number;
  totalBids: number;
  highestBidder?: string;
  isActive: boolean;
  endTime: string;
}

interface Bid {
  id: string;
  bidder: string;
  amount: number;
  timestamp: string;
}

export const DomainAuction: React.FC<{ auctionData: AuctionData }> = ({ auctionData }) => {
  const [bidAmount, setBidAmount] = useState(auctionData.currentPrice + auctionData.bidIncrement);
  const [timeLeft, setTimeLeft] = useState(auctionData.timeRemaining);
  const [isBidding, setIsBidding] = useState(false);
  const [recentBids, setRecentBids] = useState<Bid[]>([
    {
      id: '1',
      bidder: 'user***123',
      amount: auctionData.currentPrice,
      timestamp: new Date().toISOString()
    }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const placeBid = async () => {
    if (bidAmount < auctionData.currentPrice + auctionData.bidIncrement) {
      toast.error(`出价必须至少为 ¥${(auctionData.currentPrice + auctionData.bidIncrement).toLocaleString()}`);
      return;
    }

    setIsBidding(true);
    
    try {
      // 模拟出价请求
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newBid: Bid = {
        id: Date.now().toString(),
        bidder: 'you',
        amount: bidAmount,
        timestamp: new Date().toISOString()
      };
      
      setRecentBids(prev => [newBid, ...prev.slice(0, 4)]);
      setBidAmount(bidAmount + auctionData.bidIncrement);
      toast.success('出价成功！');
    } catch (error) {
      toast.error('出价失败，请重试');
    } finally {
      setIsBidding(false);
    }
  };

  const getTimeColor = () => {
    if (timeLeft > 3600000) return 'text-green-600'; // 超过1小时
    if (timeLeft > 900000) return 'text-yellow-600'; // 超过15分钟
    return 'text-red-600'; // 少于15分钟
  };

  const progressValue = Math.max(0, 100 - (timeLeft / auctionData.timeRemaining) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 拍卖概览 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Hammer className="h-5 w-5" />
              域名拍卖 - {auctionData.domainName}
            </CardTitle>
            <Badge variant={auctionData.isActive ? 'default' : 'secondary'}>
              {auctionData.isActive ? '进行中' : '已结束'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">当前价格</div>
              <div className="text-2xl font-bold text-primary">
                ¥{auctionData.currentPrice.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">起拍价</div>
              <div className="text-xl font-bold text-green-600">
                ¥{auctionData.startingPrice.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">出价次数</div>
              <div className="text-xl font-bold text-blue-600 flex items-center justify-center gap-1">
                <Users className="h-4 w-4" />
                {auctionData.totalBids}
              </div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">剩余时间</div>
              <div className={`text-xl font-bold ${getTimeColor()} flex items-center justify-center gap-1`}>
                <Timer className="h-4 w-4" />
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
          
          {/* 时间进度条 */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">拍卖进度</span>
              <span className="text-sm text-muted-foreground">{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 出价区域 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                出价
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  min={auctionData.currentPrice + auctionData.bidIncrement}
                  step={auctionData.bidIncrement}
                  className="flex-1"
                />
                <Button 
                  onClick={placeBid}
                  disabled={!auctionData.isActive || isBidding || timeLeft <= 0}
                  className="min-w-[100px]"
                >
                  {isBidding ? '出价中...' : '出价'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>最低出价增幅: ¥{auctionData.bidIncrement.toLocaleString()}</span>
                {auctionData.reservePrice && (
                  <span>保留价: ¥{auctionData.reservePrice.toLocaleString()}</span>
                )}
              </div>
              
              {timeLeft <= 0 && (
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <span className="text-red-600 font-medium">拍卖已结束</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 拍卖规则 */}
          <Card>
            <CardHeader>
              <CardTitle>拍卖规则</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>• 每次出价必须高于当前价格至少 ¥{auctionData.bidIncrement.toLocaleString()}</div>
              <div>• 拍卖结束前5分钟内的出价将自动延长拍卖时间</div>
              <div>• 获胜者需在24小时内完成付款</div>
              <div>• 所有交易受平台保护</div>
            </CardContent>
          </Card>
        </div>

        {/* 出价历史 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                最新出价
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentBids.map((bid, index) => (
                  <div key={bid.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                      <span className={`font-medium ${bid.bidder === 'you' ? 'text-primary' : ''}`}>
                        {bid.bidder === 'you' ? '您' : bid.bidder}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">¥{bid.amount.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(bid.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
