import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Check,
  ShieldCheck,
  Lock,
  Zap,
  Mail,
  Globe2,
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  CreditCard,
  Loader2,
  ShoppingCart,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { apiGet } from '@/lib/apiClient';
import { DomainListing } from '@/types/domain';
import { cn } from '@/lib/utils';

// ── Types ───────────────────────────────────────────────────────
interface CartItem {
  id: string;
  name: string;
  price: number;
  currency: 'CNY' | 'USD';
  years: number;
}

interface Addon {
  key: string;
  title: string;
  desc: string;
  price: number; // CNY / year
  icon: any;
  recommended?: boolean;
}

const ADDONS: Addon[] = [
  { key: 'email', title: '专业邮箱', desc: '1 个 you@yourdomain 邮箱，10GB 存储', price: 49, icon: Mail },
  { key: 'dns', title: '高级 DNS', desc: '全球任播、DNSSEC、更高解析并发', price: 29, icon: Globe2, recommended: true },
  { key: 'monitor', title: '域名健康监控', desc: '7×24 状态监控与到期提醒', price: 19, icon: Sparkles },
];

const STEPS = [
  { key: 'search', label: '搜索' },
  { key: 'select', label: '选择域名' },
  { key: 'configure', label: '配置' },
  { key: 'review', label: '确认支付' },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

const fmt = (v: number, cur: 'CNY' | 'USD' = 'CNY') =>
  `${cur === 'USD' ? '$' : '¥'}${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

// Renewal price heuristic: use 30% of first-year price, min ¥68
const renewalOf = (p: number) => Math.max(Math.round(p * 0.3), 68);

// ─── Component ──────────────────────────────────────────────────
export default function CheckoutPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState<StepKey>('search');
  const [query, setQuery] = useState('');
  const [available, setAvailable] = useState<DomainListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addons, setAddons] = useState<Record<string, boolean>>({});
  const [nameservers, setNameservers] = useState<'default' | 'custom'>('default');
  const [customNs, setCustomNs] = useState({ ns1: '', ns2: '' });
  const [autoRenew, setAutoRenew] = useState(true);
  const [pay, setPay] = useState<'alipay' | 'wechat' | 'card'>('alipay');
  const [processing, setProcessing] = useState(false);

  // Load listings for search + preselect via ?domain= or ?ids=
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiGet<{ data: DomainListing[] }>('/data/domains?status=available&limit=60')
      .then((r) => {
        if (cancelled) return;
        const list = (r?.data ?? []) as DomainListing[];
        setAvailable(list);

        const preName = params.get('domain');
        const preIds = params.get('ids')?.split(',').filter(Boolean) ?? [];
        const seeds: CartItem[] = [];
        if (preName) {
          const m = list.find((d) => d.name.toLowerCase() === preName.toLowerCase());
          if (m)
            seeds.push({
              id: m.id,
              name: m.name,
              price: Number(m.price) || 0,
              currency: (m.currency as any) || 'CNY',
              years: 1,
            });
        }
        for (const id of preIds) {
          const m = list.find((d) => d.id === id);
          if (m && !seeds.some((s) => s.id === m.id))
            seeds.push({
              id: m.id,
              name: m.name,
              price: Number(m.price) || 0,
              currency: (m.currency as any) || 'CNY',
              years: 1,
            });
        }
        if (seeds.length) {
          setCart(seeds);
          setStep('select');
        }
      })
      .catch(() => toast.error('加载域名列表失败'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [params]);

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available.slice(0, 12);
    return available.filter((d) => d.name.toLowerCase().includes(q)).slice(0, 12);
  }, [query, available]);

  const inCart = (id: string) => cart.some((c) => c.id === id);
  const addToCart = (d: DomainListing) => {
    if (inCart(d.id)) return;
    setCart((c) => [
      ...c,
      { id: d.id, name: d.name, price: Number(d.price) || 0, currency: (d.currency as any) || 'CNY', years: 1 },
    ]);
    toast.success(`${d.name} 已加入订单`);
  };
  const removeFromCart = (id: string) => setCart((c) => c.filter((x) => x.id !== id));
  const setYears = (id: string, years: number) =>
    setCart((c) => c.map((x) => (x.id === id ? { ...x, years } : x)));

  // Totals (normalize to CNY for the summary; keep item display currency)
  const toCny = (v: number, cur: 'CNY' | 'USD') => (cur === 'USD' ? v * 7.2 : v);
  const domainTotal = cart.reduce((s, i) => s + toCny(i.price * i.years, i.currency), 0);
  const addonTotal = cart.length
    ? ADDONS.filter((a) => addons[a.key]).reduce((s, a) => s + a.price * cart.length, 0)
    : 0;
  const renewalYearly = cart.reduce((s, i) => s + renewalOf(toCny(i.price, i.currency)), 0);
  const total = domainTotal + addonTotal;

  const canGoNext =
    (step === 'search' && cart.length > 0) ||
    (step === 'select' && cart.length > 0) ||
    (step === 'configure' && (nameservers === 'default' || (customNs.ns1 && customNs.ns2))) ||
    step === 'review';

  const next = () => {
    const i = STEPS.findIndex((s) => s.key === step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1].key);
  };
  const prev = () => {
    const i = STEPS.findIndex((s) => s.key === step);
    if (i > 0) setStep(STEPS[i - 1].key);
  };

  const submit = async () => {
    setProcessing(true);
    // Simulate order submission — real payment would kick off Alipay/WeChat/Stripe here
    await new Promise((r) => setTimeout(r, 900));
    const orderId = `DV-${Date.now().toString().slice(-8)}`;
    const payload = {
      orderId,
      total: Math.round(total),
      renewalYearly: Math.round(renewalYearly),
      items: cart,
      addons: ADDONS.filter((a) => addons[a.key]),
      nameservers,
      customNs,
      autoRenew,
      pay,
      when: new Date().toISOString(),
    };
    try {
      sessionStorage.setItem(`checkout:${orderId}`, JSON.stringify(payload));
    } catch {}
    navigate(`/checkout/success?order=${orderId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 pt-20 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">安全结账</h1>
            <p className="text-sm text-muted-foreground mt-1">4 步完成注册 · 每步均可返回修改</p>
          </div>
          <Link to="/marketplace">
            <Button variant="ghost" size="sm">
              <X className="w-4 h-4 mr-1" /> 取消
            </Button>
          </Link>
        </div>

        {/* Stepper */}
        <div className="rounded-2xl border border-border bg-card p-4 md:p-5 mb-6">
          <div className="flex items-center justify-between gap-2">
            {STEPS.map((s, i) => {
              const done = i < stepIndex;
              const active = i === stepIndex;
              return (
                <button
                  key={s.key}
                  onClick={() => i <= stepIndex && setStep(s.key)}
                  className="flex-1 flex items-center gap-2 min-w-0"
                >
                  <div
                    className={cn(
                      'shrink-0 w-8 h-8 rounded-full grid place-items-center text-xs font-semibold transition-all',
                      done && 'bg-success text-success-foreground',
                      active && 'bg-gradient-primary text-primary-foreground shadow-elegant',
                      !done && !active && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {done ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      'text-xs md:text-sm font-medium truncate hidden sm:inline',
                      active ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn('flex-1 h-px mx-2', done ? 'bg-success/50' : 'bg-border')}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr,340px] gap-6">
          {/* Main */}
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {step === 'search' && (
                  <SearchStep
                    query={query}
                    setQuery={setQuery}
                    loading={loading}
                    filtered={filtered}
                    inCart={inCart}
                    addToCart={addToCart}
                    cartCount={cart.length}
                  />
                )}
                {step === 'select' && (
                  <SelectStep
                    cart={cart}
                    removeFromCart={removeFromCart}
                    setYears={setYears}
                    onBack={() => setStep('search')}
                  />
                )}
                {step === 'configure' && (
                  <ConfigureStep
                    addons={addons}
                    setAddons={setAddons}
                    nameservers={nameservers}
                    setNameservers={setNameservers}
                    customNs={customNs}
                    setCustomNs={setCustomNs}
                    autoRenew={autoRenew}
                    setAutoRenew={setAutoRenew}
                    domainCount={cart.length}
                  />
                )}
                {step === 'review' && (
                  <ReviewStep
                    cart={cart}
                    addons={ADDONS.filter((a) => addons[a.key])}
                    nameservers={nameservers}
                    customNs={customNs}
                    autoRenew={autoRenew}
                    pay={pay}
                    setPay={setPay}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Nav buttons */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={prev} disabled={stepIndex === 0}>
                <ChevronLeft className="w-4 h-4 mr-1" /> 上一步
              </Button>
              {step !== 'review' ? (
                <Button
                  onClick={next}
                  disabled={!canGoNext}
                  className="bg-gradient-primary text-primary-foreground border-0 min-w-32"
                >
                  下一步 <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={submit}
                  disabled={processing || cart.length === 0}
                  className="bg-gradient-primary text-primary-foreground border-0 min-w-40"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4 mr-1.5" />
                  )}
                  {processing ? '正在提交…' : `安全支付 ${fmt(total)}`}
                </Button>
              )}
            </div>
          </div>

          {/* Order summary sidebar */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                <div className="font-semibold text-sm">订单摘要</div>
                <span className="ml-auto text-xs text-muted-foreground">
                  {cart.length} 个域名
                </span>
              </div>

              <div className="p-5 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    还没有添加域名
                  </div>
                ) : (
                  <>
                    {cart.map((i) => (
                      <div key={i.id} className="text-sm">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-mono font-medium truncate">{i.name}</span>
                          <span className="tabular-nums font-semibold">
                            {fmt(i.price * i.years, i.currency)}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {i.years} 年 · 续费 {fmt(renewalOf(toCny(i.price, i.currency)))}/年
                        </div>
                      </div>
                    ))}

                    {ADDONS.filter((a) => addons[a.key]).length > 0 && (
                      <div className="pt-3 mt-3 border-t border-border space-y-1.5">
                        {ADDONS.filter((a) => addons[a.key]).map((a) => (
                          <div key={a.key} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              {a.title} × {cart.length}
                            </span>
                            <span className="tabular-nums">{fmt(a.price * cart.length)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 mt-3 border-t border-border">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm text-muted-foreground">应付总额</span>
                        <span className="text-2xl font-bold gradient-text tabular-nums">
                          {fmt(Math.round(total))}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        次年续费预估 <b className="tabular-nums">{fmt(Math.round(renewalYearly))}</b> /年
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Trust badges */}
              <div className="px-5 pb-5 grid grid-cols-2 gap-2">
                <TrustBadge icon={ShieldCheck} title="WHOIS 隐私" tone="success" />
                <TrustBadge icon={Lock} title="免费 SSL" tone="success" />
                <TrustBadge icon={Zap} title="即时激活" tone="primary" />
                <TrustBadge icon={RefreshCw} title="30 天退款" tone="primary" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Search ─────────────────────────────────────────────
function SearchStep({
  query,
  setQuery,
  loading,
  filtered,
  inCart,
  addToCart,
  cartCount,
}: {
  query: string;
  setQuery: (v: string) => void;
  loading: boolean;
  filtered: DomainListing[];
  inCart: (id: string) => boolean;
  addToCart: (d: DomainListing) => void;
  cartCount: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 rounded-full px-3 py-1 mb-3">
          <Sparkles className="w-3 h-3" /> 第 1 步
        </div>
        <h2 className="text-2xl md:text-3xl font-bold">找到你的完美域名</h2>
        <p className="text-sm text-muted-foreground mt-2">
          搜索可用域名或从推荐中挑选，可一次加入多个
        </p>
      </div>

      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入你想要的域名，例如 example.com"
          className="pl-12 h-14 text-base rounded-2xl border-2 focus-visible:ring-primary/30"
          autoFocus
        />
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> 加载可用域名…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            没有匹配的可用域名，换个关键词试试
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {filtered.map((d) => {
              const active = inCart(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => addToCart(d)}
                  className={cn(
                    'group flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all',
                    active
                      ? 'border-success/40 bg-success/5'
                      : 'border-border hover:border-primary/40 hover:bg-primary/[0.03]'
                  )}
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-lg grid place-items-center shrink-0',
                      active ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                    )}
                  >
                    {active ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-sm font-semibold truncate">{d.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      首年 {fmt(Number(d.price) || 0, (d.currency as any) || 'CNY')} · 续费 {fmt(renewalOf(Number(d.price) || 0))}/年
                    </div>
                  </div>
                  {d.is_verified && (
                    <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {cartCount > 0 && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          已选 {cartCount} 个域名，点右下角"下一步"继续
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Select / Review cart ───────────────────────────────
function SelectStep({
  cart,
  removeFromCart,
  setYears,
  onBack,
}: {
  cart: CartItem[];
  removeFromCart: (id: string) => void;
  setYears: (id: string, y: number) => void;
  onBack: () => void;
}) {
  if (cart.length === 0)
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <ShoppingCart className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">购物车是空的，请返回选择域名</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          返回搜索
        </Button>
      </div>
    );

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="mb-5">
        <h2 className="text-xl md:text-2xl font-bold">确认你的选择</h2>
        <p className="text-sm text-muted-foreground mt-1">
          调整注册年限，长期注册可享更稳定的价格
        </p>
      </div>

      <div className="space-y-3">
        {cart.map((i) => (
          <div
            key={i.id}
            className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background/50"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-primary text-primary-foreground grid place-items-center font-mono font-bold shrink-0">
              {i.name[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-mono font-semibold truncate">{i.name}</div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Badge variant="outline" className="border-success/30 text-success bg-success/5 font-normal">
                  首年 {fmt(i.price, i.currency)}
                </Badge>
                <span>续费 {fmt(renewalOf(i.currency === 'USD' ? i.price * 7.2 : i.price))}/年</span>
              </div>
            </div>
            <select
              value={i.years}
              onChange={(e) => setYears(i.id, Number(e.target.value))}
              className="text-sm bg-background border border-border rounded-lg px-2 py-1.5 hover:border-primary/40"
            >
              {[1, 2, 3, 5, 10].map((y) => (
                <option key={y} value={y}>
                  {y} 年
                </option>
              ))}
            </select>
            <button
              onClick={() => removeFromCart(i.id)}
              className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/5"
              title="移除"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 p-4 rounded-xl bg-success/5 border border-success/20 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-success shrink-0" />
        <div className="text-sm">
          <b>WHOIS 隐私保护</b> 与 <b>免费 SSL 证书</b> 已默认包含 · 无需额外付费
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Configure ──────────────────────────────────────────
function ConfigureStep({
  addons,
  setAddons,
  nameservers,
  setNameservers,
  customNs,
  setCustomNs,
  autoRenew,
  setAutoRenew,
  domainCount,
}: {
  addons: Record<string, boolean>;
  setAddons: (v: Record<string, boolean>) => void;
  nameservers: 'default' | 'custom';
  setNameservers: (v: 'default' | 'custom') => void;
  customNs: { ns1: string; ns2: string };
  setCustomNs: (v: { ns1: string; ns2: string }) => void;
  autoRenew: boolean;
  setAutoRenew: (v: boolean) => void;
  domainCount: number;
}) {
  return (
    <div className="space-y-4">
      {/* Included */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> 默认包含
        </h3>
        <div className="grid sm:grid-cols-2 gap-2">
          <IncludedRow icon={ShieldCheck} title="WHOIS 隐私保护" desc="隐藏你的联系信息，防止骚扰" />
          <IncludedRow icon={Lock} title="免费 SSL 证书" desc="自动申请、自动续期、A+ 评级" />
          <IncludedRow icon={Zap} title="即时激活" desc="注册后 60 秒内生效" />
          <IncludedRow icon={RefreshCw} title="30 天退款保障" desc="不满意可申请全额退款" />
        </div>
      </div>

      {/* Addons — no pre-checks */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-1">可选增值服务</h3>
        <p className="text-xs text-muted-foreground mb-4">
          全部默认<b>未勾选</b> · 你完全掌控要不要添加
        </p>
        <div className="space-y-2">
          {ADDONS.map((a) => {
            const on = !!addons[a.key];
            const Icon = a.icon;
            return (
              <label
                key={a.key}
                className={cn(
                  'flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all',
                  on
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border hover:border-primary/30'
                )}
              >
                <Checkbox
                  checked={on}
                  onCheckedChange={(v) => setAddons({ ...addons, [a.key]: !!v })}
                />
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg grid place-items-center shrink-0',
                    on ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium flex items-center gap-2">
                    {a.title}
                    {a.recommended && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 text-[10px] py-0 px-1.5">
                        推荐
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{a.desc}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold tabular-nums">{fmt(a.price)}</div>
                  <div className="text-[10px] text-muted-foreground">
                    /年 × {domainCount || 1}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* DNS */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-primary" /> 域名服务器 (DNS)
        </h3>
        <RadioGroup value={nameservers} onValueChange={(v) => setNameservers(v as any)}>
          <label className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/30 cursor-pointer">
            <RadioGroupItem value="default" id="ns-default" className="mt-0.5" />
            <div className="flex-1">
              <Label htmlFor="ns-default" className="cursor-pointer font-medium">
                使用默认 DNS <span className="text-xs text-muted-foreground ml-1">(推荐)</span>
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                ns1.domainseeu.com · ns2.domainseeu.com · 全球任播加速
              </p>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/30 cursor-pointer">
            <RadioGroupItem value="custom" id="ns-custom" className="mt-0.5" />
            <div className="flex-1">
              <Label htmlFor="ns-custom" className="cursor-pointer font-medium">
                使用自定义 DNS
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">已托管在 Cloudflare、Vercel 等平台时使用</p>
              {nameservers === 'custom' && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Input
                    placeholder="ns1.example.com"
                    value={customNs.ns1}
                    onChange={(e) => setCustomNs({ ...customNs, ns1: e.target.value })}
                  />
                  <Input
                    placeholder="ns2.example.com"
                    value={customNs.ns2}
                    onChange={(e) => setCustomNs({ ...customNs, ns2: e.target.value })}
                  />
                </div>
              )}
            </div>
          </label>
        </RadioGroup>
      </div>

      {/* Auto renew */}
      <label className="rounded-2xl border border-border bg-card p-5 flex items-center gap-3 cursor-pointer">
        <Checkbox checked={autoRenew} onCheckedChange={(v) => setAutoRenew(!!v)} />
        <div className="flex-1">
          <div className="font-medium text-sm">开启自动续费</div>
          <div className="text-xs text-muted-foreground">避免因错过续期而失去域名，可随时在管理面板关闭</div>
        </div>
        <RefreshCw className="w-4 h-4 text-primary" />
      </label>
    </div>
  );
}

// ─── Step 4: Review & Pay ───────────────────────────────────────
function ReviewStep({
  cart,
  addons,
  nameservers,
  customNs,
  autoRenew,
  pay,
  setPay,
}: {
  cart: CartItem[];
  addons: Addon[];
  nameservers: 'default' | 'custom';
  customNs: { ns1: string; ns2: string };
  autoRenew: boolean;
  pay: 'alipay' | 'wechat' | 'card';
  setPay: (v: 'alipay' | 'wechat' | 'card') => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">最后确认</h3>
        <div className="space-y-3 text-sm">
          <ReviewRow label="域名">
            <div className="text-right space-y-0.5">
              {cart.map((c) => (
                <div key={c.id} className="font-mono">
                  {c.name} <span className="text-muted-foreground">· {c.years}年</span>
                </div>
              ))}
            </div>
          </ReviewRow>
          <ReviewRow label="增值服务">
            <span>
              {addons.length ? addons.map((a) => a.title).join('、') : '无'}
            </span>
          </ReviewRow>
          <ReviewRow label="DNS">
            <span>
              {nameservers === 'default'
                ? '默认 (推荐)'
                : `${customNs.ns1 || '—'} / ${customNs.ns2 || '—'}`}
            </span>
          </ReviewRow>
          <ReviewRow label="自动续费">
            <span className={autoRenew ? 'text-success' : 'text-muted-foreground'}>
              {autoRenew ? '已开启' : '未开启'}
            </span>
          </ReviewRow>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" /> 支付方式
        </h3>
        <div className="grid sm:grid-cols-3 gap-2">
          {[
            { k: 'alipay' as const, label: '支付宝', hint: '扫码支付' },
            { k: 'wechat' as const, label: '微信支付', hint: '扫码支付' },
            { k: 'card' as const, label: '信用卡', hint: 'Visa / Master' },
          ].map((p) => {
            const on = pay === p.k;
            return (
              <button
                key={p.k}
                onClick={() => setPay(p.k)}
                className={cn(
                  'p-3.5 rounded-xl border text-left transition-all',
                  on ? 'border-primary bg-primary/5 shadow-elegant' : 'border-border hover:border-primary/40'
                )}
              >
                <div className="text-sm font-medium">{p.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{p.hint}</div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3.5 h-3.5" /> 全程 TLS 加密 · 30 天无理由退款保障
        </div>
      </div>
    </div>
  );
}

// ─── Small helpers ──────────────────────────────────────────────
const IncludedRow = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-success/5 border border-success/15">
    <div className="w-8 h-8 rounded-lg bg-success/10 text-success grid place-items-center shrink-0">
      <Icon className="w-4 h-4" />
    </div>
    <div className="min-w-0">
      <div className="text-sm font-medium flex items-center gap-1.5">
        {title}
        <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/10 text-[10px] py-0 px-1.5">
          免费
        </Badge>
      </div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  </div>
);

const TrustBadge = ({
  icon: Icon,
  title,
  tone,
}: {
  icon: any;
  title: string;
  tone: 'success' | 'primary';
}) => (
  <div
    className={cn(
      'flex items-center gap-2 p-2.5 rounded-lg border text-xs',
      tone === 'success'
        ? 'bg-success/5 border-success/15 text-success'
        : 'bg-primary/5 border-primary/15 text-primary'
    )}
  >
    <Icon className="w-3.5 h-3.5 shrink-0" />
    <span className="font-medium truncate">{title}</span>
  </div>
);

const ReviewRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-b-0">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <div className="text-right">{children}</div>
  </div>
);
