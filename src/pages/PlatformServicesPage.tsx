import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Upload, BarChart3, MessageSquare, Gavel, CheckCircle2, Users, Globe, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SERVICES = [
  {
    icon: Shield,
    title: '资金托管',
    desc: '买家付款后资金由平台安全保管，域名完成转移后自动释放，买卖双方零风险。',
    href: '/escrow',
    badge: '核心服务',
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    icon: Upload,
    title: '卖家入驻',
    desc: '注册成为认证卖家，上架域名触达平台全量买家，完整卖家数据看板助力决策。',
    href: '/seller',
    badge: '免费入驻',
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    icon: BarChart3,
    title: '批量上架',
    desc: '一次操作批量上架数十个域名，适合域名投资者和企业客户快速铺量。',
    href: '/bulk-listing',
    badge: '效率工具',
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
  },
  {
    icon: Gavel,
    title: '域名拍卖',
    desc: '通过公开竞拍方式出售或购买域名，价高者得，平台监管确保拍卖公平公正。',
    href: '/auctions',
    badge: '竞价模式',
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
  },
  {
    icon: CheckCircle2,
    title: '所有权验证',
    desc: 'DNS TXT 记录一键验证，获得「已认证」标识，买家信任度和成交率显著提升。',
    href: '/seller',
    badge: '信任体系',
    color: 'text-teal-600 bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400',
  },
  {
    icon: MessageSquare,
    title: '纠纷申诉',
    desc: '遇到交易争议？平台介入调查，资金冻结保护，7 个工作日内出具公正裁决。',
    href: '/dispute',
    badge: '权益保障',
    color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
  },
];

const STATS = [
  { value: '100%', label: '资金托管覆盖' },
  { value: '24h', label: '纠纷响应时限' },
  { value: '4.9★', label: '平台服务评分' },
  { value: '0', label: '平台手续费*' },
];

export default function PlatformServicesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="pt-16 pb-10 px-4 text-center border-b border-border/50">
          <div className="max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-4">平台服务</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">全方位交易保障</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              从上架到成交，每一个环节都有平台服务护航——安全、高效、透明。
            </p>
          </div>
        </section>

        <section className="py-6 px-4 bg-muted/30 border-b border-border/50">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-2xl md:text-3xl font-bold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-semibold text-center mb-8">服务清单</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {SERVICES.map((s) => (
                <div
                  key={s.title}
                  className="bg-card rounded-xl border border-border p-6 flex flex-col gap-3 hover:border-primary/40 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl ${s.color}`}>
                      <s.icon className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary" className="text-xs">{s.badge}</Badge>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="self-start -ml-2 group-hover:text-primary transition-colors"
                    onClick={() => navigate(s.href)}
                    data-testid={`button-service-${s.title}`}
                  >
                    了解更多 <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 px-4 bg-muted/30 border-t border-border/50">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs text-muted-foreground mb-6">* 目前平台处于推广期，不收取交易手续费。后续收费政策将提前告知用户。</p>
            <h2 className="text-xl font-semibold mb-3">准备好了吗？</h2>
            <p className="text-muted-foreground text-sm mb-6">无论买家还是卖家，平台全程服务保障你的每一笔交易。</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={() => navigate('/marketplace')} data-testid="button-services-browse">浏览域名市场</Button>
              <Button variant="outline" onClick={() => navigate('/seller')} data-testid="button-services-sell">开始出售域名</Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
