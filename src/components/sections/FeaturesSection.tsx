
import { Globe2, Sparkles, Crown, Diamond } from 'lucide-react';

export const FeaturesSection = () => {
  const features = [
    { icon: Globe2, title: "全球可达", desc: "覆盖全球的域名交易网络，随时随地交易" },
    { icon: Sparkles, title: "优质精选", desc: "严选优质域名，确保投资价值" },
    { icon: Crown, title: "尊享服务", desc: "专业的域名顾问团队，全程贴心服务" },
    { icon: Diamond, title: "增值保障", desc: "持续的价值评估，助力资产增值" },
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {features.map((f) => (
            <div key={f.title} className="bg-card border border-border p-8 rounded-2xl text-center transform hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md">
              <f.icon className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">{f.title}</h3>
              <p className="text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
