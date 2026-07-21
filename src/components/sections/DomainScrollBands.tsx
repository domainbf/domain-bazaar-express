import { useEffect, useRef, useState } from 'react';
import { Gavel, Flame, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHomeData } from '@/hooks/useHomeData';
import { getDomainDetailPath } from '@/lib/domainRouting';
import { DomainWordmark } from './DomainWordmark';
import { formatPriceCompact } from '@/lib/currency';
import { generateAndSaveDomainLogo } from '@/hooks/useModelScopeAI';

export type BandType = 'auction' | 'hot' | 'sold';

interface DomainChip {
  id: string;
  name: string;
  price: number;
  currency: string;
  logoUrl?: string;
  bandType?: BandType;
}

type LogoState = 'pending' | 'loading' | 'ok' | 'failed';

interface LogoCardProps {
  item: DomainChip;
  onClick: () => void;
  index: number;
  state: LogoState;
  onRetry?: () => void;
}

function LogoCard({ item, onClick, index, state, onRetry }: LogoCardProps) {
  const showSkeleton = !item.logoUrl && (state === 'pending' || state === 'loading');
  const showFailed = !item.logoUrl && state === 'failed';

  return (
    <button
      onClick={onClick}
      title={item.name}
      data-testid={`logo-card-${item.id}-${index}`}
      className="group relative inline-flex flex-col items-center justify-center mx-1.5 shrink-0
        w-[120px] sm:w-[132px] h-[62px] rounded-lg border border-border bg-card
        hover:border-foreground/40 hover:bg-muted/40 transition-all duration-200
        overflow-hidden cursor-pointer"
    >
      {item.logoUrl && (
        <>
          <img
            src={item.logoUrl}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-200"
            decoding="async"
            style={{ filter: 'grayscale(100%) contrast(1.15)' }}
          />
          <div className="absolute inset-0 bg-background/40" />
        </>
      )}

      {showSkeleton && (
        <div className="absolute inset-0 bg-gradient-to-r from-muted/40 via-muted/70 to-muted/40 animate-pulse" />
      )}

      <div className="relative z-10 flex items-center justify-center w-full px-1.5">
        <DomainWordmark name={item.name} className="max-w-[116px] sm:max-w-[128px]" />
      </div>

      <span className="absolute bottom-1 right-1.5 text-[9px] text-muted-foreground/70 font-mono tabular-nums z-10">
        {item.bandType === 'sold' ? '已售' : formatPriceCompact(item.price, item.currency)}
      </span>

      {state === 'loading' && !item.logoUrl && (
        <Loader2 className="absolute top-1 left-1 h-3 w-3 animate-spin text-muted-foreground z-10" />
      )}

      {showFailed && (
        <span
          role="button"
          onClick={(e) => { e.stopPropagation(); onRetry?.(); }}
          className="absolute top-1 left-1 z-20 inline-flex items-center gap-0.5 text-[9px] px-1 py-[1px]
            rounded bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20"
          title="重试生成 Logo"
        >
          <RefreshCw className="h-2.5 w-2.5" />重试
        </span>
      )}
    </button>
  );
}

function MarqueeRow({ items, direction, onChipClick, logoStates, onRetry }: {
  items: DomainChip[];
  direction: 'ltr' | 'rtl';
  onChipClick: (domainName: string) => void;
  logoStates: Record<string, LogoState>;
  onRetry: (item: DomainChip) => void;
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
            index={i}
            state={item.logoUrl ? 'ok' : (logoStates[item.id] ?? 'pending')}
            onRetry={() => onRetry(item)}
          />
        ))}
      </div>
    </div>
  );
}

export function DomainScrollBands({ showSold = false }: { showSold?: boolean }) {
  const navigate = useNavigate();
  const { data: homeData } = useHomeData();
  const logoMap = homeData?.logoMap ?? {};

  const auctionDomains: DomainChip[] = (homeData?.auctionDomains ?? []).map(a => ({
    id: a.id, name: a.name, price: a.price, currency: a.currency,
    logoUrl: logoMap[a.id], bandType: 'auction' as BandType,
  }));

  const rawHot = homeData?.hotDomains ?? [];
  const hotDomains: DomainChip[] = rawHot.slice(0, 20).map(d => ({ ...d, bandType: 'hot' as BandType }));

  const rawSold = showSold ? (homeData?.soldDomains ?? []) : [];
  const soldDomains: DomainChip[] = rawSold.slice(0, 30).map(d => ({ ...d, bandType: 'sold' as BandType }));

  // Logo 生成状态跟踪
  const [logoStates, setLogoStates] = useState<Record<string, LogoState>>({});
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const triggeredRef = useRef<Set<string>>(new Set());

  const setState = (id: string, s: LogoState) =>
    setLogoStates(prev => ({ ...prev, [id]: s }));

  const runOne = async (d: DomainChip): Promise<boolean> => {
    setState(d.id, 'loading');
    const url = await generateAndSaveDomainLogo(d.id, d.name, undefined, undefined, undefined, { triggeredBy: 'homepage-auto' });
    if (url) { setState(d.id, 'ok'); return true; }
    setState(d.id, 'failed');
    return false;
  };

  const retryOne = async (d: DomainChip) => {
    triggeredRef.current.add(d.id);
    await runOne(d);
  };

  // ─── 首次曝光时自动补齐缺失 Logo，串行避免打爆免费额度 ──
  useEffect(() => {
    const pending = [...auctionDomains, ...hotDomains].filter(
      d => !d.logoUrl && !triggeredRef.current.has(d.id)
    );
    if (!pending.length) { setProgress(null); return; }

    let cancelled = false;
    const batch = pending.slice(0, 12);
    setProgress({ done: 0, total: batch.length });

    (async () => {
      for (let i = 0; i < batch.length; i++) {
        if (cancelled) break;
        const d = batch[i];
        triggeredRef.current.add(d.id);
        await runOne(d);
        if (!cancelled) setProgress({ done: i + 1, total: batch.length });
        await new Promise(r => setTimeout(r, 1200));
      }
      if (!cancelled) setTimeout(() => setProgress(null), 800);
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionDomains.length, hotDomains.length]);

  const pad = (arr: DomainChip[]) => (arr.length >= 4 ? arr : [...arr, ...arr]);
  const handleChipClick = (domainName: string) => navigate(getDomainDetailPath(domainName));

  if (!auctionDomains.length && !hotDomains.length) return null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 mb-6 md:mb-8 px-0">
      {progress && progress.total > 0 && progress.done < progress.total && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-border/60 bg-muted/30 text-[11px]">
          <Loader2 className="h-3 w-3 animate-spin text-foreground/70" />
          <span className="text-muted-foreground">正在生成 Logo</span>
          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-foreground/80 transition-all"
              style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
            />
          </div>
          <span className="font-mono tabular-nums text-muted-foreground">{progress.done}/{progress.total}</span>
        </div>
      )}

      {auctionDomains.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Gavel className="h-3.5 w-3.5 text-foreground/50" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">拍卖域名</span>
          </div>
          <MarqueeRow
            items={pad(auctionDomains)} direction="ltr"
            onChipClick={handleChipClick} logoStates={logoStates} onRetry={retryOne}
          />
        </div>
      )}

      {hotDomains.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Flame className="h-3.5 w-3.5 text-foreground/50" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">热门域名</span>
          </div>
          <MarqueeRow
            items={pad(hotDomains)} direction="rtl"
            onChipClick={handleChipClick} logoStates={logoStates} onRetry={retryOne}
          />
        </div>
      )}

      {showSold && soldDomains.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <CheckCircle className="h-3.5 w-3.5 text-foreground/50" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">成交案例</span>
          </div>
          <MarqueeRow
            items={pad(soldDomains)} direction="ltr"
            onChipClick={handleChipClick} logoStates={logoStates} onRetry={retryOne}
          />
        </div>
      )}
    </div>
  );
}
