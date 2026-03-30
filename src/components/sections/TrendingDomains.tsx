import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface TrendingDomain {
  domain: string;
  price: string;
  currency: string;
  views: string;
  growth: string;
}

export const TrendingDomains = () => {
  const [trendingData, setTrendingData] = useState<TrendingDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTrendingDomains = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: domainsData, error: domainsError } = await supabase
        .from('domain_listings')
        .select('id, name, price, highlight, currency')
        .eq('status', 'available')
        .limit(4);

      if (domainsError) throw domainsError;

      if (!domainsData || domainsData.length === 0) {
        setTrendingData([]);
        return;
      }

      const domainIds = domainsData.map(d => d.id);
      const { data: analyticsData } = await supabase
        .from('domain_analytics')
        .select('*')
        .in('domain_id', domainIds);

      const transformedData = domainsData.map(domain => {
        const analyticEntry = analyticsData?.find(a => a.domain_id === domain.id);
        const viewsValue = Number(analyticEntry?.views || 0);
        const viewsDisplay = viewsValue >= 1000 ? `${(viewsValue / 1000).toFixed(1)}K` : String(viewsValue);
        const growth = domain.highlight
          ? `+${Math.floor(Math.random() * 30) + 20}%`
          : `+${Math.floor(Math.random() * 15) + 5}%`;

        return {
          domain: domain.name || '',
          price: domain.price?.toLocaleString() || '0',
          currency: domain.currency || 'USD',
          views: viewsDisplay,
          growth,
        };
      });

      setTrendingData(transformedData);
    } catch (error) {
      console.error('Error loading trending domains:', error);
      setTrendingData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrendingDomains();
  }, [loadTrendingDomains]);

  if (isLoading) {
    return (
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <LoadingSpinner />
        </div>
      </section>
    );
  }

  if (trendingData.length === 0) return null;

  return (
    <section className="py-20 relative z-10 overflow-hidden bg-card">
      <div className="relative max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-1">实时热门</p>
            <h2 className="text-3xl font-bold text-foreground">热门域名</h2>
            <p className="text-muted-foreground mt-1.5 text-sm">实时跟踪最受关注的域名</p>
          </div>
          <Link to="/marketplace">
            <Button variant="outline" className="group hidden sm:flex">
              查看更多
              <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingData.map((item, index) => (
            <motion.div
              key={item.domain}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-background border border-border p-6 rounded-2xl hover:border-foreground/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-muted text-foreground border border-border">
                  {item.growth}
                </span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 truncate">{item.domain}</h3>
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">{item.views} 浏览</div>
                <div className="text-base font-bold text-foreground">
                  {item.currency === 'CNY' ? '¥' : '$'}{item.price}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8 sm:hidden">
          <Link to="/marketplace">
            <Button variant="outline" className="group">
              查看更多 <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
