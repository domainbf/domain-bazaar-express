import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Domain } from '@/types/domain';
import { useTranslation } from 'react-i18next';
import { CheckCircle } from 'lucide-react';

export const SoldDomains = () => {
  const [soldDomains, setSoldDomains] = useState<Domain[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    const loadSoldDomains = async () => {
      const { data } = await supabase
        .from('domain_listings')
        .select('*')
        .eq('status', 'sold')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setSoldDomains(data.map(d => ({
          id: d.id,
          name: d.name,
          price: Number(d.price),
          category: d.category || 'standard',
          status: d.status || 'sold',
          owner_id: d.owner_id || '',
          created_at: d.created_at || new Date().toISOString()
        })));
      }
    };

    loadSoldDomains();
  }, []);

  if (soldDomains.length === 0) return null;

  return (
    <section className="py-12 bg-muted/30 border-t">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center gap-2 mb-8">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h2 className="text-2xl font-bold text-center">
            {t('soldDomains.title', '成功交易案例')}
          </h2>
        </div>
        
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {soldDomains.map((domain) => (
              <div
                key={domain.id}
                className="flex-shrink-0 w-64 p-4 bg-card border rounded-lg hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground truncate flex-1">
                    {domain.name}
                  </h3>
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('soldDomains.soldFor', '成交价')}
                </p>
                <p className="text-lg font-bold text-green-600">
                  ${domain.price.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        <p className="text-center text-sm text-muted-foreground mt-4">
          {t('soldDomains.subtitle', '以上域名已成功交易完成')}
        </p>
      </div>
    </section>
  );
};
