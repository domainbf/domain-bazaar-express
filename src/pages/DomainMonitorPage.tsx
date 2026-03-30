import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Eye, TrendingDown, Shield, Clock, Zap, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const FEATURES = [
  {
    icon: Eye,
    title: '实时价格监控',
    desc: '追踪目标域名的价格变化，当价格下调或接近预算时立即通知你。',
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    icon: Bell,
    title: '到期提醒',
    desc: '自动监控你关注的域名到期时间，第一时间抢注机会域名。',
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  },
  {
    icon: TrendingDown,
    title: '市场动态推送',
    desc: '同类域名新上架、同类价格变化，帮你掌握市场行情。',
    color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    icon: Shield,
    title: '品牌保护监控',
    desc: '监控与你品牌相关的域名注册动态，防止他人抢注。',
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: '添加监控目标', desc: '在收藏夹中标记感兴趣的域名，或直接输入域名开启监控。' },
  { step: '02', title: '设置提醒规则', desc: '自定义价格阈值、通知频率和提醒方式（站内消息 / 邮件）。' },
  { step: '03', title: '接收实时通知', desc: '条件触发时立即推送通知，不错过任何最佳入手时机。' },
];

export default function DomainMonitorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="pt-16 pb-10 px-4 text-center border-b border-border/50">
          <div className="max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-4">智能监控</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">域名监控</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              设置监控规则，价格变动、域名到期、市场动态——第一时间收到通知。
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => user ? navigate('/user-center?tab=notifications') : navigate('/auth')}
                data-testid="button-monitor-start"
              >
                <Bell className="h-4 w-4 mr-2" />
                开启监控
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/marketplace')}
                data-testid="button-monitor-browse"
              >
                浏览域名市场
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-semibold text-center mb-2">监控功能</h2>
            <p className="text-muted-foreground text-center text-sm mb-8">全方位守护你的域名投资机会</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-card rounded-xl border border-border p-6 flex gap-4">
                  <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl shrink-0 ${f.color}`}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-muted/30 border-t border-border/50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold text-center mb-8">三步开启监控</h2>
            <div className="space-y-4">
              {HOW_IT_WORKS.map((s, i) => (
                <div key={s.step} className="flex gap-4 items-start bg-card rounded-xl border border-border p-5">
                  <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-0.5">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-card rounded-xl border border-border p-6">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">当前版本</h3>
                  <p className="text-sm text-muted-foreground">域名收藏和站内通知已全面上线。高级价格预警和邮件推送功能正在迭代中，敬请期待。</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {['收藏监控 ✓', '站内通知 ✓', '价格预警 (即将)', '邮件推送 (即将)'].map((t) => (
                      <span key={t} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
