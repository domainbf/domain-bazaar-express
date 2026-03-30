import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle2, TrendingUp, ShieldCheck, BarChart3, MessageSquare, Handshake, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const STEPS = [
  { step: '01', icon: Upload, title: '注册并完善资料', desc: '注册账号，填写卖家信息，通过身份认证获得"已认证卖家"徽章，提升买家信任。' },
  { step: '02', icon: CheckCircle2, title: '提交域名上架', desc: '填写域名基本信息、定价策略，选择固定价格或接受报价模式，一键上架到市场。' },
  { step: '03', icon: ShieldCheck, title: '完成所有权验证', desc: '通过 DNS TXT 记录验证域名所有权，获得"已认证"标识，成交率平均提升 40%。' },
  { step: '04', icon: Handshake, title: '接受报价完成交易', desc: '买家发起报价后通过消息沟通，接受报价后进入资金托管流程，安全完成交割。' },
];

const BENEFITS = [
  { icon: TrendingUp, title: '千人级买家曝光', desc: '平台持续增长的注册买家基础，域名第一天上架即开始曝光。' },
  { icon: BarChart3, title: '数据分析看板', desc: '实时查看浏览量、收藏量、报价数，用数据优化你的定价策略。' },
  { icon: MessageSquare, title: '内置消息系统', desc: '与买家直接沟通，交易记录全程留存，沟通有凭有据。' },
  { icon: Star, title: '卖家评分体系', desc: '每笔成功交易积累卖家评分，评分越高域名展示权重越高。' },
];

export default function SellerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="pt-16 pb-10 px-4 text-center border-b border-border/50">
          <div className="max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-4">卖家专区</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">开始出售域名</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              最快 5 分钟上架你的域名，触达真实买家，安全完成每一笔交易。
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => user ? navigate('/user-center?tab=domains') : navigate('/auth')}
                data-testid="button-seller-start"
              >
                <Upload className="h-4 w-4 mr-2" />
                立即上架域名
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/bulk-listing')} data-testid="button-seller-bulk">
                批量上架
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-semibold text-center mb-2">四步开启卖家旅程</h2>
            <p className="text-muted-foreground text-center text-sm mb-8">简单流程，轻松完成域名变现</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {STEPS.map((s) => (
                <div key={s.step} className="bg-card rounded-xl border border-border p-6 flex gap-4">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-primary">{s.step}</span>
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <s.icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-muted/30 border-t border-border/50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-semibold text-center mb-8">卖家专属权益</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {BENEFITS.map((b) => (
                <div key={b.title} className="bg-card rounded-xl border border-border p-5 text-center">
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mb-3">
                    <b.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{b.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Button size="lg" onClick={() => user ? navigate('/user-center?tab=domains') : navigate('/auth')} data-testid="button-seller-cta">
                现在就开始 →
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
