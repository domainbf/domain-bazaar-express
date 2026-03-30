import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const STEPS = [
  { icon: FileSpreadsheet, title: '准备域名列表', desc: '整理你的域名清单，填写域名名称、价格、描述等基本信息。' },
  { icon: Upload, title: '进入批量上架', desc: '登录后前往「我的域名」→「批量上架」，粘贴或导入域名列表。' },
  { icon: CheckCircle2, title: '确认并提交', desc: '系统自动校验格式，确认无误后一键提交，所有域名同时上架。' },
  { icon: Zap, title: '立即生效', desc: '批量上架完成后，所有域名即刻出现在市场列表中，开始接受报价。' },
];

const TIPS = [
  '单次最多可批量上架 50 个域名',
  '支持固定价格和接受报价两种定价模式',
  '批量上架后可单独编辑每个域名信息',
  '建议上架前完成域名所有权验证，提升信任度',
  '可设置不同域名的最低接受价格',
];

export default function BulkListingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStart = () => {
    if (user) {
      navigate('/user-center?tab=domains');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="pt-16 pb-10 px-4 text-center border-b border-border/50">
          <div className="max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-4">卖家工具</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">批量上架域名</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              一次操作上架数十个域名，省时省力，让你的域名库快速进入市场。
            </p>
            <Button size="lg" onClick={handleStart} data-testid="button-bulk-start">
              <Upload className="h-4 w-4 mr-2" />
              {user ? '前往批量上架' : '登录后开始'}
            </Button>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-semibold text-center mb-8">操作步骤</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {STEPS.map((s, i) => (
                <div key={s.title} className="bg-card rounded-xl border border-border p-5 text-center relative">
                  {i < STEPS.length - 1 && (
                    <ArrowRight className="hidden md:block absolute -right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  )}
                  <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary/10 mb-3">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-muted/30 border-t border-border/50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold text-center mb-6">使用须知</h2>
            <div className="bg-card rounded-xl border border-border p-6 space-y-3">
              {TIPS.map((t) => (
                <div key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm">{t}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Button onClick={handleStart} data-testid="button-bulk-cta">
                {user ? '立即前往批量上架 →' : '登录后开始使用 →'}
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
