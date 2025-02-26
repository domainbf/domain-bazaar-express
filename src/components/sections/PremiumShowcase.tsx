
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { availableDomains } from '@/data/availableDomains';

export const PremiumShowcase = () => {
  const { t } = useTranslation();
  
  const premiumDomains = availableDomains
    .filter(domain => domain.highlight)
    .slice(0, 3);

  return (
    <section className="py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Crown className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-600">
              精选顶级域名
            </h2>
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
              我们精心挑选的高价值域名，每一个都是独特的数字资产
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {premiumDomains.map((domain, index) => (
            <motion.div
              key={domain.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-8 rounded-xl text-center transform hover:scale-105 transition-all duration-300"
            >
              <div className="text-2xl font-bold text-white mb-4">{domain.name}</div>
              <div className="text-xl font-semibold text-amber-400">${domain.price}</div>
              <div className="mt-4 text-gray-400">独特价值：稀缺性、品牌潜力、投资收益</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
