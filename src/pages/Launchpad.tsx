import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Globe,
  Clock,
  Wallet,
  Inbox,
  TrendingUp,
  Sparkles,
  Settings2,
  Plus,
  Gavel,
  Heart,
  Bell,
  ShieldCheck,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet } from '@/lib/apiClient';
import { DomainListing, DomainOffer } from '@/types/domain';
import { useNotifications } from '@/hooks/useNotifications';

// ── Module registry ────────────────────────────────────────────
type ModuleKey =
  | 'portfolio'
  | 'offers'
  | 'auctions'
  | 'watchlist'
  | 'transactions'
  | 'valuation'
  | 'monitor'
  | 'verification';

interface ModuleDef {
  key: ModuleKey;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  cta: string;
}

const MODULES: ModuleDef[] = [
  { key: 'portfolio', title: '域名组合', desc: '按状态、价值管理你的全部域名', icon: Globe, href: '/portfolio', cta: '打开组合' },
  { key: 'offers', title: '收到的报价', desc: '实时同步买家出价与议价', icon: Inbox, href: '/user-center?tab=offers', cta: '查看报价' },
  { key: 'auctions', title: '域名竞拍', desc: '创建或参与限时竞拍', icon: Gavel, href: '/auctions', cta: '前往竞拍' },
  { key: 'watchlist', title: '我的收藏', desc: '关注心仪域名的价格波动', icon: Heart, href: '/user-center?tab=favorites', cta: '打开收藏' },
  { key: 'transactions', title: '交易记录', desc: '担保交易的历史与状态', icon: Wallet, href: '/user-center?tab=transactions', cta: '查看交易' },
  { key: 'valuation', title: 'AI 估值', desc: '6 维模型智能评估域名价值', icon: TrendingUp, href: '/user-center?tab=valuation', cta: '开始评估' },
  { key: 'monitor', title: '域名监控', desc: '状态与到期时间实时提醒', icon: Bell, href: '/domain-monitor', cta: '打开监控' },
  { key: 'verification', title: '所有权验证', desc: 'DNS TXT 记录一键完成', icon: ShieldCheck, href: '/user-center?tab=verification', cta: '开始验证' },
];

const DEFAULT_ENABLED: ModuleKey[] = ['portfolio', 'offers', 'auctions', 'transactions', 'valuation', 'watchlist'];
const STORAGE_KEY = 'launchpad.modules.v2';

// ── Summary card ─────────────────────────────────────────────
const StatCard = ({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'primary',
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'primary' | 'success' | 'warning' | 'muted';
  href?: string;
}) => {
  const toneBg =
    tone === 'success'
      ? 'bg-success/10 text-success'
      : tone === 'warning'
        ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
        : tone === 'muted'
          ? 'bg-muted text-muted-foreground'
          : 'bg-primary/10 text-primary';

  const inner = (
    <div className="premium-surface p-5 md:p-6 h-full group hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className={`w-10 h-10 rounded-xl grid place-items-center ${toneBg}`}>
          <Icon className="w-5 h-5" />
        </div>
        {href && <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />}
      </div>
      <div className="mt-4">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-1.5 text-2xl md:text-3xl font-bold text-foreground tabular-nums tracking-tight">{value}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </div>
    </div>
  );

  return href ? <Link to={href}>{inner}</Link> : inner;
};




// ── Sortable module card ─────────────────────────────────────
const SortableModuleCard = ({ mod }: { mod: ModuleDef }) => {
  const Icon = mod.icon;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: mod.key });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="relative">
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="拖拽排序"
        className="absolute top-3 right-3 z-10 w-7 h-7 rounded-md grid place-items-center text-muted-foreground/70 hover:text-foreground hover:bg-accent cursor-grab active:cursor-grabbing touch-none"
        onClick={(e) => e.preventDefault()}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <Link
        to={mod.href}
        className="group relative flex flex-col justify-between p-5 md:p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant overflow-hidden h-full"
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/[0.06] to-transparent pointer-events-none" />
        <div className="relative">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4">
            <Icon className="w-5 h-5" />
          </div>
          <div className="text-base md:text-lg font-semibold text-foreground">{mod.title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{mod.desc}</div>
        </div>
        <div className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          {mod.cta}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Link>
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────
export default function Launchpad() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [domains, setDomains] = useState<DomainListing[]>([]);
  const [received, setReceived] = useState<DomainOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState<ModuleKey[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ModuleKey[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_ENABLED;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setEnabled((prev) => {
      const oldIndex = prev.indexOf(active.id as ModuleKey);
      const newIndex = prev.indexOf(over.id as ModuleKey);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };


  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
  }, [enabled]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [d, r] = await Promise.all([
          apiGet<DomainListing[]>('/data/my-domains').catch(() => []),
          apiGet<DomainOffer[]>('/data/domain-offers?role=seller').catch(() => []),
        ]);
        if (!ignore) {
          setDomains(d || []);
          setReceived(r || []);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [user?.id]);

  const stats = useMemo(() => {
    const total = domains.length;
    const active = domains.filter((d) => d.status === 'available' || d.status === 'active').length;
    const value = domains.reduce((sum, d) => sum + (Number(d.price) || 0), 0);
    const views = domains.reduce((sum, d) => sum + (Number(d.views) || 0), 0);
    const pendingOffers = received.filter((o) => o.status === 'pending' || !o.status).length;
    // 30d expiring approximation
    const now = Date.now();
    const expiring = domains.filter((d: any) => {
      const exp = d.expires_at || d.expiry_date;
      if (!exp) return false;
      const t = new Date(exp).getTime();
      return t > now && t - now < 30 * 24 * 3600 * 1000;
    }).length;
    return { total, active, value, views, pendingOffers, expiring };
  }, [domains, received]);

  const toggleModule = (k: ModuleKey) => {
    setEnabled((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  const activeModules = MODULES.filter((m) => enabled.includes(m.key));

  return (
    <div className="min-h-screen bg-background">
      <Navbar unreadCount={unreadCount} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap items-end justify-between gap-4 mb-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 mb-3 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium">
              <Sparkles className="w-3 h-3" /> 我的工作台
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              欢迎回来{user?.email ? `，${user.email.split('@')[0]}` : ''}
            </h1>
            <p className="mt-1.5 text-muted-foreground">一览你的域名资产、交易与工具。</p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/sell">
              <Button className="bg-gradient-primary text-primary-foreground border-0 hover:shadow-elegant transition-all">
                <Plus className="w-4 h-4 mr-1.5" /> 上架域名
              </Button>
            </Link>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-1.5">
                  <Settings2 className="w-4 h-4" /> 自定义
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-2">
                <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  显示的模块
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {MODULES.map((m) => {
                    const on = enabled.includes(m.key);
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.key}
                        onClick={() => toggleModule(m.key)}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{m.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{m.desc}</div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md border grid place-items-center shrink-0 ${
                            on ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                          }`}
                        >
                          {on && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </motion.div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-10">
          <StatCard icon={Globe} label="域名总数" value={loading ? '—' : stats.total} tone="primary" href="/portfolio" />
          <StatCard icon={Clock} label="30 天内到期" value={loading ? '—' : stats.expiring} tone="warning" />
          <StatCard
            icon={Wallet}
            label="组合价值"
            value={loading ? '—' : `¥${stats.value.toLocaleString()}`}
            tone="success"
            href="/portfolio"
          />
          <StatCard icon={Inbox} label="待处理报价" value={loading ? '—' : stats.pendingOffers} tone="primary" href="/user-center?tab=offers" />
          <StatCard icon={TrendingUp} label="累计访问" value={loading ? '—' : stats.views} tone="muted" />
          <StatCard icon={ShieldCheck} label="已在售" value={loading ? '—' : stats.active} tone="success" href="/portfolio" />
        </div>

        {/* Modules */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight">我的模块</h2>
            <p className="text-sm text-muted-foreground">按需拖入你需要的管理工具。</p>
          </div>
          <Badge variant="outline" className="rounded-full">
            {activeModules.length} / {MODULES.length}
          </Badge>
        </div>

        {activeModules.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {activeModules.map((m) => (
              <motion.div
                key={m.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ModuleCard mod={m} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="premium-surface p-10 text-center">
            <div className="text-muted-foreground">你还没有启用任何模块。点击右上角"自定义"添加。</div>
          </div>
        )}
      </div>
    </div>
  );
}
