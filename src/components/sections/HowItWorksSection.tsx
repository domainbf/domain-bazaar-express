import { Search, MessageSquare, Shield, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const steps = [
  {
    step: '01',
    icon: Search,
    title: '找到心仪域名',
    description: '在域名市场浏览数千个精选域名，使用智能筛选找到最适合的选择，或使用价值评估工具了解市场行情。',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    step: '02',
    icon: MessageSquare,
    title: '发出报价谈判',
    description: '直接向卖家发出报价，通过站内消息实时沟通，灵活协商价格，达成双方满意的交易方案。',
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
  {
    step: '03',
    icon: Shield,
    title: '资金托管保障',
    description: '买家付款后资金进入第三方托管账户，卖家完成域名转移后，平台自动放款，全程零风险。',
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
  {
    step: '04',
    icon: CheckCircle,
    title: '交易完成确认',
    description: '买家确认收到域名控制权后，交易正式完成。双方互评，共建诚信生态，资金即时到账。',
    color: 'bg-green-500/10 text-green-600 dark:text-green-400',
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">交易流程</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            简单四步完成安全交易，全程有资金托管保障
          </p>
        </div>

        {/* 步骤卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* 连接线（桌面端） */}
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-border z-0" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="relative z-10 text-center">
                {/* 步骤圆圈 */}
                <div className="relative inline-flex mb-6">
                  <div className={`w-20 h-20 rounded-full ${step.color} flex items-center justify-center mx-auto ring-4 ring-background`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>

                <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>

                {index < steps.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-muted-foreground/40 mx-auto mt-4 hidden md:block lg:hidden" />
                )}
              </div>
            );
          })}
        </div>

        {/* 安全保障说明 */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Shield, label: '资金托管保障', desc: '买家付款资金安全托管，转移完成前不放款' },
            { icon: CheckCircle, label: '域名验证服务', desc: '卖家域名所有权经过平台实名验证' },
            { icon: MessageSquare, label: '专业纠纷调解', desc: '遇到问题申请平台介入，公平公正解决' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="bg-primary/10 p-2 rounded-lg shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link to="/marketplace">
            <Button size="lg" className="gap-2">
              立即开始 <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
