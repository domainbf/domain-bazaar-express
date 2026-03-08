
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, Globe, BadgeDollarSign, Timer } from 'lucide-react';

export const StatsSection = () => {
  const { t } = useTranslation();
  
  const stats = [
    { icon: Users, value: "50,000+", label: "活跃用户" },
    { icon: Globe, value: "100+", label: "支持国家/地区" },
    { icon: BadgeDollarSign, value: "¥100M+", label: "交易总额" },
    { icon: Timer, value: "24/7", label: "全天候服务" }
  ];

  return (
    <section className="py-20 relative z-10 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-card border border-border p-6 rounded-xl text-center shadow-sm"
            >
              <stat.icon className="w-8 h-8 text-primary mx-auto mb-4" />
              <div className="text-3xl font-bold text-foreground mb-2">
                {stat.value}
              </div>
              <div className="text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
