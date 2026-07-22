import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gift, Users, DollarSign, Share2, Copy, Trophy, Target, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RewardRow {
  id: string;
  referred_user_id: string | null;
  reward_amount: number;
  status: string;
  created_at: string;
}

interface TierInfo {
  name: string;
  requirement: number;
  reward: number;
}

const TIERS: TierInfo[] = [
  { name: '青铜推荐人', requirement: 0, reward: 50 },
  { name: '白银推荐人', requirement: 5, reward: 100 },
  { name: '黄金推荐人', requirement: 15, reward: 200 },
  { name: '铂金推荐人', requirement: 30, reward: 300 },
];

const referralCodeFromId = (uid: string) => uid.replace(/-/g, '').slice(0, 8).toUpperCase();

export const ReferralSystem: React.FC = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<RewardRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const referralCode = user ? referralCodeFromId(user.id) : '';
  const referralLink = user ? `${window.location.origin}?ref=${referralCode}` : '';

  const totals = React.useMemo(() => {
    const completed = rewards.filter((r) => r.status === 'paid' || r.status === 'completed');
    const pending = rewards.filter((r) => r.status === 'pending');
    return {
      totalReferrals: rewards.length,
      totalEarnings: completed.reduce((s, r) => s + Number(r.reward_amount || 0), 0),
      pendingEarnings: pending.reduce((s, r) => s + Number(r.reward_amount || 0), 0),
    };
  }, [rewards]);

  const currentTierIdx = React.useMemo(() => {
    let idx = 0;
    for (let i = 0; i < TIERS.length; i++) if (totals.totalReferrals >= TIERS[i].requirement) idx = i;
    return idx;
  }, [totals.totalReferrals]);
  const currentTier = TIERS[currentTierIdx];
  const nextTier = TIERS[currentTierIdx + 1];

  const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('referral_rewards')
        .select('id, referred_user_id, reward_amount, status, created_at')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data || []) as RewardRow[];
      setRewards(rows);

      const ids = Array.from(new Set(rows.map((r) => r.referred_user_id).filter(Boolean))) as string[];
      if (ids.length) {
        const { data: profs } = await supabase.from('profiles').select('id, full_name, username').in('id', ids);
        const map: Record<string, string> = {};
        (profs || []).forEach((p: any) => { map[p.id] = p.full_name || p.username || '推荐用户'; });
        setNames(map);
      } else {
        setNames({});
      }
    } catch (e: any) {
      console.error(e);
      toast.error('加载推荐数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('推荐链接已复制到剪贴板');
  };

  const shareToSocial = (platform: string) => {
    const message = '加入最专业的域名交易平台，使用我的推荐码可以获得优惠！';
    let shareUrl = '';
    switch (platform) {
      case 'wechat':
        toast.info('请复制链接手动分享到微信');
        copyReferralLink();
        return;
      case 'weibo':
        shareUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(referralLink)}&title=${encodeURIComponent(message)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(message)}`;
        break;
    }
    if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  if (!user) {
    return <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">请先登录以查看推荐数据</CardContent></Card>;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const progressToNextTier = nextTier
    ? (totals.totalReferrals / nextTier.requirement) * 100
    : 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={<Users className="h-8 w-8 text-blue-600" />} value={totals.totalReferrals} label="成功推荐" />
        <Stat icon={<DollarSign className="h-8 w-8 text-green-600" />} value={`¥${totals.totalEarnings.toFixed(0)}`} label="总收益" />
        <Stat icon={<Trophy className="h-8 w-8 text-yellow-600" />} value={currentTier.name} label="当前等级" small />
        <Stat icon={<Target className="h-8 w-8 text-purple-600" />} value={`¥${totals.pendingEarnings.toFixed(0)}`} label="待结算" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Share2 className="h-5 w-5" />我的推荐链接</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="flex-1" />
            <Button onClick={copyReferralLink} variant="outline"><Copy className="h-4 w-4" /></Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">推荐码：</span>
            <Badge variant="outline" className="font-mono">{referralCode}</Badge>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => shareToSocial('wechat')}>分享到微信</Button>
            <Button variant="outline" size="sm" onClick={() => shareToSocial('weibo')}>分享到微博</Button>
            <Button variant="outline" size="sm" onClick={() => shareToSocial('twitter')}>分享到 Twitter</Button>
          </div>
        </CardContent>
      </Card>

      {nextTier && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />等级进度</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{currentTier.name}</span>
              <span className="font-medium">{nextTier.name}</span>
            </div>
            <Progress value={Math.min(progressToNextTier, 100)} />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>已推荐 {totals.totalReferrals} 人</span>
              <span>还需 {Math.max(0, nextTier.requirement - totals.totalReferrals)} 人升级</span>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg text-sm">
              <strong>升级奖励：</strong>每成功推荐从 ¥{currentTier.reward} 提升到 ¥{nextTier.reward}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>推荐历史</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rewards.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">{record.referred_user_id ? (names[record.referred_user_id] || '推荐用户') : '匿名'}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(record.created_at).toLocaleDateString('zh-CN')} 加入
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={record.status === 'paid' || record.status === 'completed' ? 'default' : record.status === 'pending' ? 'secondary' : 'outline'}>
                    {record.status === 'paid' || record.status === 'completed' ? '已完成' : record.status === 'pending' ? '待结算' : record.status}
                  </Badge>
                  <div className="text-right">
                    <div className="font-bold text-green-600">+¥{Number(record.reward_amount || 0).toFixed(0)}</div>
                  </div>
                </div>
              </div>
            ))}
            {rewards.length === 0 && (
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

function Stat({ icon, value, label, small }: { icon: React.ReactNode; value: React.ReactNode; label: string; small?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {icon}
          <div className="min-w-0">
            <div className={small ? 'text-base font-bold truncate' : 'text-2xl font-bold'}>{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ReferralSystem;
