import { supabase } from '@/integrations/supabase/client';

import { Card, CardContent } from "@/components/ui/card";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/types/userProfile";
import {
  Globe, DollarSign, Eye, Heart, MessageSquare, ShoppingCart, Award, CheckCircle, CalendarDays
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useUserStats } from "@/hooks/useUserStats";

interface UserCenterStatsGridProps {
  profile: UserProfile | null;
  user: User;
  compact?: boolean;
  mobileRow?: boolean;
}

export const UserCenterStatsGrid = ({ profile, user, compact = false, mobileRow = false }: UserCenterStatsGridProps) => {
  // ── React Query — parallel fetch, 2-min cache ────────────────
  const { data, isLoading } = useUserStats(user?.id);
  const stats = data ?? {
    totalDomains: 0, totalValue: 0, totalViews: 0, totalOffers: 0,
    totalFavorites: 0, completedTransactions: 0, activeListings: 0, avgRating: 0,
  };

  const fmtCny = (v: number) => new Intl.NumberFormat('zh-CN', {
    style: 'currency', currency: 'CNY', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(v);

  const memberSince = profile?.created_at
    ? formatDistanceToNow(new Date(profile.created_at), { addSuffix: false, locale: zhCN })
    : null;

  const allCards = [
    { title: '域名', value: stats.totalDomains.toString(), sub: `${stats.activeListings}个出售中`, icon: Globe, color: 'text-primary', bg: 'bg-primary/10' },
    { title: '总价值', value: fmtCny(stats.totalValue), sub: '持有估值', icon: DollarSign, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
    { title: '浏览量', value: stats.totalViews.toLocaleString(), sub: '累计访问', icon: Eye, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
    { title: '收到报价', value: stats.totalOffers.toString(), sub: '买家报价', icon: MessageSquare, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
    { title: '被收藏', value: stats.totalFavorites.toString(), sub: '收藏次数', icon: Heart, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
    { title: '完成交易', value: stats.completedTransactions.toString(), sub: '成功成交', icon: ShoppingCart, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
  ];

  const cards = compact ? allCards.slice(0, 3) : allCards;

  /* ── Mobile row mode (inside profile card) ─────────────────── */
  if (mobileRow) {
    if (isLoading) {
      return (
        <div className="flex border-t border-border divide-x divide-border">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 flex flex-col items-center py-3 gap-1.5">
              <div className="h-5 w-10 rounded skeleton-shimmer" />
              <div className="h-3 w-8 rounded skeleton-shimmer" />
            </div>
          ))}
        </div>
      );
    }
    const rowItems = [
      { label: '域名', value: stats.totalDomains },
      { label: '浏览', value: stats.totalViews },
      { label: '交易', value: stats.completedTransactions },
    ];
    return (
      <div className="flex border-t border-border divide-x divide-border">
        {rowItems.map(item => (
          <div key={item.label} className="flex-1 flex flex-col items-center py-3">
            <span className="text-base font-bold text-foreground tabular-nums">{item.value}</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">{item.label}</span>
          </div>
        ))}
      </div>
    );
  }

  /* ── Compact horizontal scroll (domains/transactions mobile) ─ */
  if (compact) {
    if (isLoading) {
      return (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-none w-28 h-20 rounded-xl border border-border bg-card skeleton-shimmer" />
          ))}
        </div>
      );
    }
    return (
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Card key={i} className="flex-none w-28 border-border/60 shadow-none">
              <CardContent className="p-3">
                <div className={`${c.bg} w-7 h-7 rounded-lg flex items-center justify-center mb-2`}>
                  <Icon className={`h-3.5 w-3.5 ${c.color}`} />
                </div>
                <p className={`text-base font-bold ${c.color} leading-tight`}>{c.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{c.title}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  /* ── Desktop full grid ─────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4"><div className="h-14 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {allCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Card key={i} className="hover:shadow-md transition-shadow duration-200 border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`${c.bg} p-2 rounded-lg`}>
                    <Icon className={`h-4 w-4 ${c.color}`} />
                  </div>
                </div>
                <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.title}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom info bar */}
      <div className="grid grid-cols-2 gap-3">
        {profile?.is_seller && (
          <Card className="hover:shadow-md transition-shadow duration-200 border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-500/10 p-2 rounded-lg">
                    <Award className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">卖家评分</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                        {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '暂无'}
                      </span>
                      {stats.avgRating > 0 && (
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full ${i < Math.round(stats.avgRating) ? 'bg-yellow-400' : 'bg-muted'}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {profile.seller_verified && (
                  <span className="text-[10px] font-medium text-green-700 dark:text-green-400 bg-green-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />已认证
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        {memberSince && (
          <Card className="hover:shadow-md transition-shadow duration-200 border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-teal-500/10 p-2 rounded-lg">
                  <CalendarDays className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">加入时长</p>
                  <p className="text-lg font-bold text-teal-600 dark:text-teal-400 mt-0.5">{memberSince}</p>
                </div>
                {profile?.total_sales != null && profile.total_sales > 0 && (
                  <div className="ml-auto text-right">
                    <p className="text-xs text-muted-foreground">累计销售</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">¥{Number(profile.total_sales).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
