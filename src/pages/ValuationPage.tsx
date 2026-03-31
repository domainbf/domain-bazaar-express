import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/sections/Footer';
import { DomainValuationTool } from '@/components/domain/DomainValuationTool';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Brain, TrendingUp, ShieldCheck, Zap, Search, History, Globe } from 'lucide-react';

const FEATURES = [
  { icon: Brain,      title: 'AI + 算法双引擎',  desc: '优先调用 AI 模型评估，自动降级至多维度本地算法，确保每次都能获得有效结果。' },
  { icon: TrendingUp, title: '市场趋势分析',       desc: '参考行业动态、后缀市场价值及关键词搜索热度，综合反映当前市场行情。' },
  { icon: BarChart3,  title: '六维评分体系',       desc: '从市场趋势、行业应用、投资价值、品牌潜力、技术质量、SEO 价值六个维度量化评分。' },
  { icon: ShieldCheck,title: '价值区间估算',       desc: '给出建议价、最低价、最高价三档区间，帮助买卖双方确定合理的交易价格范围。' },
  { icon: History,    title: '估值历史记录',       desc: '自动保存最近 5 条记录，方便对比不同域名的评分与价格，无需重复输入。' },
  { icon: Globe,      title: '平台实盘参考',       desc: '自动展示平台当前在售域名供价格横向对比，让估值更贴近真实市场成交水平。' },
];

const FAQ_ITEMS = [
  { q: '估值结果准确吗？', a: '估值结果由多维度算法生成，综合考量域名长度、后缀类型、关键词价值、市场行情等因素，可作为定价参考，但实际成交价受买卖双方意愿、市场供需等多种因素影响，存在较大弹性空间。' },
  { q: '为什么同一域名每次估值结果相近？', a: '本地算法基于确定性公式计算，相同输入会产生相同输出。如使用 AI 增强评估，则会结合当时的市场数据动态调整。' },
  { q: '.com 和 .cn 估值差异为何这么大？', a: '.com 在全球范围内具有最高认知度和流动性，市场溢价显著。.cn 在国内市场受政策支持，但国际流通性相对受限，因此两者定价存在一定差异。' },
  { q: '如何提高我的域名估值？', a: '短域名、纯字母、无连字符、主流后缀（.com/.cn/.io/.ai）、包含热门关键词的域名普遍具有更高估值。如需提升，可考虑配套持有同名域名或结合实际运营数据进行背书。' },
];

export default function ValuationPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="pt-14 pb-6 px-4 text-center border-b border-border/50">
          <div className="max-w-2xl mx-auto">
            <Badge variant="secondary" className="mb-4 px-3 py-1">免费工具 · 无限使用</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">域名价值评估</h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              输入任意域名，获取六维评分与价格区间估算，配合平台实盘参考，帮助你做出更明智的买卖决策。
            </p>
          </div>
        </section>

        {/* Tool */}
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <DomainValuationTool />
          </div>
        </section>

        {/* Feature grid */}
        <section className="py-12 px-4 bg-muted/30 border-t border-border/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-center mb-2">评估系统能力</h2>
            <p className="text-sm text-muted-foreground text-center mb-8">多维度、全自动，让域名定价有据可依</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {FEATURES.map(f => (
                <div key={f.title} className="bg-card rounded-xl border border-border p-5">
                  <div className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 mb-3">
                    <f.icon className="h-4.5 w-4.5 text-primary h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 px-4 border-t border-border/50">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-center mb-8">常见问题</h2>
            <div className="space-y-4">
              {FAQ_ITEMS.map(item => (
                <div key={item.q} className="bg-card rounded-xl border border-border p-5">
                  <h3 className="font-semibold text-sm mb-2 text-foreground">{item.q}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
