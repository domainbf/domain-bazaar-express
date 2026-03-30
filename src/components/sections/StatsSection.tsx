
import { motion } from 'framer-motion';
import { Users, Globe, BadgeDollarSign, Timer } from 'lucide-react';

const STAT_COLORS = [
  { ring: 'ring-indigo-200 dark:ring-indigo-800', bg: 'bg-indigo-50 dark:bg-indigo-950/50', icon: 'text-indigo-600 dark:text-indigo-400', grad: 'from-indigo-600 to-violet-600' },
  { ring: 'ring-cyan-200 dark:ring-cyan-800',     bg: 'bg-cyan-50 dark:bg-cyan-950/50',     icon: 'text-cyan-600 dark:text-cyan-400',     grad: 'from-cyan-500 to-blue-600'   },
  { ring: 'ring-emerald-200 dark:ring-emerald-800', bg: 'bg-emerald-50 dark:bg-emerald-950/50', icon: 'text-emerald-600 dark:text-emerald-400', grad: 'from-emerald-500 to-teal-600' },
  { ring: 'ring-violet-200 dark:ring-violet-800', bg: 'bg-violet-50 dark:bg-violet-950/50', icon: 'text-violet-600 dark:text-violet-400', grad: 'from-violet-600 to-purple-600' },
];

export const StatsSection = () => {
  const stats = [
    { icon: Users,           value: "50,000+", label: "活跃用户" },
    { icon: Globe,           value: "100+",    label: "支持国家/地区" },
    { icon: BadgeDollarSign, value: "¥100M+",  label: "交易总额" },
    { icon: Timer,           value: "24/7",    label: "全天候服务" }
  ];

  return (
    <section className="py-20 relative z-10 overflow-hidden">
      {/* subtle background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-background to-cyan-50/40 dark:from-indigo-950/20 dark:via-background dark:to-cyan-950/20 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">平台数据</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">值得信赖的数字资产平台</h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const c = STAT_COLORS[index];
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glow-card bg-card border border-border p-6 rounded-2xl text-center shadow-sm"
              >
                <div className={`w-14 h-14 rounded-2xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center mx-auto mb-4`}>
                  <stat.icon className={`w-7 h-7 ${c.icon}`} />
                </div>
                <div className={`text-3xl font-bold mb-2 bg-gradient-to-r ${c.grad} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
                <div className="text-muted-foreground text-sm font-medium">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
