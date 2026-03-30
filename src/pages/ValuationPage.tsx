import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/sections/Footer';
import { DomainValuationTool } from '@/components/domain/DomainValuationTool';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Brain, TrendingUp, ShieldCheck } from 'lucide-react';

const FEATURES = [
  { icon: Brain, title: 'AI 智能估值', desc: '基于历史成交数据和市场行情，AI 模型给出精准估值区间' },
  { icon: TrendingUp, title: '市场趋势分析', desc: '分析关键词搜索量、行业热度和同类域名价格走势' },
  { icon: BarChart3, title: '多维度评分', desc: '从长度、可记忆性、品牌适配度等多个维度综合评分' },
  { icon: ShieldCheck, title: '参考数据可信', desc: '数据来源真实成交记录，不是随机估算' },
];

export default function ValuationPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="pt-16 pb-8 px-4 text-center border-b border-border/50">
          <div className="max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-4">免费工具</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">域名价值评估</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              输入任意域名，获取 AI 驱动的专业价值报告，帮助你做出更明智的买卖决策。
            </p>
          </div>
        </section>

        <section className="py-10 px-4">
          <div className="max-w-4xl mx-auto">
            <DomainValuationTool />
          </div>
        </section>

        <section className="py-12 px-4 bg-muted/30 border-t border-border/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-center mb-8">评估系统如何工作</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-card rounded-xl border border-border p-5 text-center">
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mb-3">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
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
