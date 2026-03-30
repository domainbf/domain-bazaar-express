
import { motion } from 'framer-motion';
import { Users, Globe, BadgeDollarSign, Timer } from 'lucide-react';

export const StatsSection = () => {
  const stats = [
    { icon: Users,           value: "50,000+", label: "活跃用户" },
    { icon: Globe,           value: "100+",    label: "支持国家/地区" },
    { icon: BadgeDollarSign, value: "¥100M+",  label: "交易总额" },
    { icon: Timer,           value: "24/7",    label: "全天候服务" }
  ];

  return (
    <section className="py-20 relative z-10 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-2">平台数据</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">值得信赖的数字资产平台</h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-card border border-border p-6 rounded-2xl text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-7 h-7 text-foreground" />
              </div>
              <div className="text-3xl font-bold mb-2 text-foreground">{stat.value}</div>
              <div className="text-muted-foreground text-sm font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
