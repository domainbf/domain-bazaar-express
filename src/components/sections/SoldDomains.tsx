import { motion } from 'framer-motion';
import { CheckCircle2, Trophy } from 'lucide-react';
import { useHomeData } from '@/hooks/useHomeData';
import { Domain } from '@/types/domain';

export const SoldDomains = () => {
  const { data: homeData } = useHomeData();

  const soldDomains: Domain[] = (homeData?.soldDomains ?? []).slice(0, 10).map(d => ({
    id: d.id,
    name: d.name,
    price: d.price,
    category: 'standard',
    status: 'sold',
    owner_id: '',
    created_at: new Date().toISOString(),
  }));

  if (soldDomains.length === 0) return null;

  return (
    <section className="py-14 bg-gradient-to-b from-background to-emerald-50/30 dark:to-emerald-950/10 border-t border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-2xl font-bold text-foreground">成功交易案例</h2>
          <Trophy className="w-5 h-5 text-amber-500" />
        </motion.div>

        <div className="overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-4 min-w-max">
            {soldDomains.map((domain, i) => (
              <motion.div
                key={domain.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                viewport={{ once: true }}
                className="flex-shrink-0 w-56 p-4 bg-card border border-emerald-200 dark:border-emerald-800/60 rounded-xl shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground truncate flex-1 text-sm">{domain.name}</h3>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 ml-2" />
                </div>
                <p className="text-xs text-muted-foreground mb-1">成交价格</p>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  ¥{domain.price.toLocaleString()}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          以上域名已通过平台安全托管完成交易
        </p>
      </div>
    </section>
  );
};
