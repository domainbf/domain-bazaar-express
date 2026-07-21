import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Gavel, Flame, CheckCircle } from 'lucide-react';
import { useHomeData } from '@/hooks/useHomeData';
import { getDomainDetailPath } from '@/lib/domainRouting';
import { DomainWordmark } from './DomainWordmark';
import { formatPriceCompact } from '@/lib/currency';
import { supabase } from '@/integrations/supabase/client';
import { isUuidLike } from '@/lib/domainRouting';

// 预加载详情页 chunk，避免点击后长时间白屏
let detailChunkPromise: Promise<unknown> | null = null;
const preloadDetailChunk = () => {
  if (!detailChunkPromise) {
    detailChunkPromise = import('@/components/domain/DomainDetailPage');
  }
  return detailChunkPromise;
};

export type BandType = 'auction' | 'hot' | 'sold';

interface DomainChip {
  id: string;
  name: string;
  price: number;
  currency: string;
  bandType?: BandType;
}

interface LogoCardProps {
  item: DomainChip;
  onClick: () => void;
  index: number;
}

function LogoCard({ item, onClick, index, onPrefetch }: LogoCardProps & { onPrefetch: () => void }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onPrefetch}
      onTouchStart={onPrefetch}
      onFocus={onPrefetch}
      title={item.name}
      data-testid={`logo-card-${item.id}-${index}`}
      className="group relative inline-flex flex-col items-center justify-center mx-1.5 shrink-0
        w-[120px] sm:w-[132px] h-[62px] rounded-lg border border-border bg-card
        hover:border-foreground/40 hover:bg-muted/40 transition-all duration-200
        overflow-hidden cursor-pointer"
    >
      <div className="relative z-10 flex items-center justify-center w-full px-1.5">
        <DomainWordmark name={item.name} className="max-w-[116px] sm:max-w-[128px]" />
      </div>

      <span className="absolute bottom-1 right-1.5 text-[9px] text-muted-foreground/70 font-mono tabular-nums z-10">
        {item.bandType === 'sold' ? '已售' : formatPriceCompact(item.price, item.currency)}
      </span>
    </button>
  );
}

function MarqueeRow({ items, direction, onChipClick, onPrefetch }: {
  items: DomainChip[];
  direction: 'ltr' | 'rtl';
  onChipClick: (domainName: string) => void;
  onPrefetch: (item: DomainChip) => void;
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
          <LogoCard
            key={`${item.id}-${i}`}
            item={item}
            onClick={() => onChipClick(item.name)}
            onPrefetch={() => onPrefetch(item)}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}

export function DomainScrollBands({ showSold = false }: { showSold?: boolean }) {
  const navigate = useNavigate();
  const { data: homeData } = useHomeData();

  const auctionDomains: DomainChip[] = (homeData?.auctionDomains ?? []).map(a => ({
    id: a.id, name: a.name, price: a.price, currency: a.currency,
    bandType: 'auction' as BandType,
  }));

  const rawHot = homeData?.hotDomains ?? [];
  const hotDomains: DomainChip[] = rawHot.slice(0, 20).map(d => ({
    id: d.id, name: d.name, price: d.price, currency: d.currency,
    bandType: 'hot' as BandType,
  }));

  const rawSold = showSold ? (homeData?.soldDomains ?? []) : [];
  const soldDomains: DomainChip[] = rawSold.slice(0, 30).map(d => ({
    id: d.id, name: d.name, price: d.price, currency: d.currency,
    bandType: 'sold' as BandType,
  }));

  const pad = (arr: DomainChip[]) => (arr.length >= 4 ? arr : [...arr, ...arr]);
  const handleChipClick = (domainName: string) => navigate(getDomainDetailPath(domainName));

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
