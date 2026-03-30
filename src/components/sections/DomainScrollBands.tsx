import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Gavel, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DomainChip {
  id: string;
  name: string;
  price: number;
  label?: string;
}

function formatPrice(price: number) {
  if (!price) return '面议';
  if (price >= 10000) return `¥${(price / 10000).toFixed(price % 10000 === 0 ? 0 : 1)}万`;
  return `¥${price.toLocaleString()}`;
}

function MarqueeRow({
  items,
  direction,
  onChipClick,
}: {
  items: DomainChip[];
  direction: 'ltr' | 'rtl';
  onChipClick: (id: string) => void;
}) {
  if (!items.length) return null;
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden w-full">
      <div
        className={direction === 'rtl' ? 'animate-marquee-rtl' : 'animate-marquee-ltr'}
        style={{ display: 'flex', width: 'max-content', willChange: 'transform' }}
        onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = 'paused')}
        onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = 'running')}
      >
        {doubled.map((item, i) => (
          <button
            key={`${item.id}-${i}`}
            onClick={() => onChipClick(item.id)}
            className="inline-flex items-center gap-2 mx-2 px-4 py-2 rounded-full border border-border bg-background hover:bg-accent hover:border-primary/40 transition-colors duration-150 whitespace-nowrap cursor-pointer shrink-0"
            data-testid={`chip-domain-${item.id}-${i}`}
          >
            <span className="font-semibold text-base text-foreground">{item.name}</span>
            <span className="text-muted-foreground text-sm">{formatPrice(item.price)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function DomainScrollBands() {
  const navigate = useNavigate();
  const [auctionDomains, setAuctionDomains] = useState<DomainChip[]>([]);
  const [hotDomains, setHotDomains] = useState<DomainChip[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [auctionRes, hotRes, analyticsRes] = await Promise.all([
        supabase
          .from('domain_auctions')
          .select('id, starting_price, current_price, domain:domain_listings(id, name, price)')
          .eq('status', 'active')
          .limit(20),
        supabase
          .from('domain_listings')
          .select('id, name, price')
          .eq('status', 'available')
          .order('created_at', { ascending: false })
          .limit(40),
        supabase
          .from('domain_analytics')
          .select('domain_id, views')
          .order('views', { ascending: false })
          .limit(40),
      ]);

      if (auctionRes.data?.length) {
        const chips: DomainChip[] = auctionRes.data
          .filter((a) => a.domain)
          .map((a) => ({
            id: (a.domain as any)?.id ?? a.id,
            name: (a.domain as any)?.name ?? '域名',
            price: Number(a.current_price) || Number(a.starting_price) || 0,
          }));
        setAuctionDomains(chips.length >= 5 ? chips : [...chips, ...chips]);
      }

      if (hotRes.data?.length) {
        const analyticsMap = new Map<string, number>();
        (analyticsRes.data ?? []).forEach((a) => {
          if (a.domain_id) analyticsMap.set(a.domain_id, Number(a.views) || 0);
        });

        const sorted = [...hotRes.data]
          .sort((a, b) => (analyticsMap.get(b.id) ?? 0) - (analyticsMap.get(a.id) ?? 0))
          .slice(0, 20);

        const chips: DomainChip[] = sorted.map((d) => ({
          id: d.id,
          name: d.name ?? '域名',
          price: Number(d.price) || 0,
        }));
        setHotDomains(chips.length >= 5 ? chips : [...chips, ...chips]);
      }
    };

    fetchData();
  }, []);

  const handleChipClick = (id: string) => {
    navigate(`/domain/${id}`);
  };

  if (!auctionDomains.length && !hotDomains.length) return null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 mb-6 md:mb-8 px-0">
      {auctionDomains.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <Gavel className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-semibold text-foreground">拍卖域名</span>
          </div>
          <MarqueeRow items={auctionDomains} direction="ltr" onChipClick={handleChipClick} />
        </div>
      )}

      {hotDomains.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <Flame className="h-4 w-4 text-red-500" />
            <span className="text-sm font-semibold text-foreground">热门域名</span>
          </div>
          <MarqueeRow items={hotDomains} direction="rtl" onChipClick={handleChipClick} />
        </div>
      )}
    </div>
  );
}
