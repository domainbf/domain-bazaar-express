import { Shield, Lock, Star, Users, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Stats = {
  reviews: number;
  avgRating: number;
  totalSold: number;
  totalUsers: number;
};

export const TrustBar = () => {
  const [stats, setStats] = useState<Stats>({ reviews: 0, avgRating: 5, totalSold: 0, totalUsers: 0 });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [reviewsRes, soldRes, usersRes] = await Promise.all([
          supabase.from('user_reviews').select('rating', { count: 'exact' }).limit(500),
          supabase.from('domain_listings').select('id', { count: 'exact', head: true }).eq('status', 'sold'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
        ]);
        if (!alive) return;
        const ratings = (reviewsRes.data ?? []).map((r: any) => r.rating).filter((n) => typeof n === 'number');
        const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 5;
        setStats({
          reviews: reviewsRes.count ?? ratings.length,
          avgRating: Math.round(avg * 10) / 10,
          totalSold: soldRes.count ?? 0,
          totalUsers: usersRes.count ?? 0,
        });
      } catch {
        // silent
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const items = [
    { icon: Shield, label: '第三方担保交易', sub: '资金 100% 托管' },
    { icon: Lock, label: 'SSL 加密 + MFA', sub: '端到端保护账户' },
    {
      icon: Star,
      label: `${stats.avgRating.toFixed(1)} / 5 用户评分`,
      sub: `${stats.reviews.toLocaleString()} 条真实评价`,
    },
    {
      icon: TrendingUp,
      label: `${stats.totalSold.toLocaleString()} 笔已达成`,
      sub: '透明成交，永久可查',
    },
    {
      icon: Users,
      label: `${stats.totalUsers.toLocaleString()} + 注册用户`,
      sub: '来自 20+ 国家和地区',
    },
  ];

  return (
    <section className="border-y border-border bg-muted/30 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div
              key={it.label}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground leading-tight truncate">
                  {it.label}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">{it.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TrustBar;
