import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [trendingData, setTrendingData] = useState<TrendingDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadTrendingDomains = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. 获取推荐域名
      const { data: domainsData, error: domainsError } = await supabase
        .from('domain_listings')
        .select('id, name, price, highlight, currency')
        .eq('status', 'available')
        .limit(4);
      
      if (domainsError) throw domainsError;
      
      if (!domainsData || domainsData.length === 0) {
        setTrendingData([]);
        setIsLoading(false);
        return;
      }
      
      // 2. 单独获取分析数据
      const domainIds = domainsData.map(domain => domain.id);
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('domain_analytics')
        .select('*')
        .in('domain_id', domainIds);
      
      if (analyticsError) {
        console.error('Error fetching analytics:', analyticsError);
      }
      
      // 3. 手动合并数据并转换为显示格式
      const transformedData = domainsData.map(domain => {
        // 查找对应的analytics记录
        const analyticEntry = analyticsData?.find(a => a.domain_id === domain.id);
        const viewsValue = Number(analyticEntry?.views || 0);
        
        // Format views for display
        let viewsDisplay = '';
        if (viewsValue >= 1000) {
          viewsDisplay = `${(viewsValue / 1000).toFixed(1)}K`;
        } else {
          viewsDisplay = String(viewsValue);
        }
        
        // Generate random growth percentage based on highlight status
        const growth = domain.highlight 
          ? `+${Math.floor(Math.random() * 30) + 20}%` 
          : `+${Math.floor(Math.random() * 15) + 5}%`;
          
        return {
          domain: domain.name || '',
          price: domain.price?.toLocaleString() || '0',
          currency: domain.currency || 'USD',
          views: viewsDisplay,
          growth
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
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <LoadingSpinner />
        </div>
      </section>
    );
  }

  if (trendingData.length === 0) {
    return null; // Don't show the section if there are no domains
  }

  return (
    <section className="py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-400">
              热门域名
            </h2>
            <p className="text-gray-400 mt-2">实时跟踪���受关注的域名</p>
          </div>
          <Link to="/marketplace">
            <Button variant="outline" className="group">
              查看更多
              <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : trendingData.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">暂无热门域名数据</p>
          </div>
        ) : (
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
                  <div className="text-violet-400 font-medium">{item.currency === 'CNY' ? '¥' : '$'}{item.price}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
