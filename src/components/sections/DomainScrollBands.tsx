import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Gavel, Flame, CheckCircle } from 'lucide-react';
import { useHomeData } from '@/hooks/useHomeData';
import { getDomainDetailPath } from '@/lib/domainRouting';
import { DomainWordmark } from './DomainWordmark';
import { formatPriceCompact } from '@/lib/currency';
import { supabase } from '@/integrations/supabase/client';
import { isUuidLike } from '@/lib/domainRouting';
import { reportRoute } from '@/lib/routeTelemetry';
import { useLogoBadgeConfig, type LogoBadgeConfig } from '@/hooks/useLogoBadgeConfig';

// 预加载详情页 chunk，避免点击后长时间白屏
let detailChunkPromise: Promise<unknown> | null = null;
const preloadDetailChunk = () => {
  if (!detailChunkPromise) {
    detailChunkPromise = import('@/components/domain/DomainDetailPage').catch((err) => {
      detailChunkPromise = null; // allow retry
      reportRoute({ type: 'chunk_load_error', reason: (err as Error)?.message });
      throw err;
    });
  }
  return detailChunkPromise;
};

// 空闲时机预热
const idlePreload = () => {
  const w = window as any;
  const run = () => { void preloadDetailChunk(); };
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(run, { timeout: 2000 });
  } else {
    setTimeout(run, 400);
  }
};

export type BandType = 'auction' | 'hot' | 'sold';

interface DomainChip {
  id: string;
  name: string;
  price: number;
  currency: string;
  logoUrl?: string;
  bandType?: BandType;
}

interface LogoCardProps {
  item: DomainChip;
  onClick: () => void;
  index: number;
}

function LogoCard({ item, onClick, index, onPrefetch, badge }: LogoCardProps & { onPrefetch: () => void; badge: LogoBadgeConfig }) {
  const showLogo = badge.enabled && !!item.logoUrl;
  const logoSrc = showLogo && item.logoUrl
    ? (badge.version > 0
        ? `${item.logoUrl}${item.logoUrl.includes('?') ? '&' : '?'}v=${badge.version}`
        : item.logoUrl)
    : undefined;

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
        hover:border-foreground/40 hover:bg-muted/30 transition-all duration-200
        overflow-hidden cursor-pointer"
    >
      {logoSrc && (
        <>
          <img
            src={logoSrc}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{
              filter: `grayscale(${badge.grayscale}%)`,
              opacity: badge.opacity / 100,
            }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to top, hsl(var(--background) / ${badge.overlay / 100}) 0%, hsl(var(--background) / ${Math.min(1, badge.overlay / 100 * 0.5)}) 55%, transparent 100%)`,
            }}
          />
        </>
      )}
      <div className={`relative z-10 flex items-center justify-center w-full px-2 ${logoSrc ? 'mt-auto mb-1' : ''}`}>
        <DomainWordmark name={item.name} className="max-w-[112px] sm:max-w-[124px]" />
      </div>
      <span className={`absolute bottom-1 right-1.5 text-[9px] font-mono tabular-nums z-10 ${logoSrc ? 'text-foreground/80 bg-background/60 px-1 rounded' : 'text-muted-foreground/70'}`}>
        {item.bandType === 'sold' ? '已售' : formatPriceCompact(item.price, item.currency)}
      </span>
    </button>
  );
}


function MarqueeRow({ items, direction, onChipClick, onPrefetch, onVisible, badge }: {
  items: DomainChip[];
  direction: 'ltr' | 'rtl';
  onChipClick: (domainName: string) => void;
  onPrefetch: (item: DomainChip) => void;
  onVisible: () => void;
  badge: LogoBadgeConfig;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!rowRef.current || typeof IntersectionObserver === 'undefined') {
      onVisible();
      return;
    }
    const el = rowRef.current;
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          onVisible();
          io.disconnect();
          break;
        }
      }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!items.length) return null;
  const doubled = [...items, ...items];
  return (
    <div ref={rowRef} className="overflow-hidden w-full">
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
  const queryClient = useQueryClient();
  const { data: homeData } = useHomeData();

  // 组件挂载后立即空闲预热详情 chunk，避免用户首次点击时才开始下载
  useEffect(() => {
    idlePreload();
  }, []);

  const auctionDomains: DomainChip[] = (homeData?.auctionDomains ?? []).map(a => ({
    id: a.id, name: a.name, price: a.price, currency: a.currency, logoUrl: a.logoUrl,
    bandType: 'auction' as BandType,
  }));

  const rawHot = homeData?.hotDomains ?? [];
  const hotDomains: DomainChip[] = rawHot.slice(0, 20).map(d => ({
    id: d.id, name: d.name, price: d.price, currency: d.currency, logoUrl: d.logoUrl,
    bandType: 'hot' as BandType,
  }));

  const rawSold = showSold ? (homeData?.soldDomains ?? []) : [];
  const soldDomains: DomainChip[] = rawSold.slice(0, 30).map(d => ({
    id: d.id, name: d.name, price: d.price, currency: d.currency, logoUrl: d.logoUrl,
    bandType: 'sold' as BandType,
  }));

  // 首页徽章统一使用纯排印风格，不再自动生成 AI logo（避免与 wordmark 重叠导致视觉杂乱）
  // 如需为详情页/卡片生成 logo，请在后台"Logo 生成管理"手动触发。


  const pad = (arr: DomainChip[]) => (arr.length >= 4 ? arr : [...arr, ...arr]);

  const handleChipClick = (domainName: string) => {
    const start = performance.now();
    reportRoute({ type: 'nav_click', domain: domainName, route: getDomainDetailPath(domainName) });
    void preloadDetailChunk();
    navigate(getDomainDetailPath(domainName));
    // 记录首个 rAF 到达路由后的耗时，便于观察"进不去"问题
    requestAnimationFrame(() => {
      reportRoute({
        type: 'nav_click',
        domain: domainName,
        durationMs: Math.round(performance.now() - start),
        reason: 'raf-after-nav',
      });
    });
  };

  const prefetchItem = (item: DomainChip) => {
    const key = ['domainDetail', item.name];
    if (queryClient.getQueryData(key)) return;
    queryClient.prefetchQuery({
      queryKey: key,
      staleTime: 10 * 60 * 1000,
      queryFn: async () => {
        const q = isUuidLike(item.id)
          ? supabase.from('domain_listings').select('*').eq('id', item.id).maybeSingle()
          : supabase.from('domain_listings').select('*').ilike('name', item.name).limit(1).maybeSingle();
        const { data } = await q;
        return data ? { domain: data, priceHistory: [], similarDomains: [] } : null;
      },
    }).catch(() => { /* silent */ });
  };

  const handlePrefetch = (item: DomainChip) => {
    void preloadDetailChunk();
    prefetchItem(item);
  };

  // 当整行滚动到视口附近时，批量预取前 6 条详情
  const handleRowVisible = (items: DomainChip[]) => {
    void preloadDetailChunk();
    items.slice(0, 6).forEach(prefetchItem);
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
          <MarqueeRow items={pad(auctionDomains)} direction="ltr" onChipClick={handleChipClick} onPrefetch={handlePrefetch} onVisible={() => handleRowVisible(auctionDomains)} />
        </div>
      )}

      {hotDomains.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Flame className="h-3.5 w-3.5 text-foreground/50" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">热门域名</span>
          </div>
          <MarqueeRow items={pad(hotDomains)} direction="rtl" onChipClick={handleChipClick} onPrefetch={handlePrefetch} onVisible={() => handleRowVisible(hotDomains)} />
        </div>
      )}

      {showSold && soldDomains.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <CheckCircle className="h-3.5 w-3.5 text-foreground/50" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">成交案例</span>
          </div>
          <MarqueeRow items={pad(soldDomains)} direction="ltr" onChipClick={handleChipClick} onPrefetch={handlePrefetch} onVisible={() => handleRowVisible(soldDomains)} />
        </div>
      )}
    </div>
  );
}
