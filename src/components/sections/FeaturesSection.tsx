
import { Globe2, Sparkles, Crown, Diamond } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Globe2,
    title: "全球可达",
    desc: "覆盖全球的域名交易网络，随时随地交易",
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    ring: 'ring-blue-200 dark:ring-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    accent: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Sparkles,
    title: "优质精选",
    desc: "严选优质域名，确保投资价值",
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    ring: 'ring-violet-200 dark:ring-violet-800',
    iconColor: 'text-violet-600 dark:text-violet-400',
    accent: 'from-violet-500 to-purple-600',
  },
  {
    icon: Crown,
    title: "尊享服务",
    desc: "专业的域名顾问团队，全程贴心服务",
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    ring: 'ring-amber-200 dark:ring-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
    accent: 'from-amber-500 to-orange-500',
  },
  {
    icon: Diamond,
    title: "增值保障",
    desc: "持续的价值评估，助力资产增值",
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    ring: 'ring-emerald-200 dark:ring-emerald-800',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    accent: 'from-emerald-500 to-teal-500',
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-background">
      {/* background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-50/30 to-transparent dark:via-violet-950/10 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-sm font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-2">核心优势</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">为什么选择我们</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glow-card bg-card border border-border p-8 rounded-2xl text-center shadow-sm group"
            >
              {/* icon bubble */}
              <div className={`w-16 h-16 rounded-2xl ${f.bg} ring-1 ${f.ring} flex items-center justify-center mx-auto mb-5 transition-transform duration-300 group-hover:scale-110`}>
                <f.icon className={`w-8 h-8 ${f.iconColor}`} />
              </div>
              {/* gradient line */}
              <div className={`h-0.5 w-10 mx-auto mb-4 rounded-full bg-gradient-to-r ${f.accent} opacity-70`} />
              <h3 className="text-xl font-semibold mb-3 text-foreground">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
