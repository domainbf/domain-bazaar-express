import { Gavel, Flame, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHomeData } from '@/hooks/useHomeData';

export type BandType = 'auction' | 'hot' | 'sold';

interface DomainChip {
  id: string;
  name: string;
  price: number;
  logoUrl?: string;
  bandType?: BandType;
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

function LogoCard({ item, onClick, index }: { item: DomainChip; onClick: () => void; index: number }) {
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
            className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-200"
            style={{ filter: 'grayscale(100%) contrast(1.15)' }}
          />
          <div className="absolute inset-0 bg-background/30" />
          <div className="relative z-10 flex flex-col items-center gap-0.5">
            <span className="text-xs font-black text-foreground tracking-widest leading-none drop-shadow">{base}</span>
            {ext && <span className="text-[9px] text-muted-foreground font-medium">{ext}</span>}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <span
            className="font-black text-foreground leading-none tracking-tight select-none"
            style={{ fontSize: initials.length <= 2 ? '1.75rem' : initials.length <= 3 ? '1.35rem' : '1.1rem' }}
          >
            {initials}
          </span>
          {ext && (
            <span className="text-[10px] text-muted-foreground font-medium tracking-widest">{ext.toUpperCase()}</span>
          )}
        </div>
      )}
      <span className="absolute bottom-1.5 right-2 text-[10px] text-muted-foreground/70 font-mono tabular-nums">
        {item.bandType === 'sold' ? '已售' : formatPrice(item.price)}
      </span>
    </button>
  );
}

function MarqueeRow({ items, direction, onChipClick }: {
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
          <LogoCard key={`${item.id}-${i}`} item={item} onClick={() => onChipClick(item.id)} index={i} />
        ))}
      </div>
    </div>
  );
}

export function DomainScrollBands({ showSold = false }: { showSold?: boolean }) {
  const navigate = useNavigate();

  const { data: homeData } = useHomeData();

  const logoMap = homeData?.logoMap ?? {};

  // auctionDomains are now bundled inside the /data/home response — no extra request needed
  const auctionDomains: DomainChip[] = (homeData?.auctionDomains ?? []).map(a => ({
    id: a.id,
    name: a.name,
    price: a.price,
    logoUrl: logoMap[a.id],
    bandType: 'auction' as BandType,
  }));

  const rawHot = homeData?.hotDomains ?? [];
  const hotDomains: DomainChip[] = rawHot.slice(0, 20).map(d => ({ ...d, bandType: 'hot' as BandType }));

  const rawSold = showSold ? (homeData?.soldDomains ?? []) : [];
  const soldDomains: DomainChip[] = rawSold.slice(0, 30).map(d => ({ ...d, bandType: 'sold' as BandType }));

  const pad = (arr: DomainChip[]) => (arr.length >= 4 ? arr : [...arr, ...arr]);

  const handleChipClick = (id: string) => navigate(`/domain/${id}`);

  if (!auctionDomains.length && !hotDomains.length) return null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 mb-6 md:mb-8 px-0">
      {auctionDomains.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Gavel className="h-3.5 w-3.5 text-foreground/50" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">拍卖域名</span>
          </div>
          <MarqueeRow items={pad(auctionDomains)} direction="ltr" onChipClick={handleChipClick} />
        </div>
      )}

      {hotDomains.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Flame className="h-3.5 w-3.5 text-foreground/50" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">热门域名</span>
          </div>
          <MarqueeRow items={pad(hotDomains)} direction="rtl" onChipClick={handleChipClick} />
        </div>
      )}

      {showSold && soldDomains.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <CheckCircle className="h-3.5 w-3.5 text-foreground/50" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">成交案例</span>
          </div>
          <MarqueeRow items={pad(soldDomains)} direction="ltr" onChipClick={handleChipClick} />
        </div>
      )}
    </div>
  );
}
