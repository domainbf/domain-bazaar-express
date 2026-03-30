import { Search, MessageSquare, Shield, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const steps = [
  {
    step: '01',
    icon: Search,
    title: '找到心仪域名',
    description: '在域名市场浏览数千个精选域名，使用智能筛选找到最适合的选择，或使用价值评估工具了解市场行情。',
  },
  {
    step: '02',
    icon: MessageSquare,
    title: '发出报价谈判',
    description: '直接向卖家发出报价，通过站内消息实时沟通，灵活协商价格，达成双方满意的交易方案。',
  },
  {
    step: '03',
    icon: Shield,
    title: '资金托管保障',
    description: '买家付款后资金进入第三方托管账户，卖家完成域名转移后，平台自动放款，全程零风险。',
  },
  {
    step: '04',
    icon: CheckCircle,
    title: '交易完成确认',
    description: '买家确认收到域名控制权后，交易正式完成。双方互评，共建诚信生态，资金即时到账。',
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background relative overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-2">安全流程</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">交易流程</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            简单四步完成安全交易，全程有资金托管保障
          </p>
        </motion.div>

        {/* step cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* connector line (desktop) */}
          <div className="hidden lg:block absolute top-[52px] left-[12.5%] right-[12.5%] h-px bg-border z-0" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.12 }}
                viewport={{ once: true }}
                className="relative z-10 text-center"
              >
                {/* icon circle */}
                <div className="relative inline-flex mb-6">
                  <div className="w-[104px] h-[104px] rounded-full bg-muted border border-border flex items-center justify-center mx-auto">
                    <Icon className="h-9 w-9 text-foreground" />
                  </div>
                  {/* step badge */}
                  <span className="absolute -top-1 -right-1 bg-foreground text-background text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-md">
                    {index + 1}
                  </span>
                </div>

                {/* divider */}
                <div className="h-px w-10 mx-auto mb-4 rounded-full bg-border" />

                <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>

                {index < steps.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-muted-foreground/40 mx-auto mt-4 hidden md:block lg:hidden" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            { icon: Shield,        label: '资金托管保障', desc: '买家付款资金安全托管，转移完成前不放款' },
            { icon: CheckCircle,   label: '域名验证服务', desc: '卖家域名所有权经过平台实名验证' },
            { icon: MessageSquare, label: '专业纠纷调解', desc: '遇到问题申请平台介入，公平公正解决' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/60 hover:border-border transition-colors">
                <div className="bg-muted p-2.5 rounded-xl shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link to="/marketplace">
            <Button size="lg" className="gap-2 bg-foreground text-background hover:bg-foreground/90 border-0">
              立即开始 <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
