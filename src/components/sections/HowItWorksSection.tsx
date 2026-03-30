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
    gradBg: 'from-blue-500/15 to-cyan-500/10',
    iconBg: 'bg-blue-50 dark:bg-blue-950/50',
    iconRing: 'ring-blue-200 dark:ring-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    numColor: 'bg-blue-600',
    lineColor: 'from-blue-500 to-cyan-500',
  },
  {
    step: '02',
    icon: MessageSquare,
    title: '发出报价谈判',
    description: '直接向卖家发出报价，通过站内消息实时沟通，灵活协商价格，达成双方满意的交易方案。',
    gradBg: 'from-violet-500/15 to-purple-500/10',
    iconBg: 'bg-violet-50 dark:bg-violet-950/50',
    iconRing: 'ring-violet-200 dark:ring-violet-800',
    iconColor: 'text-violet-600 dark:text-violet-400',
    numColor: 'bg-violet-600',
    lineColor: 'from-violet-500 to-purple-500',
  },
  {
    step: '03',
    icon: Shield,
    title: '资金托管保障',
    description: '买家付款后资金进入第三方托管账户，卖家完成域名转移后，平台自动放款，全程零风险。',
    gradBg: 'from-orange-500/15 to-amber-500/10',
    iconBg: 'bg-orange-50 dark:bg-orange-950/50',
    iconRing: 'ring-orange-200 dark:ring-orange-800',
    iconColor: 'text-orange-600 dark:text-orange-400',
    numColor: 'bg-orange-500',
    lineColor: 'from-orange-500 to-amber-500',
  },
  {
    step: '04',
    icon: CheckCircle,
    title: '交易完成确认',
    description: '买家确认收到域名控制权后，交易正式完成。双方互评，共建诚信生态，资金即时到账。',
    gradBg: 'from-emerald-500/15 to-teal-500/10',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    iconRing: 'ring-emerald-200 dark:ring-emerald-800',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    numColor: 'bg-emerald-600',
    lineColor: 'from-emerald-500 to-teal-500',
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background relative overflow-hidden">
      {/* background deco */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-50/20 to-transparent dark:via-violet-950/10 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-sm font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-2">安全流程</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">交易流程</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            简单四步完成安全交易，全程有资金托管保障
          </p>
        </motion.div>

        {/* step cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* connector line (desktop) */}
          <div className="hidden lg:block absolute top-[52px] left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-300 via-violet-300 via-orange-300 to-emerald-300 dark:from-blue-700 dark:via-violet-700 dark:via-orange-700 dark:to-emerald-700 z-0 opacity-60" />

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
                  <div className={`w-[104px] h-[104px] rounded-full ${step.iconBg} ring-2 ${step.iconRing} flex items-center justify-center mx-auto bg-gradient-to-br ${step.gradBg}`}>
                    <Icon className={`h-9 w-9 ${step.iconColor}`} />
                  </div>
                  {/* step badge */}
                  <span className={`absolute -top-1 -right-1 ${step.numColor} text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-md`}>
                    {index + 1}
                  </span>
                </div>

                {/* gradient underline */}
                <div className={`h-0.5 w-10 mx-auto mb-4 rounded-full bg-gradient-to-r ${step.lineColor}`} />

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
            { icon: Shield,      color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-950/40',   label: '资金托管保障', desc: '买家付款资金安全托管，转移完成前不放款' },
            { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', label: '域名验证服务', desc: '卖家域名所有权经过平台实名验证' },
            { icon: MessageSquare, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40', label: '专业纠纷调解', desc: '遇到问题申请平台介入，公平公正解决' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/60 hover:border-border transition-colors">
                <div className={`${item.bg} p-2.5 rounded-xl shrink-0 mt-0.5`}>
                  <Icon className={`h-4 w-4 ${item.color}`} />
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
            <Button size="lg" className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white border-0 shadow-md hover:shadow-lg">
              立即开始 <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
