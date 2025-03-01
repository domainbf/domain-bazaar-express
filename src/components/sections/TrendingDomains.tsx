
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingUp, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { availableDomains } from '@/data/availableDomains';

export const TrendingDomains = () => {
  const { t } = useTranslation();
  
  // Use actual domain data and sort by highlight status (as a proxy for popularity)
  // In a real app, this would be based on actual click tracking data
  const trendingData = [...availableDomains]
    .sort((a, b) => {
      // First prioritize highlighted domains
      if (a.highlight && !b.highlight) return -1;
      if (!a.highlight && b.highlight) return 1;
      
      // Then sort by price (higher price = more premium/popular)
      const priceA = parseInt(a.price.replace(/,/g, ''));
      const priceB = parseInt(b.price.replace(/,/g, ''));
      return priceB - priceA;
    })
    .slice(0, 4)
    .map(domain => ({
      domain: domain.name,
      price: domain.price,
      // Generate view numbers for display purposes based on price and highlight
      views: domain.highlight 
        ? `${Math.floor(Math.random() * 10) + 10}.${Math.floor(Math.random() * 9)}K`
        : `${Math.floor(Math.random() * 5) + 5}.${Math.floor(Math.random() * 9)}K`,
      // Generate growth rate based on highlight status
      growth: domain.highlight 
        ? `+${Math.floor(Math.random() * 30) + 20}%` 
        : `+${Math.floor(Math.random() * 15) + 5}%`
    }));

  return (
    <section className="py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-400">
              热门域名
            </h2>
            <p className="text-gray-400 mt-2">实时跟踪最受关注的域名</p>
          </div>
          <Button variant="outline" className="group">
            查看更多
            <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingData.map((item, index) => (
            <motion.div
              key={item.domain}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-6 rounded-xl hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">{item.growth}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{item.domain}</h3>
              <div className="flex justify-between items-center">
                <div className="text-gray-400">{item.views} 浏览量</div>
                <div className="text-violet-400 font-medium">¥{item.price}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
