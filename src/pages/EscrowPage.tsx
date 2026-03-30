import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, ArrowRight, CheckCircle2, Clock, CreditCard, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const STEPS = [
  { icon: CreditCard, title: '买家付款', desc: '买家将购买款项支付至平台资金托管账户，资金由平台安全保管。', color: 'text-blue-600 bg-blue-500/15 dark:bg-blue-900/30 dark:text-blue-400' },
  { icon: RefreshCw, title: '域名转移', desc: '卖家在确认收到资金托管通知后，将域名转移至买家指定账户。', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400' },
  { icon: CheckCircle2, title: '确认完成', desc: '买家确认域名收到后，平台将托管资金释放至卖家账户。', color: 'text-green-600 bg-green-500/15 dark:bg-green-900/30 dark:text-green-400' },
  { icon: Shield, title: '纠纷保障', desc: '若出现争议，平台介入调查，保障双方权益，资金在争议解决前冻结。', color: 'text-purple-600 bg-purple-500/15 dark:bg-purple-900/30 dark:text-purple-400' },
];

const GUARANTEES = [
  '买家付款后资金不直接到达卖家，由平台安全托管',
  '域名未完成转移前，资金不会被释放',
  '交易全程有记录留存，可供纠纷追溯',
  '买家确认收货后，卖家资金即时到账',
  '系统自动发送每个阶段的状态通知',
];

export default function EscrowPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="pt-16 pb-10 px-4 text-center border-b border-border/50">
          <div className="max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-4">安全保障</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">资金托管服务</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              买家付款后资金由平台安全托管，域名转移完成再放款——买卖双方零风险。
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => user ? navigate('/user-center?tab=transactions') : navigate('/auth')}
                data-testid="button-escrow-transactions"
              >
                查看我的交易
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/marketplace')} data-testid="button-escrow-browse">
                浏览域名市场
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-semibold text-center mb-2">托管交易流程</h2>
            <p className="text-muted-foreground text-center text-sm mb-8">每一笔交易都经历以下四个受保护的阶段</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {STEPS.map((s, i) => (
                <div key={s.title} className="bg-card rounded-xl border border-border p-5 relative">
                  <div className="absolute -top-3 left-5 h-6 w-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl mb-3 ${s.color}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-muted/30 border-t border-border/50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold text-center mb-8">资金托管保障清单</h2>
            <div className="bg-card rounded-xl border border-border p-6 space-y-3">
              {GUARANTEES.map((g) => (
                <div key={g} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm">{g}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-amber-500/10 dark:bg-amber-900/20 rounded-xl border border-amber-500/30 dark:border-amber-800 p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-600 dark:text-amber-400 dark:text-amber-300 mb-1">注意事项</h3>
                  <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
                    资金托管仅适用于通过平台达成的交易。私下交易不受平台保护，若出现纠纷平台无法介入。请始终通过平台内完成交易流程。
                  </p>
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
