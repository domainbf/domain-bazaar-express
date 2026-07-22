import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Sparkles,
  Copy,
  Download,
  ArrowRight,
  ShieldCheck,
  Lock,
  Zap,
  Mail,
  Globe2,
  Rocket,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { OrderProgressTracker } from '@/components/order/OrderProgressTracker';

interface Order {
  orderId: string;
  total: number;
  renewalYearly: number;
  items: { id: string; name: string; price: number; currency: 'CNY' | 'USD'; years: number }[];
  addons: { key: string; title: string; price: number }[];
  nameservers: 'default' | 'custom';
  customNs: { ns1: string; ns2: string };
  autoRenew: boolean;
  pay: string;
  when: string;
}

interface RealOrder {
  id: string;
  order_number: string | null;
  amount: number;
  currency: string;
  payment_method: string | null;
  progress_stage: string;
  stage_history: Record<string, string>;
}

const symOf = (c: string) => (c === 'USD' ? '$' : c === 'EUR' ? '€' : c === 'GBP' ? '£' : '¥');
const fmt = (v: number, c = 'CNY') =>
  `${symOf(c)}${Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

export default function CheckoutSuccessPage() {
  const [params] = useSearchParams();
  const orderId = params.get('order') ?? params.get('id') ?? '';
  const [order, setOrder] = useState<Order | null>(null);
  const [real, setReal] = useState<RealOrder | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`checkout:${orderId}`);
      if (raw) setOrder(JSON.parse(raw));
    } catch {}
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      const { data } = await supabase
        .from('transactions')
        .select('id, order_number, amount, currency, payment_method, progress_stage, stage_history')
        .or(`id.eq.${orderId},order_number.eq.${orderId}`)
        .maybeSingle();
      if (data) setReal(data as any);
    })();
  }, [orderId]);

  const displayOrderNo = real?.order_number || orderId || '—';
  const copy = () => {
    navigator.clipboard.writeText(displayOrderNo).then(() => toast.success('订单号已复制'));
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />

      {/* Aurora glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] hero-aurora opacity-40" />

      <div className="relative max-w-3xl mx-auto px-4 pt-24 pb-20">
        {/* Success mark */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4 }}
          className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-success/20 to-success/5 border border-success/30 grid place-items-center mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-success" />
        </motion.div>

        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/10 mb-3">
            <Sparkles className="w-3 h-3 mr-1" /> 支付成功
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">恭喜，你的域名已激活</h1>
          <p className="text-muted-foreground mt-2">
            我们已开始设置 DNS 与 SSL，通常在几分钟内完成
          </p>
        </motion.div>

        {/* Order card */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 rounded-2xl border border-border bg-card overflow-hidden shadow-elegant"
        >
          <div className="px-6 py-5 border-b border-border flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">订单号</div>
              <div className="font-mono font-semibold mt-0.5">{orderId || '—'}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={copy}>
                <Copy className="w-3.5 h-3.5 mr-1.5" /> 复制
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.print()}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> 收据
              </Button>
            </div>
          </div>

          {order ? (
            <>
              <div className="p-6 space-y-2.5">
                {order.items.map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gradient-primary text-primary-foreground grid place-items-center font-mono font-bold shrink-0">
                      {i.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono font-semibold truncate">{i.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {i.years} 年注册 · 续费 {fmt(
                          Math.max(Math.round((i.currency === 'USD' ? i.price * 7.2 : i.price) * 0.3), 68)
                        )}/年
                      </div>
                    </div>
                    <div className="text-sm font-semibold tabular-nums shrink-0">
                      {i.currency === 'USD' ? '$' : '¥'}
                      {(i.price * i.years).toLocaleString()}
                    </div>
                  </div>
                ))}

                {order.addons?.length > 0 && (
                  <div className="pt-2">
                    <div className="text-xs text-muted-foreground mb-1.5">增值服务</div>
                    <div className="flex flex-wrap gap-1.5">
                      {order.addons.map((a) => (
                        <Badge key={a.key} variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                          {a.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-muted/30 border-t border-border">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">已支付</span>
                  <span className="text-2xl font-bold gradient-text tabular-nums">
                    {fmt(order.total)}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between text-xs text-muted-foreground">
                  <span>次年续费预估</span>
                  <span className="tabular-nums">{fmt(order.renewalYearly)}/年</span>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              订单详情已过期，请到"用户中心 → 我的订单"查看完整信息
            </div>
          )}
        </motion.div>

        {/* Included */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 grid sm:grid-cols-2 gap-2"
        >
          {[
            { icon: ShieldCheck, t: 'WHOIS 隐私已启用' },
            { icon: Lock, t: '免费 SSL 证书正在签发' },
            { icon: Zap, t: 'DNS 已即时生效' },
            { icon: Rocket, t: '30 天退款保障' },
          ].map((x, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-success/5 border border-success/15 text-sm"
            >
              <x.icon className="w-4 h-4 text-success shrink-0" />
              <span>{x.t}</span>
            </div>
          ))}
        </motion.div>

        {/* Next steps */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            接下来
          </h3>
          <div className="grid md:grid-cols-3 gap-3">
            <NextCard
              icon={Globe2}
              title="配置 DNS"
              desc="添加 A / CNAME 记录，指向你的服务器"
              to="/portfolio"
            />
            <NextCard
              icon={Mail}
              title="设置邮箱"
              desc="添加邮件转发或开通企业邮箱"
              to="/portfolio"
            />
            <NextCard
              icon={Rocket}
              title="连接建站"
              desc="一键连接 Vercel、Cloudflare 等平台"
              to="/portfolio"
            />
          </div>
        </motion.div>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
          <Link to="/portfolio">
            <Button className="bg-gradient-primary text-primary-foreground border-0 min-w-48">
              进入我的域名 <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
          <Link to="/marketplace">
            <Button variant="outline">继续购买其他域名</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

const NextCard = ({
  icon: Icon,
  title,
  desc,
  to,
}: {
  icon: any;
  title: string;
  desc: string;
  to: string;
}) => (
  <Link
    to={to}
    className="group p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-elegant transition-all"
  >
    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center mb-3 group-hover:scale-105 transition-transform">
      <Icon className="w-5 h-5" />
    </div>
    <div className="text-sm font-semibold">{title}</div>
    <div className="text-xs text-muted-foreground mt-1">{desc}</div>
    <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
      开始 <ArrowRight className="w-3 h-3" />
    </div>
  </Link>
);
