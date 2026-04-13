import { CheckCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useHomeData } from '@/hooks/useHomeData';
import { getDomainDetailPath } from '@/lib/domainRouting';
import { DomainWordmark } from './DomainWordmark';

interface SoldDomain {
  id: string;
  name: string;
  price: number;
  logoUrl?: string;
}

function formatPrice(p: number) {
  if (!p) return '面议';
  if (p >= 10000) return `¥${(p / 10000).toFixed(p % 10000 === 0 ? 0 : 1)}万`;
  return `¥${p.toLocaleString()}`;
}

function SoldCard({ item, onClick }: { item: SoldDomain; onClick: () => void }) {
  const ext = item.name.includes('.') ? '.' + item.name.split('.').slice(1).join('.') : '';
  const base = item.name.split('.')[0].toUpperCase();

  return (
    <button
      onClick={onClick}
      className="group relative inline-flex flex-col items-center justify-center mx-2 shrink-0
        w-[120px] h-[80px] rounded-xl border border-border bg-card
        hover:border-foreground/40 hover:bg-muted/30 transition-all duration-200 overflow-hidden cursor-pointer"
    >
      {item.logoUrl ? (
        <>
          <img
            src={item.logoUrl}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
            loading="lazy"
            decoding="async"
            style={{ filter: 'grayscale(100%) contrast(1.1)' }}
          />
          <div className="absolute inset-0 bg-background/35" />
          <div className="relative z-10 flex flex-col items-center gap-0.5">
            <span className="text-xs font-black text-foreground tracking-widest leading-none drop-shadow">{base}</span>
            {ext && <span className="text-[9px] text-muted-foreground font-medium">{ext}</span>}
          </div>
        </>
      ) : (
        <DomainWordmark name={item.name} className="max-w-[104px]" />
      )}
      <span className="absolute bottom-1.5 right-2 text-[10px] text-muted-foreground font-mono tabular-nums">
        {formatPrice(item.price)}
      </span>
      <span className="absolute top-1.5 left-1.5">
        <CheckCircle className="h-2.5 w-2.5 text-foreground/55" />
      </span>
    </button>
  );
}

function MarqueeTrack({ items, direction, onClick }: {
  items: SoldDomain[];
  direction: 'ltr' | 'rtl';
  onClick: (domainName: string) => void;
}) {
  if (!items.length) return null;
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden w-full">
      <div
        className={direction === 'rtl' ? 'animate-marquee-rtl' : 'animate-marquee-ltr'}
        style={{ display: 'flex', width: 'max-content', willChange: 'transform' }}
        onMouseEnter={e => (e.currentTarget.style.animationPlayState = 'paused')}
        onMouseLeave={e => (e.currentTarget.style.animationPlayState = 'running')}
      >
        {doubled.map((item, i) => (
          <SoldCard key={`${item.id}-${i}`} item={item} onClick={() => onClick(item.name)} />
        ))}
      </div>
    </div>
  );
}

export function DealsShowcaseSection() {
  const navigate = useNavigate();
  const { data: homeData } = useHomeData();

  const raw = homeData?.soldDomains ?? [];
  const totalSold = homeData?.totalSold ?? 0;

  if (!raw.length) return null;

  const padded: SoldDomain[] = raw.length >= 4 ? raw : [...raw, ...raw];
  const half = Math.ceil(padded.length / 2);
  const row1 = padded.slice(0, half);
  const row2 = padded.slice(half);

  return (
    <section className="py-10 md:py-14 border-y border-border bg-background overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          viewport={{ once: true }}
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <TrendingUp className="h-5 w-5 text-foreground/70" />
          </motion.div>
          <div>
            <h2 className="text-lg font-bold text-foreground">成交案例</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              已有 <span className="font-semibold text-foreground">{totalSold}</span> 个域名在平台成功交易
            </p>
          </div>
        </motion.div>
      </div>

      <div className="space-y-3">
        <MarqueeTrack items={row1} direction="ltr" onClick={(domainName) => navigate(getDomainDetailPath(domainName))} />
        {row2.length > 0 && (
          <MarqueeTrack items={row2} direction="rtl" onClick={(domainName) => navigate(getDomainDetailPath(domainName))} />
        )}
      </div>
    </section>
  );
}
