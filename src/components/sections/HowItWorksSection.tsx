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

const trustItems = [
  { icon: Shield,        label: '资金托管保障', desc: '买家付款资金安全托管，转移完成前不放款' },
  { icon: CheckCircle,   label: '域名验证服务', desc: '卖家域名所有权经过平台实名验证' },
  { icon: MessageSquare, label: '专业纠纷调解', desc: '遇到问题申请平台介入，公平公正解决' },
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
                className="relative z-10 text-center group"
              >
                {/* icon circle — springs on hover */}
                <motion.div
                  className="relative inline-flex mb-6"
                  whileHover={{ scale: 1.1, rotate: 6 }}
                  whileTap={{ scale: 0.93 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                >
                  <div className="w-[104px] h-[104px] rounded-full bg-muted border border-border flex items-center justify-center mx-auto transition-colors duration-200 group-hover:border-foreground/30">
                    <Icon className="h-9 w-9 text-foreground" />
                  </div>
                  {/* step badge */}
                  <motion.span
                    className="absolute -top-1 -right-1 bg-foreground text-background text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                    whileInView={{ scale: [0, 1.3, 1] }}
                    transition={{ duration: 0.45, delay: index * 0.12 + 0.25, ease: 'backOut' }}
                    viewport={{ once: true }}
                  >
                    {index + 1}
                  </motion.span>
                </motion.div>

                {/* divider */}
                <div className="h-px w-10 mx-auto mb-4 rounded-full bg-border" />

                <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>

                {index < steps.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-muted-foreground/60 mx-auto mt-4 hidden md:block lg:hidden" />
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
          {trustItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-muted/60 border border-border hover:border-foreground/30 hover:bg-muted/80 transition-colors duration-200 cursor-default"
              >
                <motion.div
                  className="bg-background p-2.5 rounded-xl shrink-0 mt-0.5 border border-border"
                  whileHover={{ rotate: [0, -8, 8, -4, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Icon className="h-4 w-4 text-foreground" />
                </motion.div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
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
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="inline-block">
              <Button size="lg" className="gap-2 bg-foreground text-background hover:bg-foreground/90 border-0">
                立即开始
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
