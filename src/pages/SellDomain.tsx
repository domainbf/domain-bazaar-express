import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck, Zap, BarChart3, MessageSquare, Globe, CheckCircle2,
  ArrowRight, Star, Tag, Handshake, Clock, TrendingUp, Upload
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  {
    step: '01',
    icon: Upload,
    title: '上架域名',
    desc: '填写域名信息、定价策略，几分钟完成上架。支持固定价格或接受报价两种模式。',
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    step: '02',
    icon: ShieldCheck,
    title: '验证所有权',
    desc: '通过 DNS TXT 记录一键验证，获得"已认证"标识，买家更信任，成交率更高。',
    color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    step: '03',
    icon: MessageSquare,
    title: '与买家沟通',
    desc: '买家发起报价后，通过内置消息系统直接沟通，平台提供交易记录留存保障。',
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  },
  {
    step: '04',
    icon: Handshake,
    title: '安全完成交割',
    desc: '资金进入第三方托管，你完成域名转移后资金自动释放，交易全程有保障。',
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  },
];

const FEATURES = [
  { icon: Globe, title: '覆盖广泛的买家群体', desc: '平台注册买家持续增长，高意向用户实时浏览，精准匹配需求。' },
  { icon: BarChart3, title: '智能定价参考', desc: '内置 AI 估价工具，提供历史成交价、同类域名价格参考，让你定价更准确。' },
  { icon: Zap, title: '极速上架', desc: '最快 5 分钟完成上架流程，立即在市场中曝光，不需要任何技术背景。' },
  { icon: ShieldCheck, title: '资金安全有保障', desc: '买家付款后资金进入第三方托管账户，域名完成转移前资金不会释放给任何人。' },
  { icon: Clock, title: '全程状态追踪', desc: '交易每一步都有系统通知和进度记录，实时掌握交易动态。' },
  { icon: TrendingUp, title: '数据分析看板', desc: '查看每个域名的浏览量、收藏量、报价数，优化你的定价和描述策略。' },
];

const PRICING_TIERS = [
  { name: '基础挂牌', price: '免费', features: ['无限上架数量', '标准搜索展示', '接收报价', '站内消息'], highlight: false },
  { name: '精选推荐', price: '¥99/月', features: ['首页精选位置', '高亮展示标识', '优先搜索排名', '数据分析报告'], highlight: true },
  { name: '企业版', price: '联系我们', features: ['专属客服', '批量导入', '定制合同', 'API 接口'], highlight: false },
];

const TESTIMONIALS = [
  { name: '张先生', domain: 'qiantu.com', price: '¥280,000', text: '平台的托管机制让我作为卖家非常放心，买家付款后我才转移域名，全程无风险。' },
  { name: '李女士', domain: 'shuangpin.net', price: '¥45,000', text: '上架后两周就成交了，比我想象的快很多。智能估价工具帮我定了一个合理的价格。' },
  { name: '王先生', domain: 'aitools.io', price: '¥120,000', text: '已经在平台成交了 12 个域名，卖家控制台功能很完善，数据一目了然。' },
];

export const SellDomainPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCTA = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 text-sm px-3 py-1">
            🔥 平台手续费全国最低
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
            出售您的域名<br />安全、快速、高价成交
          </h1>
          <p className="text-lg md:text-xl opacity-80 mb-8 max-w-2xl mx-auto">
            加入数千名卖家，通过专业域名交易平台触达全国优质买家，享受第三方托管保障，平台低至 5% 手续费。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={handleCTA}
              className="bg-white text-primary hover:bg-white/90 font-bold px-8 text-base"
              data-testid="button-sell-cta-hero"
            >
              立即上架域名
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white/50 text-white hover:bg-white/10 px-8 text-base"
            >
              <Link to="/marketplace">查看成交案例</Link>
            </Button>
          </div>
          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 max-w-lg mx-auto">
            {[
              { v: '5%', label: '最低手续费' },
              { v: '24h', label: '快速审核上架' },
              { v: '100%', label: '资金安全保障' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-3xl font-bold">{s.v}</p>
                <p className="text-sm opacity-70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-card">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">四步完成交易</h2>
            <p className="text-muted-foreground">从上架到成交，最快 24 小时</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative">
                <div className="text-center p-5 rounded-xl border border-border bg-background hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-3`}>
                    <s.icon className="h-6 w-6" />
                  </div>
                  <div className="text-xs font-bold text-muted-foreground mb-1">{s.step}</div>
                  <h3 className="font-bold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">为什么选择我们</h2>
            <p className="text-muted-foreground">专为中文域名市场设计的卖家工具</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="p-5 rounded-xl border border-border hover:border-primary/40 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 md:py-20 bg-card">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">简单透明的定价</h2>
            <p className="text-muted-foreground">上架完全免费，成交后按比例收取手续费</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {PRICING_TIERS.map(tier => (
              <div
                key={tier.name}
                className={`rounded-xl border p-6 flex flex-col ${
                  tier.highlight
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 relative'
                    : 'border-border bg-background'
                }`}
              >
                {tier.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3">
                    推荐
                  </Badge>
                )}
                <h3 className="font-bold text-base mb-1">{tier.name}</h3>
                <p className={`text-2xl font-bold mb-4 ${tier.highlight ? 'text-primary' : ''}`}>{tier.price}</p>
                <ul className="space-y-2 flex-1 mb-5">
                  {tier.features.map(feat => (
                    <li key={feat} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={tier.highlight ? 'default' : 'outline'}
                  className="w-full"
                  onClick={handleCTA}
                  data-testid={`button-pricing-${tier.name}`}
                >
                  {tier.price === '联系我们' ? '联系客服' : '立即开始'}
                </Button>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            * 成交手续费按实际成交金额的 5%~8% 收取，具体比例根据会员等级而异
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">卖家真实评价</h2>
            <p className="text-muted-foreground">来自已成交卖家的真实反馈</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="p-5 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.domain}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">成交 {t.price}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-20 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Tag className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-3">准备好出售您的域名了吗？</h2>
          <p className="opacity-80 mb-8 max-w-lg mx-auto">
            立即上架，接触海量潜在买家。上架完全免费，成交才收费。
          </p>
          <Button
            size="lg"
            onClick={handleCTA}
            className="bg-white text-primary hover:bg-white/90 font-bold px-10 text-base"
            data-testid="button-sell-cta-bottom"
          >
            免费上架我的域名
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};
