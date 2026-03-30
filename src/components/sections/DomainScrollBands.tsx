import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Gavel, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DomainChip {
  id: string;
  name: string;
  price: number;
  logoUrl?: string;
}

function formatPrice(price: number) {
  if (!price) return '面议';
  if (price >= 10000) return `¥${(price / 10000).toFixed(price % 10000 === 0 ? 0 : 1)}万`;
  return `¥${price.toLocaleString()}`;
}

function getDomainInitials(name: string): string {
  const base = name.split('.')[0].toUpperCase();
  if (base.length <= 4) return base;
  return base.slice(0, 3);
}

function LogoCard({
  item,
  onClick,
  index,
}: {
  item: DomainChip;
  onClick: () => void;
  index: number;
}) {
  const initials = getDomainInitials(item.name);
  const ext = item.name.includes('.') ? '.' + item.name.split('.').slice(1).join('.') : '';
  const base = item.name.split('.')[0].toUpperCase();

  return (
    <button
      onClick={onClick}
      data-testid={`logo-card-${item.id}-${index}`}
      className="group relative inline-flex flex-col items-center justify-center mx-2 shrink-0
        w-[120px] h-[80px] rounded-xl border border-border bg-card
        hover:border-foreground/40 hover:bg-muted/40 transition-all duration-200
        overflow-hidden cursor-pointer"
    >
      {item.logoUrl ? (
        <>
          <img
            src={item.logoUrl}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
            style={{ filter: 'grayscale(100%) contrast(1.2)' }}
          />
          <div className="absolute inset-0 bg-background/40" />
          <div className="relative z-10 flex flex-col items-center gap-0.5">
            <span className="text-xs font-black text-foreground tracking-widest leading-none">{base}</span>
            {ext && <span className="text-[10px] text-muted-foreground font-medium">{ext}</span>}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <span
            className="font-black text-foreground leading-none tracking-tight select-none"
            style={{
              fontSize: initials.length <= 2 ? '1.75rem' : initials.length <= 3 ? '1.35rem' : '1.1rem',
            }}
          >
            {initials}
          </span>
          {ext && (
            <span className="text-[10px] text-muted-foreground font-medium tracking-widest">{ext.toUpperCase()}</span>
          )}
        </div>
      )}
      <span className="absolute bottom-1.5 right-2 text-[10px] text-muted-foreground/70 font-mono tabular-nums">
        {formatPrice(item.price)}
      </span>
    </button>
  );
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
  const trackRef = useRef<HTMLDivElement>(null);
  if (!items.length) return null;
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden w-full">
      <div
        ref={trackRef}
        className={direction === 'rtl' ? 'animate-marquee-rtl' : 'animate-marquee-ltr'}
        style={{ display: 'flex', width: 'max-content', willChange: 'transform' }}
        onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = 'paused')}
        onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = 'running')}
      >
        {doubled.map((item, i) => (
          <LogoCard
            key={`${item.id}-${i}`}
            item={item}
            onClick={() => onChipClick(item.id)}
            index={i}
          />
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

      const allIds: string[] = [];
      const auctionChips: DomainChip[] = [];
      if (auctionRes.data?.length) {
        auctionRes.data
          .filter((a) => a.domain)
          .forEach((a) => {
            const id = (a.domain as any)?.id ?? a.id;
            allIds.push(id);
            auctionChips.push({
              id,
              name: (a.domain as any)?.name ?? '域名',
              price: Number(a.current_price) || Number(a.starting_price) || 0,
            });
          });
      }

      const hotChips: DomainChip[] = [];
      if (hotRes.data?.length) {
        const analyticsMap = new Map<string, number>();
        (analyticsRes.data ?? []).forEach((a) => {
          if (a.domain_id) analyticsMap.set(a.domain_id, Number(a.views) || 0);
        });
        const sorted = [...hotRes.data]
          .sort((a, b) => (analyticsMap.get(b.id) ?? 0) - (analyticsMap.get(a.id) ?? 0))
          .slice(0, 20);
        sorted.forEach((d) => {
          allIds.push(d.id);
          hotChips.push({ id: d.id, name: d.name ?? '域名', price: Number(d.price) || 0 });
        });
      }

      let logoMap: Record<string, string> = {};
      if (allIds.length) {
        const logoKeys = [...new Set(allIds)].map(id => `domain_logo_${id}`);
        const { data: logoData } = await supabase
          .from('site_settings')
          .select('key, value')
          .in('key', logoKeys);
        if (logoData?.length) {
          logoData.forEach(r => {
            const id = r.key.replace('domain_logo_', '');
            if (r.value) logoMap[id] = r.value;
          });
        }
      }

      const withLogos = (chips: DomainChip[]) =>
        chips.map(c => ({ ...c, logoUrl: logoMap[c.id] || undefined }));

      const finalAuction = withLogos(auctionChips);
      const finalHot = withLogos(hotChips);

      setAuctionDomains(finalAuction.length >= 5 ? finalAuction : [...finalAuction, ...finalAuction]);
      setHotDomains(finalHot.length >= 5 ? finalHot : [...finalHot, ...finalHot]);
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
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Gavel className="h-3.5 w-3.5 text-foreground/50" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">拍卖域名</span>
          </div>
          <MarqueeRow items={auctionDomains} direction="ltr" onChipClick={handleChipClick} />
        </div>
      )}

      {hotDomains.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Flame className="h-3.5 w-3.5 text-foreground/50" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">热门域名</span>
          </div>
          <MarqueeRow items={hotDomains} direction="rtl" onChipClick={handleChipClick} />
        </div>
      )}
    </div>
  );
}
