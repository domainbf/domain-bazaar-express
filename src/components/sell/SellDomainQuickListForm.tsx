import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, ArrowUpRight, Shield, Eye, Tag, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CURRENCIES = [
  { id: 'CNY', sym: '¥', label: '人民币 CNY' },
  { id: 'USD', sym: '$', label: '美元 USD' },
  { id: 'EUR', sym: '€', label: '欧元 EUR' },
  { id: 'HKD', sym: 'HK$', label: '港币 HKD' },
];

// Heuristic price suggestion in CNY:
// short/keyword TLDs get big multipliers; scales up for very short names.
const suggestPriceCNY = (name: string): { low: number; mid: number; high: number } => {
  const clean = name.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!clean || !clean.includes('.')) return { low: 0, mid: 0, high: 0 };
  const dot = clean.lastIndexOf('.');
  const base = clean.slice(0, dot);
  const tld = clean.slice(dot);
  const len = base.length;

  const tldFactor: Record<string, number> = {
    '.com': 4, '.cn': 2.5, '.net': 1.6, '.io': 3, '.ai': 4.5,
    '.app': 2.2, '.co': 2, '.org': 1.4, '.me': 1.3, '.dev': 1.6,
    '.xyz': 0.6, '.top': 0.4, '.info': 0.5,
  };
  const tf = tldFactor[tld] ?? 1;

  // Base by length
  let base_ = 4000;
  if (len <= 2) base_ = 500_000;
  else if (len === 3) base_ = 120_000;
  else if (len === 4) base_ = 30_000;
  else if (len === 5) base_ = 12_000;
  else if (len <= 7) base_ = 6_000;
  else if (len <= 10) base_ = 3_000;
  else base_ = 1_200;

  const pureNum = /^\d+$/.test(base);
  const alphaOnly = /^[a-z]+$/.test(base);
  if (pureNum) base_ *= 1.4;
  if (alphaOnly) base_ *= 1.2;

  const mid = Math.round(base_ * tf);
  const low = Math.round(mid * 0.6);
  const high = Math.round(mid * 1.8);
  return { low, mid, high };
};

const fmt = (n: number, sym: string) => `${sym}${n.toLocaleString()}`;

export const SellDomainQuickListForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('CNY');
  const [description, setDescription] = useState('');
  const [saleType, setSaleType] = useState<'fixed' | 'offer'>('fixed');

  const sym = CURRENCIES.find(c => c.id === currency)?.sym ?? '¥';
  const suggestion = useMemo(() => suggestPriceCNY(name), [name]);
  const clean = name.trim().toLowerCase();
  const valid = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(clean);
  const priceNum = Number(price);
  const canSubmit = valid && (saleType === 'offer' || priceNum > 0);

  const applySuggestion = (v: number) => {
    // Convert CNY -> chosen currency with rough factors (display only).
    const cnyRate: Record<string, number> = { CNY: 1, USD: 0.14, EUR: 0.13, HKD: 1.1 };
    const rate = cnyRate[currency] ?? 1;
    setPrice(String(Math.max(1, Math.round(v * rate))));
  };

  const handleGo = () => {
    if (!user) { toast.info('请先登录后继续上架'); navigate('/auth'); return; }
    if (!canSubmit) { toast.error('请填写有效的域名与价格'); return; }
    const params = new URLSearchParams({
      name: clean, price: price || '', currency, saleType, description,
    });
    // Go to user domain management with prefilled form.
    navigate(`/user-center?tab=domains&new=1&${params.toString()}`);
  };

  return (
    <section className="py-14 md:py-20 bg-muted/30 border-y border-border/60">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3">
            <Wand2 className="h-3 w-3 mr-1" />快速上架
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">30 秒预填上架信息</h2>
          <p className="text-muted-foreground text-sm">
            输入域名和价格，系统即时提供估价参考并生成上架预览
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Form */}
          <Card className="p-5 md:p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">域名</label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="例如：yourname.com"
                className="h-11"
                data-testid="quick-list-name"
              />
              {name && !valid && (
                <p className="text-xs text-destructive">请输入完整的域名（含后缀）</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-muted-foreground">价格</label>
                <Input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder={saleType === 'offer' ? '接受报价（可留空）' : '设置一口价'}
                  className="h-11"
                  disabled={saleType === 'offer'}
                  data-testid="quick-list-price"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">币种</label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-11" data-testid="quick-list-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.sym} {c.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              {(['fixed', 'offer'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSaleType(t)}
                  className={cn(
                    'flex-1 text-xs h-9 rounded-lg border transition-colors font-medium',
                    saleType === t
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-muted-foreground border-border hover:text-foreground',
                  )}
                  data-testid={`quick-list-saletype-${t}`}
                >
                  {t === 'fixed' ? '固定一口价' : '仅接受报价'}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">简介（可选）</label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="30 字以内亮点介绍，帮助买家快速了解..."
                maxLength={140}
                className="min-h-[70px] resize-none"
                data-testid="quick-list-desc"
              />
            </div>

            {/* Suggestion */}
            {valid && suggestion.mid > 0 && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                <p className="text-xs font-medium flex items-center gap-1.5 text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI 估价参考（人民币）
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { label: '保守', v: suggestion.low },
                    { label: '推荐', v: suggestion.mid },
                    { label: '进取', v: suggestion.high },
                  ].map(s => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => applySuggestion(s.v)}
                      className="text-xs px-2.5 py-1 rounded-full bg-background border border-border hover:border-primary hover:text-primary transition-colors"
                      data-testid={`quick-list-suggest-${s.label}`}
                    >
                      {s.label} ¥{s.v.toLocaleString()}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  * 根据长度/后缀热度估算，仅供参考。点击应用到价格字段（自动换算币种）。
                </p>
              </div>
            )}

            <Button
              onClick={handleGo}
              disabled={!canSubmit}
              size="lg"
              className="w-full font-bold"
              data-testid="quick-list-submit"
            >
              继续完善并上架
              <ArrowUpRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Card>

          {/* Live Preview Card */}
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              上架效果预览
            </p>
            <div
              className={cn(
                'group relative block overflow-hidden isolate rounded-2xl border border-white/10',
                'bg-gradient-to-br from-neutral-900 via-neutral-950 to-black text-white',
                'p-6 sm:p-8 min-h-[280px] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)]',
              )}
            >
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.10] pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle at 20% 20%, currentColor 1.2px, transparent 1.2px)',
                  backgroundSize: '18px 18px',
                }}
              />
              <div className="relative flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold bg-white/10 text-white px-2.5 py-1 rounded-full">
                    {saleType === 'fixed' ? '一口价' : '接受报价'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-white/60">
                    <Shield className="h-3 w-3" />上架预览
                  </span>
                </div>

                <h3 className={cn(
                  'font-black uppercase tracking-tight leading-[0.95] break-all text-white',
                  'my-4',
                  (name.length <= 10) ? 'text-4xl sm:text-6xl' :
                  (name.length <= 16) ? 'text-3xl sm:text-5xl' :
                  (name.length <= 22) ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-3xl',
                )}>
                  {clean || 'yourdomain.com'}
                </h3>

                {description && (
                  <p className="text-sm text-white/70 line-clamp-2 mb-3">{description}</p>
                )}

                <div className="mt-auto flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">
                      {saleType === 'fixed' ? '一口价' : '起始报价'}
                    </p>
                    <p className="font-bold text-2xl sm:text-3xl text-white tabular-nums">
                      {priceNum > 0 ? fmt(priceNum, sym) : '—'}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-xs text-white/70">
                    <Eye className="h-3.5 w-3.5" /> 预览
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-background border border-border">
                <p className="text-muted-foreground text-[10px] uppercase">上架费用</p>
                <p className="font-bold text-emerald-600">免费</p>
              </div>
              <div className="p-2.5 rounded-lg bg-background border border-border">
                <p className="text-muted-foreground text-[10px] uppercase">成交手续费</p>
                <p className="font-bold">5%</p>
              </div>
              <div className="p-2.5 rounded-lg bg-background border border-border">
                <p className="text-muted-foreground text-[10px] uppercase">资金托管</p>
                <p className="font-bold text-primary">✓ 保障</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
