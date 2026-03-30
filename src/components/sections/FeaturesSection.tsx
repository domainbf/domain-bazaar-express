
import { Globe2, Sparkles, Crown, Diamond } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { icon: Globe2,    title: "全球可达", desc: "覆盖全球的域名交易网络，随时随地交易" },
  { icon: Sparkles,  title: "优质精选", desc: "严选优质域名，确保投资价值" },
  { icon: Crown,     title: "尊享服务", desc: "专业的域名顾问团队，全程贴心服务" },
  { icon: Diamond,   title: "增值保障", desc: "持续的价值评估，助力资产增值" },
];

export const FeaturesSection = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-background">
      <div className="relative max-w-7xl mx-auto px-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-2">核心优势</p>
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
              className="bg-card border border-border p-8 rounded-2xl text-center group hover:border-foreground/20 transition-colors"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto mb-5 transition-transform duration-300 group-hover:scale-110">
                <f.icon className="w-8 h-8 text-foreground" />
              </div>
              <div className="h-px w-10 mx-auto mb-4 rounded-full bg-border" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
