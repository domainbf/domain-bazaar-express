
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Gift, 
  Users, 
  DollarSign, 
  Share2,
  Copy,
  Trophy,
  Target,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  referralHistory: {
    id: string;
    referredUser: string;
    joinDate: string;
    status: 'pending' | 'active' | 'completed';
    reward: number;
  }[];
  currentTier: {
    name: string;
    level: number;
    requirement: number;
    reward: number;
    nextTier?: {
      name: string;
      requirement: number;
      reward: number;
    };
  };
}

export const ReferralSystem: React.FC = () => {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customCode, setCustomCode] = useState('');

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    setIsLoading(true);
    try {
      // 模拟加载推荐数据
      const mockData: ReferralData = {
        referralCode: 'USER123',
        totalReferrals: 15,
        totalEarnings: 3600,
        pendingEarnings: 800,
        referralHistory: [
          {
            id: '1',
            referredUser: '张三',
            joinDate: '2024-01-15',
            status: 'completed',
            reward: 200
          },
          {
            id: '2',
            referredUser: '李四',
            joinDate: '2024-01-10',
            status: 'active',
            reward: 150
          },
          {
            id: '3',
            referredUser: '王五',
            joinDate: '2024-01-08',
            status: 'pending',
            reward: 100
          }
        ],
        currentTier: {
          name: '银牌推荐人',
          level: 2,
          requirement: 10,
          reward: 200,
          nextTier: {
            name: '金牌推荐人',
            requirement: 25,
            reward: 300
          }
        }
      };
      
      setReferralData(mockData);
    } catch (error) {
      console.error('Failed to load referral data:', error);
      toast.error('加载推荐数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}?ref=${referralData?.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    toast.success('推荐链接已复制到剪贴板');
  };

  const shareToSocial = (platform: string) => {
    const referralLink = `${window.location.origin}?ref=${referralData?.referralCode}`;
    const message = `加入最专业的域名交易平台，使用我的推荐码可以获得优惠！`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'wechat':
        // 微信分享需要特殊处理，这里只是示例
        toast.info('请复制链接手动分享到微信');
        copyReferralLink();
        break;
      case 'weibo':
        shareUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(referralLink)}&title=${encodeURIComponent(message)}`;
        break;
      case 'qq':
        shareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(referralLink)}&title=${encodeURIComponent(message)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const updateReferralCode = async () => {
    if (!customCode.trim()) {
      toast.error('请输入有效的推荐码');
      return;
    }
    
    try {
      // 模拟更新推荐码
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (referralData) {
        setReferralData({
          ...referralData,
          referralCode: customCode.toUpperCase()
        });
      }
      
      toast.success('推荐码更新成功');
      setCustomCode('');
    } catch (error) {
      toast.error('更新推荐码失败');
    }
  };

  if (isLoading || !referralData) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const progressToNextTier = referralData.currentTier.nextTier 
    ? (referralData.totalReferrals / referralData.currentTier.nextTier.requirement) * 100
    : 100;

  return (
    <div className="space-y-6">
      {/* 推荐概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{referralData.totalReferrals}</div>
                <div className="text-sm text-muted-foreground">成功推荐</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">¥{referralData.totalEarnings}</div>
                <div className="text-sm text-muted-foreground">总收益</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="text-lg font-bold">{referralData.currentTier.name}</div>
                <div className="text-sm text-muted-foreground">当前等级</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">¥{referralData.pendingEarnings}</div>
                <div className="text-sm text-muted-foreground">待结算</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 推荐链接 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            我的推荐链接
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={`${window.location.origin}?ref=${referralData.referralCode}`}
              readOnly
              className="flex-1"
            />
            <Button onClick={copyReferralLink} variant="outline">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">推荐码：</span>
            <Badge variant="outline" className="font-mono">
              {referralData.referralCode}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => shareToSocial('wechat')}
            >
              分享到微信
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => shareToSocial('weibo')}
            >
              分享到微博
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => shareToSocial('qq')}
            >
              分享到QQ
            </Button>
          </div>
          
          {/* 自定义推荐码 */}
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="自定义推荐码（6-12位字母数字）"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                maxLength={12}
              />
              <Button onClick={updateReferralCode}>
                更新
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 等级进度 */}
      {referralData.currentTier.nextTier && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              等级进度
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{referralData.currentTier.name}</span>
              <span className="font-medium">{referralData.currentTier.nextTier.name}</span>
            </div>
            
            <Progress value={Math.min(progressToNextTier, 100)} />
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                已推荐 {referralData.totalReferrals} 人
              </span>
              <span>
                还需 {Math.max(0, referralData.currentTier.nextTier.requirement - referralData.totalReferrals)} 人升级
              </span>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm">
                <strong>升级奖励：</strong>
                每成功推荐从 ¥{referralData.currentTier.reward} 提升到 ¥{referralData.currentTier.nextTier.reward}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 推荐历史 */}
      <Card>
        <CardHeader>
          <CardTitle>推荐历史</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {referralData.referralHistory.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">{record.referredUser}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(record.joinDate).toLocaleDateString()} 加入
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant={
                    record.status === 'completed' ? 'default' :
                    record.status === 'active' ? 'secondary' : 'outline'
                  }>
                    {record.status === 'completed' ? '已完成' :
                     record.status === 'active' ? '活跃中' : '待激活'}
                  </Badge>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      +¥{record.reward}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {referralData.referralHistory.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>还没有推荐记录，快去邀请朋友吧！</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
